import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import { getWorkspaceId, getUserRole } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const wsId = await getWorkspaceId(req)
  if (!wsId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = await getUserRole(req)
  if (role !== "Admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { data: users } = await supabase.from("users").select("*").eq("workspace_id", wsId).order("last_active", { ascending: false })
  return NextResponse.json((users || []).map((u: any) => ({ ...u, id: u.id })))
}

export async function POST(req: NextRequest) {
  const wsId = await getWorkspaceId(req)
  if (!wsId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = await getUserRole(req)
  if (role !== "Admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const { data, error } = await supabase.from("users").insert({ ...body, workspace_id: wsId }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
