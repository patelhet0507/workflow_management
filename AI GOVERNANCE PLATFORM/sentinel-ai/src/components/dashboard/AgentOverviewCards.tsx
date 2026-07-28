"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bot, Play, Pause, RotateCcw, MoreHorizontal,
  ShieldCheck, ShieldAlert, Shield,
  Database, Clock, Activity,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ExecuteDialog } from "@/components/agents/ExecuteDialog"
import { cn } from "@/lib/utils"

const statusConfig: Record<string, { color: string; dot: string; label: string }> = {
  active: { color: "bg-emerald-900/20 border-emerald-800/30", dot: "bg-emerald-400", label: "Active" },
  paused: { color: "bg-amber-900/20 border-amber-800/30", dot: "bg-amber-400", label: "Paused" },
  error: { color: "bg-red-900/20 border-red-800/30", dot: "bg-red-400", label: "Error" },
  idle: { color: "bg-neutral-800/30 border-neutral-700/30", dot: "bg-neutral-500", label: "Idle" },
}

const policyIcons: Record<string, typeof ShieldCheck> = {
  compliant: ShieldCheck, violation: ShieldAlert, pending: Shield,
}

const policyColors: Record<string, string> = {
  compliant: "text-emerald-400", violation: "text-red-400", pending: "text-amber-400",
}

interface AgentData {
  _id: string; id?: string; name: string; status: string; memoryUsed: string; tokens: number; aiModel: string; permissions: string[]; policyStatus: string; category: string
}

interface AgentOverviewCardsProps {
  agents: AgentData[]
}

export function AgentOverviewCards({ agents }: AgentOverviewCardsProps) {
  const router = useRouter()
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [execAgent, setExecAgent] = useState<AgentData | null>(null)
  const list = agents.slice(0, 8)

  async function updateAgent(id: string, status: string) {
    await fetch(`/api/agents/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) })
    qc.invalidateQueries({ queryKey: ["agents"] })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-200">Agent Overview</h3>
        <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => router.push("/agents")}>
          <Bot className="h-3 w-3 mr-1" /> View All
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {list.length === 0 ? (
          <div className="col-span-full text-center text-sm text-neutral-500 py-8">No agents registered yet. Create one from the Agents page.</div>
        ) : (
          list.map((agent) => {
            const status = statusConfig[agent.status] || statusConfig.idle
            const PolicyIcon = policyIcons[agent.policyStatus] || Shield
            const isExpanded = expanded === agent.id || expanded === agent._id
            const key = agent.id || agent._id

            return (
              <motion.div key={key} layout transition={{ duration: 0.2 }}>
                <Card className={cn("cursor-pointer transition-all duration-200 hover:border-neutral-700", status.color)} onClick={() => setExpanded(isExpanded ? null : key)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800/50">
                          <Bot className="h-4 w-4 text-neutral-300" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-200 leading-tight">{agent.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                            <span className="text-[10px] text-neutral-500">{status.label}</span>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-500 hover:text-neutral-300">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem className="gap-2 text-xs" onClick={(e) => { e.stopPropagation(); setExecAgent(agent) }}><Play className="h-3.5 w-3.5" /> Run Now</DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-xs" onClick={(e) => { e.stopPropagation(); updateAgent(key, "paused") }}><Pause className="h-3.5 w-3.5" /> Pause</DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-xs" onClick={(e) => { e.stopPropagation(); updateAgent(key, "active") }}><RotateCcw className="h-3.5 w-3.5" /> Restart</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <Database className="h-3 w-3 text-neutral-500" />
                        <span className="text-[11px] text-neutral-400">{agent.memoryUsed}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Activity className="h-3 w-3 text-neutral-500" />
                        <span className="text-[11px] text-neutral-400">{(agent.tokens / 1000).toFixed(0)}K tok</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-neutral-500" />
                        <span className="text-[11px] text-neutral-400">{agent.aiModel}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <PolicyIcon className={cn("h-3 w-3", policyColors[agent.policyStatus])} />
                        <span className="text-[11px] text-neutral-400 capitalize">{agent.policyStatus}</span>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                          <Separator className="my-2" />
                          <div className="space-y-2">
                            <div>
                              <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-1">Permissions</p>
                              <div className="flex flex-wrap gap-1">
                                {(agent.permissions || []).map((perm) => (
                                  <Badge key={perm} variant="secondary" className="text-[9px] px-1.5 py-0">{perm}</Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2 pt-1">
                              <Button size="sm" variant="default" className="h-7 text-[11px] flex-1" onClick={(e) => { e.stopPropagation(); setExecAgent(agent) }}><Play className="h-3 w-3 mr-1" /> Run</Button>
                              <Button size="sm" variant="outline" className="h-7 text-[11px] flex-1" onClick={(e) => { e.stopPropagation(); router.push("/agents") }}>Details</Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })
        )}
      </div>
      {execAgent && (
        <ExecuteDialog agent={{ id: execAgent.id || execAgent._id, name: execAgent.name, ai_model: execAgent.aiModel }} open={!!execAgent} onOpenChange={(v) => { if (!v) setExecAgent(null) }} />
      )}
    </div>
  )
}
