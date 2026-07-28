import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import { getWorkspaceId } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const wsId = await getWorkspaceId(req)
  if (!wsId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: policies } = await supabase.from("policies").select("*").eq("workspace_id", wsId).order("created_at", { ascending: false })
  return NextResponse.json((policies || []).map((p: any) => ({ ...p, id: p.id })))
}

export async function POST(req: NextRequest) {
  const wsId = await getWorkspaceId(req)
  if (!wsId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { data } = await supabase.from("policies").insert({ ...body, workspace_id: wsId }).select().single()
  return NextResponse.json(data, { status: 201 })
}
