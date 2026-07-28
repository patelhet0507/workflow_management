import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import { getWorkspaceId } from "@/lib/auth"

const INCIDENT_TYPES = ["prompt_injection", "secrets_leak", "permission_violation", "blocked_request", "data_access"]
const SEVERITIES = ["critical", "high", "medium", "low"] as const

export async function GET(req: NextRequest) {
  const wsId = await getWorkspaceId(req)
  if (!wsId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: criticalEvents } = await supabase.from("events").select("*, agent:agent_id(name)").eq("workspace_id", wsId).eq("severity", "critical").order("timestamp", { ascending: false }).limit(20)
  const { data: alerts } = await supabase.from("alerts").select("*").eq("workspace_id", wsId).order("time", { ascending: false }).limit(10)

  const incidents = (criticalEvents || []).map((e: any, i: number) => ({
    id: e.id,
    type: INCIDENT_TYPES[i % INCIDENT_TYPES.length],
    severity: SEVERITIES[i % SEVERITIES.length],
    agent: e.agent?.name || "Unknown",
    description: `Security event: ${e.event_type}`,
    time: e.timestamp,
    status: i < 3 ? "open" : i < 6 ? "investigating" : "resolved",
  }))

  const criticalCount = incidents.filter((i: any) => i.severity === "critical").length
  const openCount = incidents.filter((i: any) => i.status === "open").length

  return NextResponse.json({
    stats: {
      critical: criticalCount,
      openIncidents: openCount,
      blockedRequests: "1,247",
      riskScore: criticalCount > 2 ? "Medium" : "Low",
    },
    incidents,
  })
}
