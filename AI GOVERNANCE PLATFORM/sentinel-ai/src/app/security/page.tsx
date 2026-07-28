"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ShieldAlert, Search, Filter, AlertTriangle, Eye, Ban, Lock, Database } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSecurity } from "@/hooks/use-api"
import { timeAgo } from "@/lib/utils"
import { cn } from "@/lib/utils"

const incidentIcons: Record<string, any> = {
  prompt_injection: AlertTriangle,
  secrets_leak: Lock,
  permission_violation: Ban,
  blocked_request: ShieldAlert,
  data_access: Eye,
}

const severityColors: Record<string, string> = {
  critical: "bg-red-900/20 border-red-800/30 text-red-400",
  high: "bg-orange-900/20 border-orange-800/30 text-orange-400",
  medium: "bg-amber-900/20 border-amber-800/30 text-amber-400",
  low: "bg-blue-900/20 border-blue-800/30 text-blue-400",
}

const statusColors: Record<string, string> = {
  open: "bg-red-900/30 text-red-400",
  investigating: "bg-amber-900/30 text-amber-400",
  resolved: "bg-emerald-900/30 text-emerald-400",
}

export default function SecurityPage() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const { data: securityData } = useSecurity()
  const securityIncidents: any[] = securityData?.incidents || []
  const stats = securityData?.stats || { critical: 0, openIncidents: 0, blockedRequests: "0", riskScore: "Low" }

  const summaryCards = [
    { label: "Critical", value: stats.critical, icon: AlertTriangle, color: "text-red-400" },
    { label: "Open Incidents", value: stats.openIncidents, icon: ShieldAlert, color: "text-amber-400" },
    { label: "Blocked Requests", value: stats.blockedRequests, icon: Ban, color: "text-blue-400" },
    { label: "Risk Score", value: stats.riskScore, icon: Eye, color: "text-emerald-400" },
  ]

  const filtered = securityIncidents.filter((inc: any) => {
    const matchesSearch = inc.agent.toLowerCase().includes(search.toLowerCase()) || inc.description.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === "all" || inc.status === filter
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-50">Security</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Monitor security threats and policy violations</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summaryCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">{stat.label}</span>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className="text-xl font-semibold text-neutral-50">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <Input placeholder="Search incidents..." className="h-9 pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Tabs defaultValue="all" value={filter} onValueChange={setFilter}>
          <TabsList className="h-9">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="open" className="text-xs">Open</TabsTrigger>
            <TabsTrigger value="investigating" className="text-xs">Investigating</TabsTrigger>
            <TabsTrigger value="resolved" className="text-xs">Resolved</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="divide-y divide-neutral-800/50">
              {filtered.map((inc, i) => {
                const Icon = incidentIcons[inc.type]
                return (
                  <motion.div
                    key={inc.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex items-start gap-3 p-4 hover:bg-neutral-800/20 transition-colors"
                  >
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", severityColors[inc.severity].split(" ")[0])}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-neutral-200">{inc.agent}</span>
                        <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 border", severityColors[inc.severity])}>
                          {inc.severity}
                        </Badge>
                        <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 border", statusColors[inc.status])}>
                          {inc.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-neutral-400">{inc.description}</p>
                      <p className="text-[10px] text-neutral-600 mt-1">{timeAgo(inc.time)}</p>
                    </div>
                    <div className="text-[10px] text-neutral-600 capitalize shrink-0 pt-1">
                      {inc.type.replace(/_/g, " ")}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
