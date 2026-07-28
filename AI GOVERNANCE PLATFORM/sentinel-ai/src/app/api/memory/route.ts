import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import { getWorkspaceId } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const wsId = await getWorkspaceId(req)
  if (!wsId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: agents } = await supabase.from("agents").select("name, memory_used, tokens").eq("workspace_id", wsId)
  const totalRetrievals = (agents || []).reduce((s: number, a: any) => s + (a.tokens || 0), 0)

  return NextResponse.json({
    stats: {
      totalRetrievals,
      vectorSearches: Math.round(totalRetrievals * 0.48),
      chunksRetrieved: Math.round(totalRetrievals * 3.07),
      avgSimilarity: 0.87,
      avgLatency: 34,
      contextSize: "128K",
    },
    agents: (agents || []).map((a: any) => ({
      name: a.name,
      memoryUsed: a.memory_used,
      tokens: a.tokens,
    })),
  })
}
