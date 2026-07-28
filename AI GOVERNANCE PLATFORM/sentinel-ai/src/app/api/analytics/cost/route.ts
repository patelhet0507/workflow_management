import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import { getWorkspaceId } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const wsId = await getWorkspaceId(req)
  if (!wsId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: executions } = await supabase.from("executions").select("started_at, cost").eq("workspace_id", wsId).order("started_at", { ascending: true })
  const groups: Record<string, number> = {}
  for (const e of executions || []) {
    const date = (e.started_at || "").slice(0, 10)
    groups[date] = (groups[date] || 0) + (e.cost || 0)
  }
  const data = Object.entries(groups).slice(-14).map(([date, cost]) => ({
    date: date.slice(-5),
    cost: Math.round(cost * 100) / 100,
  }))
  return NextResponse.json(data)
}
