import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import { getWorkspaceId } from "@/lib/auth"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const wsId = await getWorkspaceId(req)
  if (!wsId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { data: policy } = await supabase.from("policies").update(body).eq("id", id).eq("workspace_id", wsId).select().single()
  if (!policy) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(policy)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const wsId = await getWorkspaceId(req)
  if (!wsId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await supabase.from("policies").delete().eq("id", id).eq("workspace_id", wsId)
  return NextResponse.json({ success: true })
}
