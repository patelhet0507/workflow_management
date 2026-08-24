"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { api, type UserData, type StageDef, type BookingFieldDef, FIELD_TYPES } from "@/lib/api"
import { ROLES } from "@/lib/constants"
import AppLayout from "@/components/app-layout"
import { ArrowUp, ArrowDown, Save, Plus, X, ShieldCheck, Users } from "lucide-react"

const roles = ROLES

export default function AdminPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<UserData[]>([])
  const [newEmail, setNewEmail] = useState("")
  const [newName, setNewName] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newRole, setNewRole] = useState("crm")
  const [msg, setMsg] = useState("")
  const [flow, setFlow] = useState<StageDef[]>([])
  const [flowMsg, setFlowMsg] = useState("")
  const [saving, setSaving] = useState(false)
  const [newStageStatus, setNewStageStatus] = useState("")
  const [newStageRole, setNewStageRole] = useState("crm")

  const [formFields, setFormFields] = useState<BookingFieldDef[]>([])
  const [formMsg, setFormMsg] = useState("")
  const [newFieldLabel, setNewFieldLabel] = useState("")
  const [newFieldType, setNewFieldType] = useState<BookingFieldDef["type"]>("text")

  const isAdmin = user?.role === "admin" || user?.role === "super_admin"

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) router.push("/dashboard")
    if (isAdmin) {
      api.getUsers().then(setUsers).catch(console.error)
      api.getApprovalFlow().then(setFlow).catch(console.error)
      api.getBookingForm().then(setFormFields).catch(console.error)
    }
  }, [user, isLoading, router])

  const changeRole = async (uid: string, role: string) => {
    await api.updateUserRole(uid, role)
    setUsers(users.map((u) => (u.id === uid ? { ...u, role } : u)))
  }

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg("")
    try {
      await api.register(newEmail, newPassword, newName, newRole)
      setMsg("User created. They can now log in.")
      setNewEmail(""); setNewName(""); setNewPassword("")
      api.getUsers().then(setUsers).catch(console.error)
    } catch (err: any) { setMsg(err.message) }
  }

  const moveStage = (idx: number, dir: -1 | 1) => {
    const next = idx + dir
    if (next < 0 || next >= flow.length) return
    const copy = [...flow]
    const tmp = copy[idx]
    copy[idx] = copy[next]
    copy[next] = tmp
    setFlow(copy)
  }

  const addStage = () => {
    const s = newStageStatus.trim()
    if (!s) return
    if (flow.some((x) => x.status === s)) return
    setFlow([...flow, { status: s, role: newStageRole }])
    setNewStageStatus("")
  }

  const removeStage = (idx: number) => setFlow(flow.filter((_, i) => i !== idx))

  const saveFlow = async () => {
    setSaving(true)
    setFlowMsg("")
    try {
      await api.updateApprovalFlow(flow)
      setFlowMsg("Flow saved")
    } catch (err: any) { setFlowMsg(err.message) }
    finally { setSaving(false) }
  }

  const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")

  const addField = () => {
    if (!newFieldLabel.trim()) return
    setFormFields([...formFields, { key: slugify(newFieldLabel), label: newFieldLabel.trim(), type: newFieldType }])
    setNewFieldLabel("")
  }

  const updateField = (idx: number, patch: Partial<BookingFieldDef>) => {
    setFormFields(formFields.map((f, i) => (i === idx ? { ...f, ...patch } : f)))
  }

  const moveField = (idx: number, dir: -1 | 1) => {
    const j = idx + dir
    if (j < 0 || j >= formFields.length) return
    const copy = [...formFields]
    const tmp = copy[idx]
    copy[idx] = copy[j]
    copy[j] = tmp
    setFormFields(copy)
  }

  const saveForm = async () => {
    setSaving(true)
    setFormMsg("")
    try {
      await api.updateBookingForm(formFields.map((f) => ({ ...f, key: f.key || slugify(f.label) })))
      setFormMsg("Booking form saved")
    } catch (err: any) { setFormMsg(err.message) }
    finally { setSaving(false) }
  }

  if (isLoading || !user) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F4E8] via-[#EDE6CE] to-[#F0E8D4] text-[#141623] relative">
      <div className="mesh-gradient" />
      <div className="max-w-6xl mx-auto px-6 py-10 relative z-10">
        <AppLayout>
          <div className="max-w-5xl space-y-8">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C5A05A]/20 to-[#8A6F3B]/10 flex items-center justify-center border border-[#C5A05A]/20"><ShieldCheck size={16} className="text-[#8A6F3B]" /></span>
              <h1 className="font-editorial text-4xl text-[#141623]">Admin Panel</h1>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4"><span className="w-1 h-5 bg-gradient-to-b from-[#C5A05A] to-[#8A6F3B] rounded-full" /><h2 className="font-editorial text-xl text-[#141623]">Add User</h2></div>
              <form onSubmit={addUser} className="space-y-4 max-w-md">
                <div className="space-y-1"><label className="text-xs font-bold text-[#8A7E6E] uppercase tracking-wider">Name</label><input value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="Full name" className="flex h-9 w-full rounded-xl border border-[#C5A05A]/20 bg-white/60 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A05A]/20" /></div>
                <div className="space-y-1"><label className="text-xs font-bold text-[#8A7E6E] uppercase tracking-wider">Email</label><input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required placeholder="user@example.com" className="flex h-9 w-full rounded-xl border border-[#C5A05A]/20 bg-white/60 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A05A]/20" /></div>
                <div className="space-y-1"><label className="text-xs font-bold text-[#8A7E6E] uppercase tracking-wider">Password</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} placeholder="Min 6 characters" className="flex h-9 w-full rounded-xl border border-[#C5A05A]/20 bg-white/60 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A05A]/20" /></div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#8A7E6E] uppercase tracking-wider">Role</label>
                  <select value={newRole} onChange={(e) => setNewRole(e.target.value)}
                    className="flex h-9 w-full rounded-xl border border-[#C5A05A]/20 bg-white/60 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A05A]/20">
                    {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn-luxury text-xs uppercase tracking-widest">Add User</button>
                {msg && <p className="text-sm text-[#8A6F3B] bg-[#C5A05A]/10 border border-[#C5A05A]/20 px-3 py-2 rounded-xl">{msg}</p>}
              </form>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-2"><span className="w-1 h-5 bg-gradient-to-b from-[#C5A05A] to-[#8A6F3B] rounded-full" /><h2 className="font-editorial text-xl text-[#141623]">Approval Flow</h2></div>
              <p className="text-sm text-[#8A7E6E] mb-4">Add, remove, or reorder approval stages. Each stage maps a booking status to the role that can approve it.</p>
              <div className="flex items-end gap-2 mb-6 max-w-lg">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-bold text-[#8A7E6E] uppercase tracking-wider">Status Name</label>
                  <input value={newStageStatus} onChange={(e) => setNewStageStatus(e.target.value)} placeholder="e.g. compliance_approved" className="flex h-9 w-full rounded-xl border border-[#C5A05A]/20 bg-white/60 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A05A]/20" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#8A7E6E] uppercase tracking-wider">Approved By</label>
                  <select value={newStageRole} onChange={(e) => setNewStageRole(e.target.value)}
                    className="flex h-9 w-32 rounded-xl border border-[#C5A05A]/20 bg-white/60 px-3 py-1 text-sm">
                    {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <button onClick={addStage} className="btn-luxury text-xs py-2 px-3 inline-flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button>
              </div>
              <div className="space-y-2 max-w-lg">
                {flow.map((s, i) => (
                  <div key={s.status} className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-[#C5A05A]/15">
                    <span className="text-xs font-bold text-[#8A7E6E] w-5">{i + 1}.</span>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-[#141623]">{s.status.replace(/_/g, " ")}</span>
                      <span className="text-xs text-[#8A7E6E] mx-2">→</span>
                      <span className="text-xs font-medium text-[#8A6F3B] bg-[#C5A05A]/10 border border-[#C5A05A]/20 px-2 py-0.5 rounded-full">{s.role}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => moveStage(i, -1)} disabled={i === 0} className="p-1 rounded-lg hover:bg-[#C5A05A]/10 disabled:opacity-30"><ArrowUp className="w-4 h-4 text-[#8A7E6E]" /></button>
                      <button onClick={() => moveStage(i, 1)} disabled={i === flow.length - 1} className="p-1 rounded-lg hover:bg-[#C5A05A]/10 disabled:opacity-30"><ArrowDown className="w-4 h-4 text-[#8A7E6E]" /></button>
                      <button onClick={() => removeStage(i)} className="p-1 rounded-lg hover:bg-red-50 text-[#8A7E6E] hover:text-red-600"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-4">
                <button onClick={saveFlow} disabled={saving} className="btn-luxury text-xs inline-flex items-center gap-1.5"><Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Flow"}</button>
                {flowMsg && <p className="text-sm text-[#8A6F3B]">{flowMsg}</p>}
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-2"><span className="w-1 h-5 bg-gradient-to-b from-[#C5A05A] to-[#8A6F3B] rounded-full" /><h2 className="font-editorial text-xl text-[#141623]">Booking Form Fields</h2></div>
              <p className="text-sm text-[#8A7E6E] mb-4">Add, remove, or reorder the fields shown on the New Booking form.</p>
              <div className="flex items-end gap-2 mb-6 max-w-lg">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-bold text-[#8A7E6E] uppercase tracking-wider">Field Label</label>
                  <input value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)} placeholder="e.g. PAN Number" className="flex h-9 w-full rounded-xl border border-[#C5A05A]/20 bg-white/60 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A05A]/20" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#8A7E6E] uppercase tracking-wider">Type</label>
                  <select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value as BookingFieldDef["type"])}
                    className="flex h-9 w-36 rounded-xl border border-[#C5A05A]/20 bg-white/60 px-3 py-1 text-sm">
                    {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <button onClick={addField} className="btn-luxury text-xs py-2 px-3 inline-flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button>
              </div>
              <div className="space-y-2 max-w-3xl">
                {formFields.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 bg-white/60 rounded-xl border border-[#C5A05A]/15">
                    <span className="text-xs font-bold text-[#8A7E6E] w-5">{i + 1}.</span>
                    <input value={f.label} onChange={(e) => updateField(i, { label: e.target.value, key: e.target.value ? slugify(e.target.value) : f.key })} className="flex-1 h-8 rounded-xl border border-[#C5A05A]/20 bg-white/60 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A05A]/20" />
                    <select value={f.type} onChange={(e) => updateField(i, { type: e.target.value as BookingFieldDef["type"] })}
                      className="h-8 w-32 rounded-xl border border-[#C5A05A]/20 bg-white/60 px-2 text-xs">
                      {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    {f.type === "select" && (
                      <input value={(f.options || []).join(", ")} onChange={(e) => updateField(i, { options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                        placeholder="options, comma, separated" className="w-44 h-8 rounded-xl border border-[#C5A05A]/20 bg-white/60 px-2 text-xs" />
                    )}
                    <label className="flex items-center gap-1.5 text-xs whitespace-nowrap text-[#8A7E6E]">
                      <input type="checkbox" checked={!!f.required} onChange={(e) => updateField(i, { required: e.target.checked })} className="accent-[#C5A05A]" />
                      Required
                    </label>
                    <button onClick={() => moveField(i, -1)} disabled={i === 0} className="p-1 rounded-lg hover:bg-[#C5A05A]/10 disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                    <button onClick={() => moveField(i, 1)} disabled={i === formFields.length - 1} className="p-1 rounded-lg hover:bg-[#C5A05A]/10 disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                    <button onClick={() => setFormFields(formFields.filter((_, j) => j !== i))} className="p-1 rounded-lg hover:bg-red-50 text-[#8A7E6E] hover:text-red-600"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-4">
                <button onClick={saveForm} disabled={saving} className="btn-luxury text-xs inline-flex items-center gap-1.5"><Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Form"}</button>
                {formMsg && <p className="text-sm text-[#8A6F3B]">{formMsg}</p>}
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4"><Users size={16} className="text-[#8A6F3B]" /><h2 className="font-editorial text-xl text-[#141623]">Users ({users.length})</h2></div>
              <div className="overflow-x-auto rounded-xl border border-[#EDE6CE]/60">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-[#141623]/5 to-transparent"><tr>
                    <th className="text-left p-3 font-semibold text-[#8A7E6E] text-xs uppercase tracking-wider">Name</th>
                    <th className="text-left p-3 font-semibold text-[#8A7E6E] text-xs uppercase tracking-wider">Email</th>
                    <th className="text-left p-3 font-semibold text-[#8A7E6E] text-xs uppercase tracking-wider">Role</th>
                  </tr></thead>
                  <tbody className="divide-y divide-[#EDE6CE]/40">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-[#C5A05A]/5">
                        <td className="p-3 font-medium text-[#141623]">{u.name}</td>
                        <td className="p-3 text-[#8A7E6E] text-xs">{u.email}</td>
                        <td className="p-3">
                          <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}
                            className="h-8 rounded-xl border border-[#C5A05A]/20 bg-white/60 px-2 text-xs">
                            {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </AppLayout>
      </div>
    </div>
  )
}
