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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#F8F4E8] via-[#EDE6CE] to-[#F0E8D4] p-4 relative">
      <div className="mesh-gradient" />
      <div className="w-full max-w-md p-8 rounded-2xl glass-card relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#141623] to-[#1a1c2e] flex items-center justify-center border border-[#C5A05A]/20"><Building2 className="w-5 h-5 text-[#C5A05A]" /></div>
          <div><h1 className="font-editorial text-xl text-[#141623]">Real Estate CRM</h1><p className="text-xs text-[#8A7E6E]">Booking & Workflow Management</p></div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#8A7E6E] uppercase tracking-wider">Email</label>
            <input className="flex h-9 w-full rounded-xl border border-[#C5A05A]/20 bg-white/60 px-3 py-1 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-[#C5A05A]/20" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs font-bold text-[#8A7E6E] uppercase tracking-wider">Password</label>
            <input className="flex h-9 w-full rounded-xl border border-[#C5A05A]/20 bg-white/60 px-3 py-1 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-[#C5A05A]/20" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">{error}</p>}
          <button className="btn-luxury w-full text-xs uppercase tracking-widest" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="text-sm text-center mt-4 text-[#8A7E6E]">
          <Link href="/register" className="text-[#8A6F3B] hover:text-[#141623] font-medium">Create an account</Link>
        </p>
        <div className="mt-6 text-xs text-[#8A7E6E] space-y-1 border-t border-[#EDE6CE]/60 pt-4">
          <p className="font-semibold text-[#141623]">Roles (§1.1)</p>
          <p>CRM — Create allocations</p>
          <p>Super Admin — Full access</p>
          <p>Legal / CFO / Admin — approve at their stage (§1.6b)</p>
        </div>
      </div>
    </div>
  )
}
