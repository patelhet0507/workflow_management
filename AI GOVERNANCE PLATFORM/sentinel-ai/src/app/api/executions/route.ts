import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import { getWorkspaceId } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const wsId = await getWorkspaceId(req)
  if (!wsId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const agentId = searchParams.get("agentId")
  const status = searchParams.get("status")

  let query = supabase.from("executions").select("*, agent:agent_id(name)").eq("workspace_id", wsId).order("started_at", { ascending: false }).limit(200)
  if (agentId) query = query.eq("agent_id", agentId)
  if (status) query = query.eq("status", status)

  const { data: executions } = await query

  return NextResponse.json((executions || []).map((e: any) => ({
    ...e,
    id: e.id,
    agent: e.agent?.name || "Unknown",
    agentId: undefined,
  })))
}
