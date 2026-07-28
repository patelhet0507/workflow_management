import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import { getWorkspaceId, getUserRole } from "@/lib/auth"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const wsId = await getWorkspaceId(req)
  if (!wsId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { data: user } = await supabase.from("users").select("id, name, email, role, avatar, status, last_active, auth_id").eq("id", id).eq("workspace_id", wsId).single()
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(user)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const wsId = await getWorkspaceId(req)
  if (!wsId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = await getUserRole(req)
  if (role !== "Admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  if (body.role && !["Admin", "User"].includes(body.role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  const updates: Record<string, string> = {}
  if (body.role) updates.role = body.role

  const { data, error } = await supabase.from("users").update(updates).eq("id", id).eq("workspace_id", wsId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
