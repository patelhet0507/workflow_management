"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { ROLES } from "@/lib/constants"
import { Building2 } from "lucide-react"

const roles = ROLES

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("crm")
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#F8F4E8] via-[#EDE6CE] to-[#F0E8D4] p-4 relative">
      <div className="mesh-gradient" />
      <div className="w-full max-w-md p-8 rounded-2xl glass-card relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#141623] to-[#1a1c2e] flex items-center justify-center border border-[#C5A05A]/20"><Building2 className="w-5 h-5 text-[#C5A05A]" /></div>
          <div><h1 className="font-editorial text-xl text-[#141623]">Create Account</h1><p className="text-xs text-[#8A7E6E]">Join Real Estate CRM</p></div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1"><label className="text-xs font-bold text-[#8A7E6E] uppercase tracking-wider">Name</label><input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your full name" className="flex h-9 w-full rounded-xl border border-[#C5A05A]/20 bg-white/60 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A05A]/20" /></div>
          <div className="space-y-1"><label className="text-xs font-bold text-[#8A7E6E] uppercase tracking-wider">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className="flex h-9 w-full rounded-xl border border-[#C5A05A]/20 bg-white/60 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A05A]/20" /></div>
          <div className="space-y-1"><label className="text-xs font-bold text-[#8A7E6E] uppercase tracking-wider">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Min 6 characters" className="flex h-9 w-full rounded-xl border border-[#C5A05A]/20 bg-white/60 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A05A]/20" /></div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#8A7E6E] uppercase tracking-wider">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}
              className="flex h-9 w-full rounded-xl border border-[#C5A05A]/20 bg-white/60 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A05A]/20">
              {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">{error}</p>}
          <button type="submit" className="btn-luxury w-full text-xs uppercase tracking-widest" disabled={loading}>{loading ? "Creating..." : "Register"}</button>
        </form>
        <p className="text-sm text-center mt-4 text-[#8A7E6E]">
          Already have an account? <Link href="/login" className="text-[#8A6F3B] hover:text-[#141623] font-medium">Login</Link>
        </p>
      </div>
    </div>
  )
}
