import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import { getWorkspaceId } from "@/lib/auth"
import { eventBus } from "@/lib/event-bus"

export async function POST(req: NextRequest) {
  const wsId = await getWorkspaceId(req)
  if (!wsId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  if (body.agentId) {
    const { data: existing } = await supabase.from("agents").select("id").eq("id", body.agentId).maybeSingle()
    if (!existing) {
      await supabase.from("agents").insert({
        id: body.agentId,
        name: body.agentName || body.agentId,
        workspace_id: wsId,
        owner_id: body.userId,
        ai_model: body.execution?.ai_model || body.data?.model || "gpt-4o",
      })
    }
  }

  if (body.execution) {
    const { data: exec } = await supabase.from("executions").insert({ ...body.execution, workspace_id: wsId }).select().single()
    if (!exec) return NextResponse.json({ error: "Failed to create execution" }, { status: 500 })
    const { data: event } = await supabase.from("events").insert({
      event_type: body.eventType || "ExecutionStarted",
      execution_id: exec.id,
      agent_id: body.agentId,
      workspace_id: wsId,
      user_id: body.userId,
      data: body.data || {},
      severity: body.severity || "info",
    }).select().single()
    if (event) eventBus.emit(`event:${wsId}`, { eventId: event.id, eventType: event.event_type, timestamp: event.timestamp, severity: event.severity, metadata: event.data, source: "proxy", duration: body.execution.duration || 0 })
    return NextResponse.json(exec, { status: 201 })
  }

  const { data: event } = await supabase.from("events").insert({
    event_type: body.eventType || "CustomEvent",
    execution_id: body.executionId,
    agent_id: body.agentId,
    workspace_id: wsId,
    user_id: body.userId,
    data: body.data || {},
    severity: body.severity || "info",
  }).select().single()
  if (event) eventBus.emit(`event:${wsId}`, { eventId: event.id, eventType: event.event_type, timestamp: event.timestamp, severity: event.severity, metadata: event.data, source: "proxy" })

  return NextResponse.json(event, { status: 201 })
}
