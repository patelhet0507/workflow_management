import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import { getWorkspaceId } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const wsId = await getWorkspaceId(req)
  if (!wsId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data } = await supabase.from("workspaces").select("id, name, plan, region, created_at").eq("id", wsId).single()
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const wsId = await getWorkspaceId(req)
  if (!wsId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const updates: Record<string, string> = {}
  if (body.name) updates.name = body.name
  if (body.region) updates.region = body.region

  const { data, error } = await supabase.from("workspaces").update(updates).eq("id", wsId).select("id, name, plan, region, created_at").single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
