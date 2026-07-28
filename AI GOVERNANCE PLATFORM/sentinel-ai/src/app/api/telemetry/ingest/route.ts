import { NextRequest, NextResponse } from "next/server"
import { getWorkspaceId } from "@/lib/auth"
import { eventBus } from "@/lib/event-bus"
import { supabase } from "@/lib/db"

export async function POST(req: NextRequest) {
  const wsId = await getWorkspaceId(req)
  if (!wsId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  if (body.type === "metrics") {
    eventBus.emit(`metrics:${wsId}`, body)
    return NextResponse.json({ ok: true })
  }

  eventBus.emit(`event:${wsId}`, body)

  supabase.from("events").insert({
    event_type: body.eventType || "TelemetryEvent",
    agent_id: body.agentId || body.metadata?.agentId || null,
    workspace_id: wsId,
    user_id: body.userId || null,
    data: body.metadata || body.data || {},
    severity: body.severity || "info",
    timestamp: body.timestamp || new Date().toISOString(),
    execution_id: body.executionId || null,
  }).then()

  return NextResponse.json({ ok: true })
}
