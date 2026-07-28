import http from "http"
import https from "https"

const SENTINEL_URL = process.env.SENTINEL_URL || "http://localhost:3000"
const SENTINEL_API_KEY = process.env.SENTINEL_API_KEY || ""
const WORKSPACE_ID = process.env.WORKSPACE_ID || ""
const AGENT_ID = process.env.AGENT_ID || "ai-agent"
const PORT = parseInt(process.env.PORT || "8080")
const UPSTREAM = process.env.UPSTREAM || "https://api.openai.com"
const PROVIDER = process.env.PROVIDER || "openai"

if (!SENTINEL_API_KEY) { console.error("SENTINEL_API_KEY required"); process.exit(1) }

const upstreamUrl = new URL(UPSTREAM)

const server = http.createServer((req, res) => {
  const bodyChunks: Buffer[] = []
  req.on("data", (c) => bodyChunks.push(c))
  req.on("end", () => {
    const reqBody = Buffer.concat(bodyChunks).toString()
    const start = Date.now()
    let parsed: any = {}
    try { parsed = JSON.parse(reqBody) } catch {}
    const model = parsed.model || "unknown"

    const options = {
      hostname: upstreamUrl.hostname,
      port: upstreamUrl.protocol === "https:" ? 443 : 80,
      path: req.url || "/v1/messages",
      method: req.method || "POST",
      headers: { ...req.headers, host: upstreamUrl.hostname },
    }

    const proxyReq = (upstreamUrl.protocol === "https:" ? https : http).request(options, (proxyRes) => {
      const chunks: Buffer[] = []
      proxyRes.on("data", (c) => chunks.push(c))
      proxyRes.on("end", () => {
        const body = Buffer.concat(chunks).toString()
        const latency = Date.now() - start
        let data: any = {}
        try { data = JSON.parse(body) } catch {}

        const telemetry = extractTelemetry(PROVIDER, model, data, latency)
        sendTelemetry(telemetry)

        res.writeHead(proxyRes.statusCode || 200, proxyRes.headers)
        res.end(body)
      })
    })

    proxyReq.on("error", (err) => {
      sendTelemetry(extractTelemetry(PROVIDER, model, { error: err.message }, Date.now() - start))
      res.writeHead(502); res.end(JSON.stringify({ error: err.message }))
    })

    proxyReq.write(reqBody)
    proxyReq.end()
  })
})

function extractTelemetry(provider: string, model: string, data: any, latency: number) {
  if (provider === "openai" || data.usage?.prompt_tokens !== undefined) {
    const usage = data.usage || {}
    const choice = data.choices?.[0] || {}
    return {
      model,
      latency,
      prompt_tokens: usage.prompt_tokens || 0,
      completion_tokens: usage.completion_tokens || 0,
      total_tokens: usage.total_tokens || 0,
      error: data.error?.message || data.error || "",
      finish_reason: choice.finish_reason || "",
    }
  }
  if (provider === "anthropic") {
    const usage = data.usage || {}
    return {
      model,
      latency,
      prompt_tokens: usage.input_tokens || 0,
      completion_tokens: usage.output_tokens || 0,
      total_tokens: (usage.input_tokens || 0) + (usage.output_tokens || 0),
      error: data.error?.message || data.error?.type || "",
      stop_reason: data.stop_reason || "",
    }
  }
  return { model, latency, error: "", prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
}

function sendTelemetry(t: any) {
  const body = JSON.stringify({
    execution: {
      agent_id: AGENT_ID,
      workspace_id: WORKSPACE_ID,
      ai_model: t.model,
      provider: PROVIDER,
      status: t.error ? "failed" : "success",
      prompt_tokens: t.prompt_tokens || 0,
      completion_tokens: t.completion_tokens || 0,
      total_tokens: t.total_tokens || 0,
      duration: t.latency,
      action: "chat_completion",
      started_at: new Date(Date.now() - (t.latency || 0)).toISOString(),
      finished_at: new Date().toISOString(),
    },
    eventType: t.error ? "ExecutionFailed" : "ExecutionSucceeded",
    agentId: AGENT_ID,
    workspaceId: WORKSPACE_ID,
    severity: t.error ? "critical" : "info",
    data: t,
  })

  const url = new URL(SENTINEL_URL)
  const p = url.port ? parseInt(url.port) : url.protocol === "https:" ? 443 : 80
  const client = url.protocol === "https:" ? https : http
  const opts = { hostname: url.hostname, port: p, path: "/api/events", method: "POST", headers: { "Content-Type": "application/json", "x-api-key": SENTINEL_API_KEY, "Content-Length": Buffer.byteLength(body) } }
  const r = client.request(opts)
  r.write(body)
  r.end()
}

const help = `
╔══════════════════════════════════════════════════════╗
║  Sentinel AI Proxy                                   ║
║  Intercepts LLM calls → sends telemetry to dashboard ║
╚══════════════════════════════════════════════════════╝

  USAGE:
    $env:UPSTREAM="https://api.anthropic.com"
    $env:PROVIDER="anthropic"
    $env:SENTINEL_URL="http://localhost:3000"
    $env:SENTINEL_API_KEY="sk-..."
    $env:WORKSPACE_ID="..."
    npx tsx src/scripts/ai-proxy.ts

  Claude Code:
    $env:ANTHROPIC_BASE_URL="http://localhost:8080"
    claude

  OpenCode:
    $env:OPENAI_BASE_URL="http://localhost:8080/v1"
    opencode

  OpenAI SDK:
    $env:OPENAI_BASE_URL="http://localhost:8080/v1"
    python my_script.py
`
server.listen(PORT, () => console.log(`AI Proxy running on http://localhost:${PORT} → ${UPSTREAM}`))
