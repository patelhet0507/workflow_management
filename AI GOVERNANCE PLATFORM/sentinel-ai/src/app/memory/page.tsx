"use client"

import { motion } from "framer-motion"
import { Brain, Search, Database, Activity, Gauge, Layers, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useMemory, useAgents } from "@/hooks/use-api"
import { formatNumber } from "@/lib/utils"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const retrievalData = [
  { name: "Semantic", value: 523_456, color: "#a3a3a3" },
  { name: "Keyword", value: 234_567, color: "#737373" },
  { name: "Hybrid", value: 134_270, color: "#525252" },
]

export default function MemoryPage() {
  const { data: memoryData } = useMemory()
  const { data: agentData } = useAgents()
  const memoryStats = memoryData?.stats || { totalRetrievals: 0, vectorSearches: 0, chunksRetrieved: 0, avgSimilarity: 0, avgLatency: 0, contextSize: "0" }
  const agents = memoryData?.agents || agentData || []

  const memoryByAgent = ((agents || []) as any[]).slice(0, 8).map((a: any) => ({
    name: a.name,
    memory: parseInt(a.memoryUsed),
  }))

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-50">Memory</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Agent memory usage and retrieval analytics</p>
        </div>
        <Badge variant="secondary" className="text-[10px]">Context: {memoryStats.contextSize}</Badge>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Retrievals", value: formatNumber(memoryStats.totalRetrievals), icon: Brain, color: "text-blue-400" },
          { label: "Vector Searches", value: formatNumber(memoryStats.vectorSearches), icon: Search, color: "text-purple-400" },
          { label: "Chunks Retrieved", value: formatNumber(memoryStats.chunksRetrieved), icon: Layers, color: "text-emerald-400" },
          { label: "Avg Similarity", value: `${(memoryStats.avgSimilarity * 100).toFixed(0)}%`, icon: Gauge, color: "text-amber-400" },
        ].map((stat) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">{stat.label}</span>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <p className="text-xl font-semibold text-neutral-50">{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-200">Retrieval Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-neutral-50">{memoryStats.avgLatency}</span>
                <span className="text-[11px] text-neutral-500">ms avg</span>
              </div>
              <div className="flex-1 space-y-3">
                {[{ label: "P50", value: 28 }, { label: "P95", value: 62 }, { label: "P99", value: 98 }].map((m) => (
                  <div key={m.label} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-neutral-500">{m.label}</span>
                      <span className="text-neutral-300">{m.value}ms</span>
                    </div>
                    <Progress value={(m.value / 100) * 100} className="h-1" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-200">Retrieval Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={retrievalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatNumber(v)} />
                  <Tooltip
                    contentStyle={{ background: "#171717", border: "1px solid #262626", borderRadius: "8px" }}
                    labelStyle={{ color: "#a3a3a3" }}
                  />
                  <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={40}>
                    {retrievalData.map((entry) => (
                      <rect key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-neutral-200">Memory Usage by Agent</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(agents as any[]).slice(0, 8).map((agent: any, i: number) => {
              const gb = parseInt(agent.memoryUsed)
              const maxGbs = 8
              const pct = (gb / maxGbs) * 100
              return (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4"
                >
                  <span className="text-xs font-medium text-neutral-200 w-32 shrink-0">{agent.name}</span>
                  <div className="flex-1">
                    <Progress value={pct} className="h-2 [&>div]:bg-blue-500" />
                  </div>
                  <span className="text-xs text-neutral-500 w-16 text-right font-mono">{agent.memoryUsed}</span>
                  <span className="text-[11px] text-neutral-600 w-12 text-right">{pct.toFixed(0)}%</span>
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
