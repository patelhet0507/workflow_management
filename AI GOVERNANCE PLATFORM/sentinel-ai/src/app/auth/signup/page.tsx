"use client"

import { useState, FormEvent } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Eye, EyeOff, UserPlus, Shield, AlertCircle, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"form" | "done">("form")
  const router = useRouter()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(""); setLoading(true)

    const { data, error: authErr } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
    if (authErr) { setError(authErr.message); setLoading(false); return }
    if (!data.user) { setError("Sign up failed"); setLoading(false); return }

    const { error: wsErr } = await supabase.from("workspaces").insert({ name: name + "'s Workspace" })
    if (wsErr) { setError(wsErr.message); setLoading(false); return }

    const { data: ws } = await supabase.from("workspaces").select("id").order("created_at", { ascending: false }).limit(1).single()
    if (!ws) { setError("Failed to create workspace"); setLoading(false); return }

    const { error: userErr } = await supabase.from("users").insert({ auth_id: data.user.id, name, email, role: "User", workspace_id: ws.id, avatar: name.charAt(0).toUpperCase() })
    if (userErr) { setError(userErr.message); setLoading(false); return }

    const apiKey = "sk-" + crypto.randomUUID().replace(/-/g, "")
    await supabase.from("api_keys").insert({ workspace_id: ws.id, name: "Default", key: apiKey })

    setStep("done"); setLoading(false)
    setTimeout(() => { router.push("/settings"); router.refresh() }, 1500)
  }

  if (step === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.06),transparent_60%)]" />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 flex flex-col items-center gap-4">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.1 }} className="h-16 w-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <Check className="h-8 w-8 text-green-400" />
          </motion.div>
          <h2 className="text-xl font-semibold text-neutral-50">Account created</h2>
          <p className="text-sm text-neutral-500">Redirecting to your workspace...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(168,85,247,0.04),transparent_60%)]" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10 w-full max-w-md p-6">
        <div className="flex flex-col items-center mb-8">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
            <Shield className="h-6 w-6 text-white" />
          </motion.div>
          <h1 className="text-2xl font-semibold text-neutral-50">Create your account</h1>
          <p className="text-sm text-neutral-500 mt-1">Get started with Sentinel AI governance</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-xl border border-neutral-800/60 bg-neutral-900/50 backdrop-blur-sm p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-400">Full name</label>
              <Input type="text" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-400">Email</label>
              <Input type="email" placeholder="jane@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-400">Password</label>
              <div className="relative">
                <Input type={showPw ? "text" : "password"} placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="pr-9" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-2 rounded-lg bg-red-950/50 border border-red-900/50 p-3">
                <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-xs text-red-300">{error}</p>
              </motion.div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-9 gap-2 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20">
              {loading ? <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-neutral-500">Already have an account? <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 font-medium">Sign in</Link></p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-6 flex items-center justify-center gap-6 text-[11px] text-neutral-600">
          <span>Auto-provisions workspace</span>
          <span className="h-1 w-1 rounded-full bg-neutral-700" />
          <span>Generates API key</span>
          <span className="h-1 w-1 rounded-full bg-neutral-700" />
          <span>Free to start</span>
        </motion.div>
      </motion.div>
    </div>
  )
}
