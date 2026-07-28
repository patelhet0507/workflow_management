"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, Filter, RefreshCw, Download } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useActivity } from "@/hooks/use-api"
import { timeAgo, formatDuration, formatCost } from "@/lib/utils"
import { cn } from "@/lib/utils"

const statusVariant: Record<string, "success" | "destructive" | "warning" | "secondary"> = {
  success: "success", failed: "destructive", pending: "secondary", warning: "warning",
}

const actionLabels: Record<string, string> = {
  code_review: "Code Review", data_query: "Data Query", ticket_response: "Ticket Response",
  deploy_staging: "Deploy Staging", vulnerability_scan: "Vulnerability Scan",
  content_generate: "Content Generate", metric_alert: "Metric Alert", email_reply: "Email Reply",
  memory_retrieval: "Memory Retrieval", policy_check: "Policy Check",
}

export default function ActivityPage() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const { data: allActivity = [] } = useActivity()

  const filtered = ((allActivity || []) as any[]).filter((a: any) => {
    const matchesSearch = a.agent.toLowerCase().includes(search.toLowerCase()) || actionLabels[a.action]?.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === "all" || a.status === filter
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-50">Activity</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Live event stream from all agents</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs"><RefreshCw className="h-3.5 w-3.5" /> Refresh</Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs"><Download className="h-3.5 w-3.5" /> Export</Button>
        </div>
      </motion.div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <Input placeholder="Search activity..." className="h-9 pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Tabs defaultValue="all" value={filter} onValueChange={setFilter}>
          <TabsList className="h-9">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="success" className="text-xs">Success</TabsTrigger>
            <TabsTrigger value="failed" className="text-xs">Failed</TabsTrigger>
            <TabsTrigger value="warning" className="text-xs">Warning</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" size="icon" className="h-9 w-9"><Filter className="h-4 w-4" /></Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="divide-y divide-neutral-800/50">
              {filtered.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.01 }}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-neutral-800/20 transition-colors"
                >
                  <div className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    entry.status === "success" ? "bg-emerald-400" : entry.status === "failed" ? "bg-red-400" : entry.status === "warning" ? "bg-amber-400" : "bg-neutral-500"
                  )} />
                  <span className="text-xs text-neutral-500 w-16 shrink-0 font-mono">{timeAgo(entry.time)}</span>
                  <span className="text-xs font-medium text-neutral-200 w-32 shrink-0">{entry.agent}</span>
                  <span className="text-xs text-neutral-400 flex-1">{actionLabels[entry.action] || entry.action}</span>
                  <Badge variant={statusVariant[entry.status]} className="text-[10px] px-1.5 py-0">{entry.status}</Badge>
                  <span className="text-xs text-neutral-500 w-16 text-right font-mono">{formatDuration(entry.duration)}</span>
                  <span className="text-xs text-neutral-500 w-16 text-right font-mono">{formatCost(entry.cost)}</span>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span>Showing {filtered.length} of {(allActivity as any[]).length} events</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> {(allActivity as any[]).filter((a: any) => a.status === "success").length} success</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-red-400" /> {(allActivity as any[]).filter((a: any) => a.status === "failed").length} failed</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> {(allActivity as any[]).filter((a: any) => a.status === "warning").length} warnings</span>
        </div>
      </div>
    </div>
  )
}
