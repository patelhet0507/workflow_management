"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Search, Bot, Plus, SlidersHorizontal, MoreHorizontal, Play, Pause, RotateCcw, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { useAgents } from "@/hooks/use-api"
import { ExecuteDialog } from "@/components/agents/ExecuteDialog"
import { cn } from "@/lib/utils"

const statusConfig: Record<string, { dot: string; label: string; badge: "success" | "destructive" | "warning" | "secondary" }> = {
  active: { dot: "bg-emerald-400", label: "Active", badge: "success" },
  paused: { dot: "bg-amber-400", label: "Paused", badge: "warning" },
  error: { dot: "bg-red-400", label: "Error", badge: "destructive" },
  idle: { dot: "bg-neutral-500", label: "Idle", badge: "secondary" },
}

export default function AgentsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", model: "", category: "Development" })
  const [error, setError] = useState("")
  const [execAgent, setExecAgent] = useState<any>(null)
  const { data: agents = [] } = useAgents()

  async function updateAgent(id: string, status: string) {
    await fetch(`/api/agents/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) })
    qc.invalidateQueries({ queryKey: ["agents"] })
  }

  async function register() {
    if (!form.name) return
    setSaving(true); setError("")
    const res = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, category: form.category, ai_model: form.model || null }),
    })
    setSaving(false)
    if (!res.ok) { setError("Failed to register agent"); return }
    setOpen(false)
    setForm({ name: "", model: "", category: "Development" })
    qc.invalidateQueries({ queryKey: ["agents"] })
  }

  const filtered = ((agents || []) as any[]).filter((a: any) => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.model.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === "all" || a.status === filter
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-50">Agents</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{agents.length} registered agents</p>
        </div>
        <Button className="h-8 gap-1.5 text-xs" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Register Agent
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Register Agent</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-400">Name</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="MyAgent" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-400">Model</label>
                <Input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} placeholder="e.g. gpt-4o, claude-3-opus, llama-3-70b" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-400">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="flex h-9 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-1 text-sm text-neutral-200">
                  {["General", "Development", "Data", "Support", "DevOps", "Security", "Content", "Observability", "Communication"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="h-8">Cancel</Button>
              <Button size="sm" onClick={register} disabled={saving || !form.name} className="h-8 gap-1.5">
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {saving ? "Registering..." : "Register"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <Input placeholder="Search agents..." className="h-9 pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Tabs defaultValue="all" value={filter} onValueChange={setFilter}>
          <TabsList className="h-9">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="active" className="text-xs">Active</TabsTrigger>
            <TabsTrigger value="paused" className="text-xs">Paused</TabsTrigger>
            <TabsTrigger value="error" className="text-xs">Error</TabsTrigger>
            <TabsTrigger value="idle" className="text-xs">Idle</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" size="icon" className="h-9 w-9">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((agent, i) => {
          const s = statusConfig[agent.status]
          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="group hover:border-neutral-700 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-800/50">
                        <Bot className="h-5 w-5 text-neutral-300" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-200">{agent.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
                          <span className="text-[11px] text-neutral-500">{s.label}</span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-500 hover:text-neutral-300">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem className="gap-2 text-xs" onClick={() => setExecAgent(agent)}><Play className="h-3.5 w-3.5" /> Run Now</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-xs" onClick={() => updateAgent(agent.id, "paused")}><Pause className="h-3.5 w-3.5" /> Pause</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-xs" onClick={() => updateAgent(agent.id, "active")}><RotateCcw className="h-3.5 w-3.5" /> Restart</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="rounded-lg bg-neutral-800/30 p-2">
                      <p className="text-[10px] text-neutral-600">Model</p>
                      <p className="text-xs font-medium text-neutral-300">{agent.model}</p>
                    </div>
                    <div className="rounded-lg bg-neutral-800/30 p-2">
                      <p className="text-[10px] text-neutral-600">Category</p>
                      <p className="text-xs font-medium text-neutral-300">{agent.category}</p>
                    </div>
                    <div className="rounded-lg bg-neutral-800/30 p-2">
                      <p className="text-[10px] text-neutral-600">Memory</p>
                      <p className="text-xs font-medium text-neutral-300">{agent.memoryUsed}</p>
                    </div>
                    <div className="rounded-lg bg-neutral-800/30 p-2">
                      <p className="text-[10px] text-neutral-600">Tokens</p>
                      <p className="text-xs font-medium text-neutral-300">{(agent.tokens / 1000).toFixed(0)}K</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge variant={s.badge} className="text-[10px]">{s.label}</Badge>
                    <div className="flex items-center gap-1">
                      {agent.permissions.slice(0, 2).map((p: string) => (
                        <Badge key={p} variant="secondary" className="text-[9px] px-1.5 py-0">{p}</Badge>
                      ))}
                      {agent.permissions.length > 2 && (
                        <span className="text-[10px] text-neutral-600">+{agent.permissions.length - 2}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
      {execAgent && (
        <ExecuteDialog agent={{ id: execAgent.id, name: execAgent.name, ai_model: execAgent.ai_model }} open={!!execAgent} onOpenChange={(v) => { if (!v) setExecAgent(null) }} />
      )}
    </div>
  )
}
