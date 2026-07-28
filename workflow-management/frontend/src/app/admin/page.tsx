"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { api, type UserData } from "@/lib/api"
import AppLayout from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

const roles = ["data_entry", "sales_exec", "crm", "management", "finance", "super_admin"]

export default function AdminPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<UserData[]>([])
  const [newEmail, setNewEmail] = useState("")
  const [newName, setNewName] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newRole, setNewRole] = useState("data_entry")
  const [msg, setMsg] = useState("")

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "super_admin")) router.push("/dashboard")
    if (user?.role === "super_admin") api.getUsers().then(setUsers).catch(console.error)
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

  if (isLoading || !user) return null

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>

      <Card className="max-w-lg mb-8">
        <CardHeader><CardTitle>Add User</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={addUser} className="space-y-3">
            <div className="space-y-1"><Label>Name</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} required /></div>
            <div className="space-y-1"><Label>Email</Label><Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required /></div>
            <div className="space-y-1"><Label>Password</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} /></div>
            <div className="space-y-1"><Label>Role</Label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                {roles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <Button type="submit">Add User</Button>
            {msg && <p className="text-sm text-blue-600">{msg}</p>}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Users ({users.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b dark:border-gray-800">
                <th className="text-left p-2 font-medium">Name</th>
                <th className="text-left p-2 font-medium">Email</th>
                <th className="text-left p-2 font-medium">Role</th>
                <th className="text-left p-2 font-medium">Actions</th>
              </tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b dark:border-gray-800">
                    <td className="p-2">{u.name}</td>
                    <td className="p-2">{u.email}</td>
                    <td className="p-2">
                      <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}
                        className="h-8 rounded border border-input bg-transparent px-2 text-xs">
                        {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="p-2">
                      <Button size="sm" onClick={() => changeRole(u.id, u.role)} disabled>Save</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  )
}
