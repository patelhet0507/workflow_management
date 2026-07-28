import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import { getWorkspaceId } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const wsId = await getWorkspaceId(req)
  if (!wsId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: invoices } = await supabase.from("invoices").select("*").eq("workspace_id", wsId).order("date", { ascending: false })
  const totalSpend = (invoices || []).reduce((s: number, i: any) => s + (i.amount || 0), 0)
  const monthlySpend = invoices?.[0]?.amount || 0
  const projectedCost = Math.round(monthlySpend * 1.15 * 100) / 100

  return NextResponse.json({
    plan: "Enterprise",
    status: "active",
    monthlySpend,
    projectedCost,
    billingEmail: "billing@sentinel.ai",
    nextBill: new Date(Date.now() + 14 * 86400000),
    invoices: (invoices || []).map((i: any) => ({ ...i, id: i.id })),
  })
}
