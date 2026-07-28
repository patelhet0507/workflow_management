import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import { getWorkspaceId } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const wsId = await getWorkspaceId(req)
  if (!wsId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: executions } = await supabase.from("executions").select("started_at, prompt_tokens, completion_tokens").eq("workspace_id", wsId).order("started_at", { ascending: true })
  const groups: Record<string, { input: number; output: number }> = {}
  for (const e of executions || []) {
    const date = (e.started_at || "").slice(0, 10)
    if (!groups[date]) groups[date] = { input: 0, output: 0 }
    groups[date].input += e.prompt_tokens || 0
    groups[date].output += e.completion_tokens || 0
  }
  const data = Object.entries(groups).slice(-14).map(([date, v]) => ({ date: date.slice(-5), ...v }))
  return NextResponse.json(data)
}
