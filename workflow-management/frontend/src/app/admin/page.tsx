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

const roles = [
  { value: "data_entry", label: "Data Entry" },
  { value: "KYC", label: "KYC" },
  { value: "CRM", label: "CRM" },
  { value: "CSO", label: "CSO" },
  { value: "management", label: "Management" },
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
      <div className="max-w-4xl">
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
