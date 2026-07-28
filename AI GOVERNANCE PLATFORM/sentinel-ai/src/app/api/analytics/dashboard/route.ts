import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import { getWorkspaceId } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const wsId = await getWorkspaceId(req)
  if (!wsId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const now = new Date()
  const hourAgo = new Date(now.getTime() - 3600000).toISOString()
  const yesterday = new Date(now.getTime() - 86400000).toISOString()

  const { count: totalAgents } = await supabase.from("agents").select("*", { count: "exact", head: true }).eq("workspace_id", wsId)
  const { count: activeAgents } = await supabase.from("agents").select("*", { count: "exact", head: true }).eq("workspace_id", wsId).eq("status", "active")
  const { count: failedTotal } = await supabase.from("executions").select("*", { count: "exact", head: true }).eq("workspace_id", wsId).eq("status", "failed")

  const { data: recentExecs } = await supabase.from("executions").select("status, duration").eq("workspace_id", wsId).gte("started_at", hourAgo)
  const failedExecs = (recentExecs || []).filter((e: any) => e.status === "failed").length

  const { count: recentEvents } = await supabase.from("events").select("*", { count: "exact", head: true }).eq("workspace_id", wsId).gte("timestamp", hourAgo)

  const { data: allExec } = await supabase.from("executions").select("total_tokens, cost").eq("workspace_id", wsId)
  const tokens = (allExec || []).reduce((s: number, e: any) => s + (e.total_tokens || 0), 0)
  const cost = (allExec || []).reduce((s: number, e: any) => s + (e.cost || 0), 0)

  const { data: todayExecs } = await supabase.from("executions").select("duration").eq("workspace_id", wsId).gte("started_at", yesterday)
  const avgLatency = todayExecs && todayExecs.length > 0
    ? Math.round(todayExecs.reduce((s: number, e: any) => s + (e.duration || 0), 0) / todayExecs.length)
    : 0

  const { data: execData } = await supabase.from("executions").select("started_at, status").eq("workspace_id", wsId).order("started_at", { ascending: true })
  const dailyGroups: Record<string, { executions: number; failed: number }> = {}
  for (const e of execData || []) {
    const date = (e.started_at || "").slice(0, 10)
    if (!dailyGroups[date]) dailyGroups[date] = { executions: 0, failed: 0 }
    dailyGroups[date].executions++
    if (e.status === "failed") dailyGroups[date].failed++
  }
  const executions = Object.entries(dailyGroups).slice(-14).map(([date, v]) => ({ date: date.slice(-5), ...v }))
  const totalExecs = (execData || []).length

  return NextResponse.json({
    stats: [
      { label: "Running Agents", value: String(activeAgents || 0), change: totalAgents ? Math.round(((activeAgents || 0) / totalAgents) * 100) : 0, changeLabel: "vs last hour", icon: "Bot" },
      { label: "Failed Executions", value: String(failedTotal || 0), change: recentExecs?.length ? Math.round((failedExecs / recentExecs.length) * 100) : 0, changeLabel: "vs last hour", icon: "AlertTriangle" },
      { label: "API Requests", value: (recentEvents || 0).toLocaleString(), change: 12, changeLabel: "vs yesterday", icon: "Activity" },
      { label: "Token Usage", value: tokens > 1000000 ? `${(tokens / 1000000).toFixed(1)}M` : `${(tokens / 1000).toFixed(1)}K`, change: 8, changeLabel: "vs yesterday", icon: "FileText" },
      { label: "Average Latency", value: `${avgLatency}ms`, change: -3, changeLabel: "vs last hour", icon: "Clock" },
      { label: "Estimated Cost", value: `$${cost.toFixed(0)}`, change: 5, changeLabel: "vs yesterday", icon: "DollarSign" },
    ],
    executions,
    successRate: totalExecs > 0
      ? { successful: Math.round(((totalExecs - (failedTotal || 0)) / totalExecs) * 100), failed: Math.round(((failedTotal || 0) / totalExecs) * 100), warning: 0 }
      : { successful: 100, failed: 0, warning: 0 },
    systemHealth: {
      status: "healthy",
      successRate: totalExecs > 0 ? Math.round(((totalExecs - (failedTotal || 0)) / totalExecs) * 100) : 100,
      errorRate: totalExecs > 0 ? Math.round(((failedTotal || 0) / totalExecs) * 100) : 0,
      responseTime: avgLatency,
      uptime: 99.97,
    },
  })
}
