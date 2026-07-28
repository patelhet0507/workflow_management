import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import { getWorkspaceId } from "@/lib/auth"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const wsId = await getWorkspaceId(req)
  if (!wsId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { data: agent } = await supabase.from("agents").select("*").eq("id", id).eq("workspace_id", wsId).single()
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(agent)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const wsId = await getWorkspaceId(req)
  if (!wsId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { data: agent } = await supabase.from("agents").update(body).eq("id", id).eq("workspace_id", wsId).select().single()
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(agent)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const wsId = await getWorkspaceId(req)
  if (!wsId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await supabase.from("agents").delete().eq("id", id).eq("workspace_id", wsId)
  return NextResponse.json({ success: true })
}
