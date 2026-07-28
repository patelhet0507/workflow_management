interface SentinelConfig {
  sentinelUrl: string
  apiKey: string
  agent: { id: string; name: string; model?: string }
  workspaceId: string
  userId?: string
}

const COST_PER_1K: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 0.0025, output: 0.01 },
  "gpt-4o-2024-08-06": { input: 0.0025, output: 0.01 },
  "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  "gpt-4o-mini-2024-07-18": { input: 0.00015, output: 0.0006 },
  "gpt-3.5-turbo": { input: 0.0005, output: 0.0015 },
  "gpt-3.5-turbo-0125": { input: 0.0005, output: 0.0015 },
}

function estimateCost(model: string, promptTokens: number, completionTokens: number): number {
  const rates = COST_PER_1K[model]
  if (!rates) return 0
  return (promptTokens / 1000) * rates.input + (completionTokens / 1000) * rates.output
}

async function sendEvent(config: SentinelConfig, event: {
  eventType: string
  data: Record<string, any>
  severity: "info" | "warning" | "critical"
}) {
  try {
    await fetch(`${config.sentinelUrl}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": config.apiKey },
      body: JSON.stringify({
        execution: {
          agent_id: config.agent.id,
          workspace_id: config.workspaceId,
          user_id: config.userId,
          ai_model: config.agent.model || "gpt-4o",
          provider: "openai",
          status: event.severity === "critical" ? "failed" : "success",
          ...event.data,
        },
        eventType: event.eventType,
        agentId: config.agent.id,
        workspaceId: config.workspaceId,
        userId: config.userId,
        data: event.data,
        severity: event.severity,
      }),
    })
  } catch {} // ponytail: telemetry must never crash the app
}

export class Sentinel {
  private config: SentinelConfig

  constructor(config: SentinelConfig) {
    this.config = config
  }

  wrap<T extends { chat: { completions: { create: Function } } }>(client: T): T {
    const config = this.config
    const proto = Object.getPrototypeOf(client)
    if (!proto || !proto.chat || !proto.chat.completions) return client

    const originalCreate = proto.chat.completions.create.bind(client)
    proto.chat.completions.create = async function (params: any) {
      const start = Date.now()
      try {
        const result = await originalCreate(params)
        const latency = Date.now() - start
        const usage = result?.usage || {}

        sendEvent(config, {
          eventType: "ExecutionSucceeded",
          severity: "info",
          data: {
            action: params.tools?.length ? "tool_call" : "chat_completion",
            model: params.model || config.agent.model || "gpt-4o",
            prompt_tokens: usage.prompt_tokens || 0,
            completion_tokens: usage.completion_tokens || 0,
            total_tokens: usage.total_tokens || 0,
            cost: estimateCost(params.model, usage.prompt_tokens || 0, usage.completion_tokens || 0),
            duration: latency,
            started_at: new Date(start).toISOString(),
            finished_at: new Date().toISOString(),
          },
        })

        return result
      } catch (error: any) {
        const latency = Date.now() - start

        sendEvent(config, {
          eventType: "ExecutionFailed",
          severity: "critical",
          data: {
            action: "chat_completion",
            model: params.model || config.agent.model || "gpt-4o",
            error: error?.message || String(error),
            duration: latency,
            started_at: new Date(start).toISOString(),
            finished_at: new Date().toISOString(),
          },
        })

        throw error
      }
    }

    return client
  }
}
