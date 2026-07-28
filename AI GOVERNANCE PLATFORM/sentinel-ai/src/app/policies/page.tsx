"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Search, Plus, Shield, ShieldCheck, ShieldX, MoreHorizontal, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePolicies } from "@/hooks/use-api"
import { cn } from "@/lib/utils"

const effectColors: Record<string, string> = {
  Allow: "text-emerald-400 border-emerald-900/30 bg-emerald-900/10",
  Block: "text-red-400 border-red-900/30 bg-red-900/10",
  "Require Approval": "text-amber-400 border-amber-900/30 bg-amber-900/10",
  "Require MFA": "text-blue-400 border-blue-900/30 bg-blue-900/10",
}

const defaultForm = { name: "", description: "", resource: "", effect: "Allow" }

export default function PoliciesPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const { data: policies = [] } = usePolicies()

  const filtered = ((policies || []) as any[]).filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.resource || "").toLowerCase().includes(search.toLowerCase()) ||
    p.effect.toLowerCase().includes(search.toLowerCase())
  )

  function openCreate() { setEditing(null); setForm(defaultForm); setOpen(true) }
  function openEdit(p: any) { setEditing(p); setForm({ name: p.name, description: p.description || "", resource: p.resource, effect: p.effect }); setOpen(true) }

  async function save() {
    if (!form.name || !form.resource) return
    setSaving(true)
    const url = editing ? `/api/policies/${editing.id}` : "/api/policies"
    const method = editing ? "PATCH" : "POST"
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setSaving(false); setOpen(false)
    qc.invalidateQueries({ queryKey: ["policies"] })
  }

  async function toggleStatus(p: any) {
    await fetch(`/api/policies/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: p.status === "active" ? "inactive" : "active" }) })
    qc.invalidateQueries({ queryKey: ["policies"] })
  }

  async function del(id: string) {
    await fetch(`/api/policies/${id}`, { method: "DELETE" })
    qc.invalidateQueries({ queryKey: ["policies"] })
  }

  async function duplicate(p: any) {
    await fetch("/api/policies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: p.name + " (copy)", description: p.description, resource: p.resource, effect: p.effect, status: "inactive" }) })
    qc.invalidateQueries({ queryKey: ["policies"] })
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-50">Policies</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Define what agents are allowed to do</p>
        </div>
        <Button className="h-8 gap-1.5 text-xs" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" /> Create Policy
        </Button>
      </motion.div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Policy" : "Create Policy"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-400">Name</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Block External Access" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-400">Description (optional)</label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What this policy controls" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-400">Resource</label>
              <Input value={form.resource} onChange={e => setForm({ ...form, resource: e.target.value })} placeholder="e.g. api/external, data/sensitive" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-400">Effect</label>
              <select value={form.effect} onChange={e => setForm({ ...form, effect: e.target.value })} className="flex h-9 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-1 text-sm text-neutral-200">
                <option value="Allow">Allow</option>
                <option value="Block">Block</option>
                <option value="Require Approval">Require Approval</option>
                <option value="Require MFA">Require MFA</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="h-8">Cancel</Button>
            <Button size="sm" onClick={save} disabled={saving || !form.name || !form.resource} className="h-8 gap-1.5">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {saving ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <Input placeholder="Search policies..." className="h-9 pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px]">Policy</TableHead>
                <TableHead className="text-[11px]">Resource</TableHead>
                <TableHead className="text-[11px]">Effect</TableHead>
                <TableHead className="text-[11px]">Agents</TableHead>
                <TableHead className="text-[11px]">Status</TableHead>
                <TableHead className="text-[11px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((policy, i) => (
                <motion.tr
                  key={policy.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-neutral-800/50 hover:bg-neutral-800/20 transition-colors"
                >
                  <TableCell className="py-3">
                    <div>
                      <p className="text-sm font-medium text-neutral-200">{policy.name}</p>
                      <p className="text-[11px] text-neutral-500 mt-0.5">{policy.description}</p>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <code className="text-xs text-neutral-400 bg-neutral-800/50 px-2 py-1 rounded">{policy.resource}</code>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className={cn(
                      "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
                      effectColors[policy.effect]
                    )}>
                      {policy.effect === "Allow" && <ShieldCheck className="h-3 w-3 mr-1" />}
                      {policy.effect === "Block" && <ShieldX className="h-3 w-3 mr-1" />}
                      {(policy.effect === "Require Approval" || policy.effect === "Require MFA") && <Shield className="h-3 w-3 mr-1" />}
                      {policy.effect}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-sm text-neutral-400">{policy.agents}</TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <Switch checked={policy.status === "active"} onClick={() => toggleStatus(policy)} className="scale-75" />
                      <span className={cn(
                        "text-[11px]",
                        policy.status === "active" ? "text-emerald-400" : "text-neutral-500"
                      )}>
                        {policy.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-500 hover:text-neutral-300">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem className="text-xs" onClick={() => openEdit(policy)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-xs" onClick={() => duplicate(policy)}>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem className="text-xs text-red-400" onClick={() => del(policy.id)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
