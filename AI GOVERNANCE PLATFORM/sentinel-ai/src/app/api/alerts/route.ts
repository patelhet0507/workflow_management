import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import { getWorkspaceId } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const wsId = await getWorkspaceId(req)
  if (!wsId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: alerts } = await supabase.from("alerts").select("*").eq("workspace_id", wsId).order("time", { ascending: false }).limit(20)
  return NextResponse.json((alerts || []).map((a: any) => ({ ...a, id: a.id })))
}
