"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { Building2 } from "lucide-react"

function friendlyError(msg: string) {
  if (msg.includes("auth/user-not-found") || msg.includes("auth/invalid-credential")) return "Invalid email or password"
  if (msg.includes("auth/too-many-requests")) return "Too many attempts. Try again later."
  if (msg.includes("auth/invalid-email")) return "Invalid email format"
  return msg
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try { await login(email, password); router.push("/dashboard") }
    catch (err: any) { setError(friendlyError(err.message || "Login failed")) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 p-4">
      <div className="w-full max-w-md p-8 rounded-xl bg-white dark:bg-gray-900 shadow-xl border dark:border-gray-800">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center"><Building2 className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-lg font-bold">Real Estate CRM</h1><p className="text-xs text-gray-500">Booking & Workflow Management</p></div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input className="flex h-9 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-1 text-sm shadow-sm mt-1" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input className="flex h-9 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-1 text-sm shadow-sm mt-1" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button className="inline-flex items-center justify-center h-9 px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white shadow hover:bg-blue-700 w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="text-sm text-center mt-4">
          <Link href="/register" className="text-blue-600 hover:underline">Create an account</Link>
        </p>
        <div className="mt-6 text-xs text-gray-400 space-y-1 border-t pt-4 dark:border-gray-800">
          <p className="font-medium">Roles:</p>
          <p>data_entry - Can create bookings</p>
          <p>super_admin - Full access, admin panel</p>
        </div>
      </div>
    </div>
  )
}
