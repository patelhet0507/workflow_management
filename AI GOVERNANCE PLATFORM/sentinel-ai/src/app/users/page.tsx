"use client"

import { useState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Search, Plus, Mail, MoreHorizontal, ShieldCheck, Shield, Copy, Check, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUsers } from "@/hooks/use-api"
import { timeAgo } from "@/lib/utils"
import { cn } from "@/lib/utils"

const roleColors: Record<string, string> = {
  Admin: "bg-purple-900/30 text-purple-400 border-purple-800/30",
  User: "bg-blue-900/30 text-blue-400 border-blue-800/30",
}

const statusDot: Record<string, string> = {
  active: "bg-emerald-400",
  invited: "bg-amber-400",
  disabled: "bg-neutral-600",
}

export default function UsersPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [inviteOpen, setInviteOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", role: "User" })
  const { data: users = [] } = useUsers()
  const filtered = ((users || []) as any[]).filter((u: any) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))

  async function updateRole(id: string, role: string) {
    await fetch(`/api/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) })
    qc.invalidateQueries({ queryKey: ["users"] })
  }

  async function addUser() {
    if (!form.name || !form.email) return
    setSaving(true)
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, role: form.role, status: "invited", avatar: form.name.charAt(0).toUpperCase() }),
    })
    setSaving(false)
    if (!res.ok) return
    setAddOpen(false)
    setForm({ name: "", email: "", role: "User" })
    qc.invalidateQueries({ queryKey: ["users"] })
  }

  function copyInviteLink() {
    navigator.clipboard.writeText(`${window.location.origin}/auth/signup`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-50">Users</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{users.length} workspace members</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setInviteOpen(true)}><Mail className="h-3.5 w-3.5" /> Invite</Button>
          <Button className="h-8 gap-1.5 text-xs" onClick={() => setAddOpen(true)}><Plus className="h-3.5 w-3.5" /> Add User</Button>
        </div>
      </motion.div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invite Member</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-neutral-400">Share this sign-up link with the person you want to invite:</p>
            <div className="flex items-center gap-2">
              <Input value={`${typeof window !== "undefined" ? window.location.origin : ""}/auth/signup`} readOnly className="h-9 text-xs" />
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={copyInviteLink}>
                {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <p className="text-xs text-neutral-500">They sign up, then an admin can assign their workspace role here.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setInviteOpen(false)} className="h-8">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add User</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-400">Name</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-400">Email</label>
              <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jane@example.com" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-400">Role</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="flex h-9 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-1 text-sm text-neutral-200">
                <option value="User">User</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddOpen(false)} className="h-8">Cancel</Button>
            <Button size="sm" onClick={addUser} disabled={saving || !form.name || !form.email} className="h-8 gap-1.5">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {saving ? "Adding..." : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
        <Input placeholder="Search users..." className="h-9 pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px]">User</TableHead>
                <TableHead className="text-[11px]">Role</TableHead>
                <TableHead className="text-[11px]">Status</TableHead>
                <TableHead className="text-[11px]">Agents</TableHead>
                <TableHead className="text-[11px]">Last Active</TableHead>
                <TableHead className="text-[11px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user, i) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-neutral-800/50 hover:bg-neutral-800/20 transition-colors"
                >
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-[10px] bg-neutral-800 text-neutral-400">{user.avatar}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-neutral-200">{user.name}</p>
                        <p className="text-[11px] text-neutral-500">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5 border", roleColors[user.role])}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <div className={cn("h-1.5 w-1.5 rounded-full", statusDot[user.status])} />
                      <span className="text-xs text-neutral-400 capitalize">{user.status}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-sm text-neutral-400">{user.agents}</TableCell>
                  <TableCell className="py-3 text-xs text-neutral-500">{timeAgo(user.lastActive)}</TableCell>
                  <TableCell className="py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-500 hover:text-neutral-300">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem className="text-xs gap-2" onClick={() => updateRole(user.id, user.role === "Admin" ? "User" : "Admin")}>
                          {user.role === "Admin" ? <Shield className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                          {user.role === "Admin" ? "Demote to User" : "Promote to Admin"}
                        </DropdownMenuItem>
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
