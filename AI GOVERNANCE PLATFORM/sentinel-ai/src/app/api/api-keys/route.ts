import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import { getWorkspaceId } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const wsId = await getWorkspaceId(req)
  if (!wsId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { data } = await supabase.from("api_keys").select("*").eq("workspace_id", wsId).eq("revoked", false).order("created_at", { ascending: false })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const wsId = await getWorkspaceId(req)
  if (!wsId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { name } = await req.json()
  const key = "sk-" + crypto.randomUUID().replace(/-/g, "")
  const { data } = await supabase.from("api_keys").insert({ workspace_id: wsId, name: name || "Default", key }).select().single()
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const wsId = await getWorkspaceId(req)
  if (!wsId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await req.json()
  await supabase.from("api_keys").update({ revoked: true }).eq("id", id).eq("workspace_id", wsId)
  return NextResponse.json({ success: true })
}
