import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import { getWorkspaceId } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const wsId = await getWorkspaceId(req)
  if (!wsId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200)
  const type = searchParams.get("type")

  let query = supabase.from("events").select("*, agent:agent_id(name)").eq("workspace_id", wsId).order("timestamp", { ascending: false }).limit(limit)
  if (type && type !== "all") query = query.eq("event_type", type)

  const { data: events } = await query

  return NextResponse.json((events || []).map((e: any) => ({
    id: e.id,
    time: e.timestamp,
    agent: e.agent?.name || "Unknown",
    action: e.event_type,
    status: e.severity === "critical" ? "failed" : e.severity === "warning" ? "warning" : "success",
    duration: e.data?.duration || 0,
    cost: e.data?.cost || 0,
  })))
}
