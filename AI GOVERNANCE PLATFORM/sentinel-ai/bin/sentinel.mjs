#!/usr/bin/env node

import { spawn } from "child_process"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const BASE = process.env.SENTINEL_URL || "http://localhost:3000"
const API_KEY = process.env.SENTINEL_API_KEY || ""
const __dirname = dirname(fileURLToPath(import.meta.url))

async function main() {
  const cmd = process.argv[2]

  if (!API_KEY) {
    console.error("SENTINEL_API_KEY not set. Create one at Settings → API Keys, then:\n  $env:SENTINEL_API_KEY=\"sk-...\"")
    process.exit(1)
  }

  if (cmd === "run") {
    const prompt = process.argv[3]
    if (!prompt) {
      console.error("Usage: sentinel run \"your prompt\"")
      process.exit(1)
    }
    await runPrompt(prompt)
  } else if (cmd === "proxy") {
    await startProxy()
  } else if (cmd === "monitor") {
    await startMonitor()
  } else {
    console.log(`Sentinel AI CLI

Commands:
  sentinel run "prompt"   Execute a prompt through an agent
  sentinel proxy          Start monitoring proxy for AI tools
  sentinel monitor        Start runtime collector (fs watch + system + proxy)

Env:
  SENTINEL_URL       Platform URL (default: http://localhost:3000)
  SENTINEL_API_KEY   API key from Settings → API Keys`)
  }
}

async function runPrompt(prompt) {
  const agent = await detectAgent()
  if (!agent) {
    console.error("No agents found. Register one at the Agents page first.")
    process.exit(1)
  }

  console.log(`\n  Agent: ${agent.name} (${agent.ai_model})\n  Task:  ${prompt}\n`)

  const res = await fetch(`${BASE}/api/agents/${agent.id}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
    body: JSON.stringify({ prompt }),
  })

  const data = await res.json()
  if (!res.ok) {
    console.error(`  Error: ${data.error}`)
    process.exit(1)
  }

  console.log(`  Result:\n${"\u2500".repeat(50)}\n${data.result || "(empty)"}\n${"\u2500".repeat(50)}`)
  console.log(`  Status: ${data.status}  |  Tokens: ${data.execution?.total_tokens || 0}  |  Cost: $${(data.execution?.cost || 0).toFixed(6)}  |  ${data.execution?.duration || 0}s`)
}

async function detectAgent() {
  const res = await fetch(`${BASE}/api/agents`, { headers: { "x-api-key": API_KEY } })
  if (!res.ok) return null
  const agents = await res.json()
  return agents[0] || null
}

async function startProxy() {
  let wsId = process.env.WORKSPACE_ID
  if (!wsId) {
    try {
      const res = await fetch(`${BASE}/api/workspace`, { headers: { "x-api-key": API_KEY } })
      if (res.ok) {
        const ws = await res.json()
        wsId = ws.id
      }
    } catch {}
  }
  if (!wsId) {
    console.error("Could not detect WORKSPACE_ID. Set it manually:\n  $env:WORKSPACE_ID=\"...\"")
    process.exit(1)
  }

  const port = process.env.PORT || "8080"
  const upstream = process.env.UPSTREAM || "https://api.openai.com"
  const provider = process.env.PROVIDER || "openai"
  const agentId = process.env.AGENT_ID || "ai-agent"

  console.log(`\n  Starting AI Proxy on port ${port}`)
  console.log(`  Forwarding: ${upstream}`)
  console.log(`  Provider:   ${provider}`)
  console.log(`  Workspace:  ${wsId}`)
  console.log(`  Agent ID:   ${agentId}`)
  console.log(`\n  Point your AI tools to:\n    http://localhost:${port}\n`)
  console.log(`  OpenCode:   $env:OPENAI_BASE_URL="http://localhost:${port}/v1"`)
  console.log(`  Claude:     $env:ANTHROPIC_BASE_URL="http://localhost:${port}"`)
  console.log(`\n  Dashboard will show real-time data.\n`)

  const proxyPath = resolve(__dirname, "..", "src", "scripts", "ai-proxy.ts")
  const child = spawn("node", ["--import", "tsx/esm", proxyPath], {
    stdio: "inherit",
    env: {
      ...process.env,
      SENTINEL_URL: BASE,
      SENTINEL_API_KEY: API_KEY,
      WORKSPACE_ID: wsId,
      AGENT_ID: agentId,
      PORT: port,
      UPSTREAM: upstream,
      PROVIDER: provider,
    },
  })
  child.on("exit", (code) => process.exit(code ?? 1))
}

async function startMonitor() {
  let wsId = process.env.WORKSPACE_ID
  if (!wsId) {
    try {
      const res = await fetch(`${BASE}/api/workspace`, { headers: { "x-api-key": API_KEY } })
      if (res.ok) { const ws = await res.json(); wsId = ws.id }
    } catch {}
  }

  const collectorPath = resolve(__dirname, "..", "src", "collector", "index.ts")
  const proxyPath = resolve(__dirname, "..", "src", "scripts", "ai-proxy.ts")

  const proxy = spawn("node", ["--import", "tsx/esm", proxyPath], {
    stdio: "inherit",
    env: {
      ...process.env, SENTINEL_URL: BASE, SENTINEL_API_KEY: API_KEY,
      WORKSPACE_ID: wsId || "", AGENT_ID: process.env.AGENT_ID || "ai-agent",
      PORT: process.env.PORT || "8080", PROVIDER: process.env.PROVIDER || "openai",
    },
  })

  const collector = spawn("node", ["--import", "tsx/esm", collectorPath], {
    stdio: "inherit",
    env: { ...process.env, SENTINEL_URL: BASE, SENTINEL_API_KEY: API_KEY },
  })

  process.on("SIGINT", () => { proxy.kill(); collector.kill(); process.exit(0) })
  process.on("SIGTERM", () => { proxy.kill(); collector.kill(); process.exit(0) })

  proxy.on("exit", () => { collector.kill(); process.exit(0) })
  collector.on("exit", () => { proxy.kill(); process.exit(0) })
}

main().catch(console.error)
