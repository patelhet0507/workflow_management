"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { api, type UserData, type StageDef } from "@/lib/api"
import AppLayout from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowUp, ArrowDown, Save, Plus, X } from "lucide-react"

const roles = [
  { value: "data_entry", label: "Data Entry" },
  { value: "KYC", label: "KYC" },
  { value: "CRM", label: "CRM" },
  { value: "CSO", label: "CSO" },
  { value: "management", label: "Management" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
]

export default function AdminPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<UserData[]>([])
  const [newEmail, setNewEmail] = useState("")
  const [newName, setNewName] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newRole, setNewRole] = useState("data_entry")
  const [msg, setMsg] = useState("")
  const [flow, setFlow] = useState<StageDef[]>([])
  const [flowMsg, setFlowMsg] = useState("")
  const [saving, setSaving] = useState(false)
  const [newStageStatus, setNewStageStatus] = useState("")
  const [newStageRole, setNewStageRole] = useState("KYC")

  const isAdmin = user?.role === "admin" || user?.role === "super_admin"

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) router.push("/dashboard")
    if (isAdmin) {
      api.getUsers().then(setUsers).catch(console.error)
      api.getApprovalFlow().then(setFlow).catch(console.error)
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

  if (isLoading || !user) return null

  return (
    <AppLayout>
      <div className="max-w-5xl">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span className="w-1 h-6 bg-blue-600 rounded-full inline-block" />
          Admin Panel
        </h1>

        <Card className="shadow-md border-0 ring-1 ring-gray-200 dark:ring-gray-800 mb-8">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-t-lg">
            <CardTitle className="text-lg">Add User</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={addUser} className="space-y-4 max-w-md">
              <div className="space-y-1"><Label>Name</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="Full name" className="focus:ring-2 focus:ring-blue-500" /></div>
              <div className="space-y-1"><Label>Email</Label><Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required placeholder="user@example.com" className="focus:ring-2 focus:ring-blue-500" /></div>
              <div className="space-y-1"><Label>Password</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} placeholder="Min 6 characters" className="focus:ring-2 focus:ring-blue-500" /></div>
              <div className="space-y-2">
                <Label>Role</Label>
                <div className="flex flex-wrap gap-1.5">
                  {roles.map((r) => (
                    <button key={r.value} type="button" onClick={() => setNewRole(r.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        newRole === r.value
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-400"
                      }`}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Add User</Button>
              {msg && <p className="text-sm text-blue-600 bg-blue-50 dark:bg-blue-950/50 px-3 py-2 rounded-md">{msg}</p>}
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-md border-0 ring-1 ring-gray-200 dark:ring-gray-800 mb-8">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-t-lg">
            <CardTitle className="text-lg">Approval Flow</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500 mb-4">Add, remove, or reorder approval stages. Each stage maps a booking status to the role that can approve it.</p>

            <div className="flex items-end gap-2 mb-6 max-w-lg">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Status Name</Label>
                <Input value={newStageStatus} onChange={(e) => setNewStageStatus(e.target.value)} placeholder="e.g. compliance_approved" className="focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Approved By</Label>
                <select value={newStageRole} onChange={(e) => setNewStageRole(e.target.value)}
                  className="flex h-9 w-32 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                  {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <Button onClick={addStage} size="sm" className="mb-0.5 bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-1" /> Add</Button>
            </div>

            <div className="space-y-2 max-w-lg">
              {flow.map((s, i) => (
                <div key={s.status} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg ring-1 ring-gray-200 dark:ring-gray-700">
                  <span className="text-xs font-bold text-gray-400 w-5">{i + 1}.</span>
                  <div className="flex-1">
                    <span className="text-sm font-medium">{s.status.replace(/_/g, " ")}</span>
                    <span className="text-xs text-gray-400 mx-2">→</span>
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded">{s.role}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => moveStage(i, -1)} disabled={i === 0} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                    <button onClick={() => moveStage(i, 1)} disabled={i === flow.length - 1} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                    <button onClick={() => removeStage(i)} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950/50 text-gray-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-4">
              <Button onClick={saveFlow} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-1.5" /> {saving ? "Saving..." : "Save Flow"}
              </Button>
              {flowMsg && <p className="text-sm text-blue-600">{flowMsg}</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-0 ring-1 ring-gray-200 dark:ring-gray-800">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-t-lg">
            <CardTitle className="text-lg">Users ({users.length})</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b dark:border-gray-800">
                  <th className="text-left p-2 font-medium text-gray-500">Name</th>
                  <th className="text-left p-2 font-medium text-gray-500">Email</th>
                  <th className="text-left p-2 font-medium text-gray-500">Role</th>
                </tr></thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="p-2 font-medium">{u.name}</td>
                      <td className="p-2 text-gray-500">{u.email}</td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-1">
                          {roles.map((r) => (
                            <button key={r.value} onClick={() => changeRole(u.id, r.value)}
                              className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                                u.role === r.value
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-400"
                              }`}>
                              {r.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
