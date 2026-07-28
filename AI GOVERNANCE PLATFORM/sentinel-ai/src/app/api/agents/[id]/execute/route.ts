import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import { getWorkspaceId } from "@/lib/auth"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const wsId = await getWorkspaceId(req)
  if (!wsId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { data: agent } = await supabase.from("agents").select("*").eq("id", id).eq("workspace_id", wsId).single()
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { prompt: userPrompt } = await req.json()
  const prompt = userPrompt || `You are ${agent.name}, an AI agent in the ${agent.category} category. Perform a routine analysis.`

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 400 })

  const startedAt = new Date()
  let status = "success"
  let result = ""
  let promptTokens = 0
  let completionTokens = 0
  let totalTokens = 0
  let cost = 0

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: agent.ai_model || "gpt-4o",
        messages: [
          { role: "system", content: `You are ${agent.name}, an AI governance agent specialized in ${agent.category}. Respond concisely.` },
          { role: "user", content: prompt },
        ],
        max_tokens: 1024,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      throw new Error(`OpenAI API error (${res.status}): ${errBody}`)
    }

    const data = await res.json()
    result = data.choices?.[0]?.message?.content || ""
    promptTokens = data.usage?.prompt_tokens || 0
    completionTokens = data.usage?.completion_tokens || 0
    totalTokens = data.usage?.total_tokens || 0
    // ponytail: gpt-4o-mini $0.15/$0.60 per 1M I/O tokens, gpt-4o $2.50/$10.00
    cost = (promptTokens * 0.0000025) + (completionTokens * 0.00001)
  } catch (err: any) {
    status = "failed"
    result = err.message
  }

  const finishedAt = new Date()
  const duration = Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000)

  const { data: execution } = await supabase.from("executions").insert({
    agent_id: id,
    workspace_id: wsId,
    status,
    provider: "openai",
    ai_model: agent.ai_model,
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: totalTokens,
    cost,
    duration,
    action: "execute",
    metadata: { prompt, result },
    started_at: startedAt.toISOString(),
    finished_at: finishedAt.toISOString(),
  }).select().single()

  await supabase.from("agents").update({
    status: status === "success" ? "active" : "error",
    last_run: finishedAt.toISOString(),
    execution_count: (agent.execution_count || 0) + 1,
  }).eq("id", id)

  return NextResponse.json({ execution, result, status })
}
