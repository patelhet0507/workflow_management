"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2 } from "lucide-react"

const roles = [
  { value: "data_entry", label: "Data Entry" },
  { value: "sales_exec", label: "Sales Executive" },
  { value: "crm", label: "CRM" },
  { value: "management", label: "Management" },
  { value: "finance", label: "Finance" },
  { value: "super_admin", label: "Admin" },
]

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("data_entry")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await register(email, password, name, role)
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 p-4">
      <div className="w-full max-w-md p-8 rounded-xl bg-white dark:bg-gray-900 shadow-xl border dark:border-gray-800">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center"><Building2 className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-lg font-bold">Create Account</h1><p className="text-xs text-gray-500">Join Real Estate CRM</p></div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your full name" className="focus:ring-2 focus:ring-blue-500" /></div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className="focus:ring-2 focus:ring-blue-500" /></div>
          <div className="space-y-2"><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Min 6 characters" className="focus:ring-2 focus:ring-blue-500" /></div>
          <div className="space-y-2">
            <Label>Role</Label>
            <div className="flex flex-wrap gap-1.5">
              {roles.map((r) => (
                <button key={r.value} type="button" onClick={() => setRole(r.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    role === r.value
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-400"
                  }`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/50 px-3 py-2 rounded-md">{error}</p>}
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>{loading ? "Creating..." : "Register"}</Button>
        </form>
        <p className="text-sm text-center mt-4 text-gray-500">
          Already have an account? <Link href="/login" className="text-blue-600 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  )
}
