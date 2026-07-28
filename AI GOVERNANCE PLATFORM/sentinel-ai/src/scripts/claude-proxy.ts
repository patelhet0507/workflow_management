import http from "http"
import https from "https"

const SENTINEL_URL = process.env.SENTINEL_URL || "http://localhost:3000"
const SENTINEL_API_KEY = process.env.SENTINEL_API_KEY || ""
const WORKSPACE_ID = process.env.WORKSPACE_ID || ""
const AGENT_ID = process.env.AGENT_ID || "claude-cli"
const PORT = parseInt(process.env.PORT || "8080")

if (!SENTINEL_API_KEY) { console.error("SENTINEL_API_KEY required"); process.exit(1) }

const server = http.createServer((req, res) => {
  if (req.method !== "POST" || !req.url?.includes("/v1/messages")) {
    res.writeHead(404); res.end("Not found"); return
  }

  const bodyChunks: Buffer[] = []
  req.on("data", (chunk) => bodyChunks.push(chunk))
  req.on("end", async () => {
    const reqBody = Buffer.concat(bodyChunks).toString()
    const start = Date.now()
    const parsed = JSON.parse(reqBody)
    const model = parsed.model || "claude-sonnet-4-20250514"

    const options = {
      hostname: "api.anthropic.com",
      port: 443,
      path: "/v1/messages",
      method: "POST",
      headers: { ...req.headers, host: "api.anthropic.com" },
    }

    const proxyReq = https.request(options, (proxyRes) => {
      const chunks: Buffer[] = []
      proxyRes.on("data", (c) => chunks.push(c))

      proxyRes.on("end", () => {
        const body = Buffer.concat(chunks).toString()
        const latency = Date.now() - start
        let usage: any = {}

        try {
          const data = JSON.parse(body)
          usage = data.usage || {}
          if (usage.input_tokens || usage.output_tokens) {
            sendTelemetry({ model, latency, prompt_tokens: usage.input_tokens || 0, completion_tokens: usage.output_tokens || 0, total_tokens: (usage.input_tokens || 0) + (usage.output_tokens || 0) })
          }
        } catch {}

        res.writeHead(proxyRes.statusCode || 200, proxyRes.headers)
        res.end(body)
      })
    })

    proxyReq.on("error", (err) => {
      sendTelemetry({ model, latency: Date.now() - start, error: err.message })
      res.writeHead(502); res.end(JSON.stringify({ error: err.message }))
    })

    proxyReq.write(reqBody)
    proxyReq.end()
  })
})

function sendTelemetry(data: any) {
  const body = JSON.stringify({
    execution: {
      agent_id: AGENT_ID,
      workspace_id: WORKSPACE_ID,
      ai_model: data.model,
      provider: "anthropic",
      status: data.error ? "failed" : "success",
      prompt_tokens: data.prompt_tokens || 0,
      completion_tokens: data.completion_tokens || 0,
      total_tokens: data.total_tokens || 0,
      duration: data.latency,
      action: "chat_completion",
      started_at: new Date(Date.now() - (data.latency || 0)).toISOString(),
      finished_at: new Date().toISOString(),
    },
    eventType: data.error ? "ExecutionFailed" : "ExecutionSucceeded",
    agentId: AGENT_ID,
    workspaceId: WORKSPACE_ID,
    severity: data.error ? "critical" : "info",
    data,
  })

  const url = new URL(SENTINEL_URL)
  const p = url.port ? parseInt(url.port) : url.protocol === "https:" ? 443 : 80
  const client = url.protocol === "https:" ? https : http
  const opts = { hostname: url.hostname, port: p, path: "/api/events", method: "POST", headers: { "Content-Type": "application/json", "x-api-key": SENTINEL_API_KEY, "Content-Length": Buffer.byteLength(body) } }
  const r = client.request(opts)
  r.write(body)
  r.end()
}

server.listen(PORT, () => console.log(`Claude Proxy running on http://localhost:${PORT} → forwarding to api.anthropic.com`))
