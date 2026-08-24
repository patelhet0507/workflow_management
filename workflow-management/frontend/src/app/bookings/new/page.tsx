"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { api, type BookingFieldDef, SECTION_NAMES } from "@/lib/api"
import AppLayout from "@/components/app-layout"
import { Label } from "@/components/ui/label"
import { Plus, ScrollText } from "lucide-react"

export default function NewBookingPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [error, setError] = useState("")
  const [fields, setFields] = useState<BookingFieldDef[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [isDirect, setIsDirect] = useState(false)
  const [directRemark, setDirectRemark] = useState("")

  useEffect(() => { if (!isLoading && !user) router.push("/login") }, [user, isLoading, router])
  useEffect(() => {
    api.getBookingForm().then((f) => {
      setFields(f)
      setValues(Object.fromEntries(f.map((x) => [x.key, ""])))
    }).catch(console.error)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!user) return
    for (const f of fields) {
      if (f.required && !String(values[f.key] || "").trim()) return setError(`"${f.label}" is required`)
    }
    if (isDirect && !directRemark.trim()) return setError("Direct Sale Deed requires a remark (§26)")
    const data: Record<string, any> = {}
    fields.forEach((f) => {
      if (f.type === "checkbox") { data[f.key] = values[f.key] === "true"; return }
      data[f.key] = String(values[f.key] || "").trim()
    })
    data.is_direct_sale_deed = isDirect
    if (isDirect) data.direct_sale_deed_remark = directRemark.trim()
    try {
      await api.createBooking(data, user.id, user.name, user.role)
      router.push("/bookings")
    } catch (err: any) { setError(err.message) }
  }

  const sections = Array.from(new Set(fields.map((f) => f.section || "unit_allocation")))

  const renderField = (f: BookingFieldDef) => (
    <div key={f.key} className={f.type === "textarea" || f.type === "checkbox" ? "md:col-span-2 space-y-2" : "space-y-2"}>
      <Label className="text-[#8A7E6E] text-xs uppercase tracking-wider">{f.label}{f.required && <span className="text-red-500"> *</span>}</Label>
      {f.type === "checkbox" ? (
        <label className="flex items-center gap-2 text-sm text-[#141623]">
          <input type="checkbox" checked={values[f.key] === "true"} onChange={(e) => setValues({ ...values, [f.key]: e.target.checked ? "true" : "" })} className="accent-[#C5A05A]" />
          {f.label}
        </label>
      ) : f.type === "textarea" ? (
        <textarea value={values[f.key]} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
          placeholder={f.label}
          className="flex min-h-[80px] w-full rounded-xl border border-[#C5A05A]/20 bg-white/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A05A]/20" />
      ) : f.type === "select" ? (
        <select value={values[f.key]} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
          className="flex h-9 w-full rounded-xl border border-[#C5A05A]/20 bg-white/60 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A05A]/20">
          <option value="">Select...</option>
          {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={f.type} value={values[f.key]} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
          placeholder={f.label} className="flex h-9 w-full rounded-xl border border-[#C5A05A]/20 bg-white/60 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A05A]/20" />
      )}
    </div>
  )

  if (isLoading || !user) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F4E8] via-[#EDE6CE] to-[#F0E8D4] text-[#141623] relative">
      <div className="mesh-gradient" />
      <div className="max-w-6xl mx-auto px-6 py-10 relative z-10">
        <AppLayout>
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C5A05A]/20 to-[#8A6F3B]/10 flex items-center justify-center border border-[#C5A05A]/20"><ScrollText size={16} className="text-[#8A6F3B]" /></span>
              <h1 className="font-editorial text-4xl text-[#141623]">New Allocation</h1>
            </div>
            <div className="glass-card p-6 md:p-8">
              <div className="flex items-center gap-2 mb-6"><span className="w-1 h-5 bg-gradient-to-b from-[#C5A05A] to-[#8A6F3B] rounded-full" /><h2 className="font-editorial text-xl text-[#141623]">Booking Details</h2></div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-[#8A7E6E] text-xs uppercase tracking-wider">Booked By</Label>
                  <input value={`${user.name}`} disabled className="flex h-9 w-full rounded-xl border border-[#C5A05A]/10 bg-[#C5A05A]/5 px-3 py-1 text-sm text-[#8A7E6E]" />
                </div>
                {sections.map((section) => (
                  <div key={section} className="pt-4 border-t border-[#EDE6CE]/60">
                    <p className="text-xs font-bold text-[#8A7E6E] uppercase tracking-widest mb-3">{SECTION_NAMES[section] || section.replace(/_/g, " ")}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {fields.filter((f) => (f.section || "unit_allocation") === section).map(renderField)}
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t border-[#EDE6CE]/60">
                  <label className="flex items-center gap-2 text-sm text-[#141623] mb-2"><input type="checkbox" checked={isDirect} onChange={e=>setIsDirect(e.target.checked)} className="accent-[#C5A05A]" /> Direct Sale Deed Case — skip ATS (v1.3.2 §26)</label>
                  {isDirect && <><p className="text-xs text-[#8A7E6E] mb-1">ATS shown as Skipped/N-A, never pending; Sale Deed Management gate still mandatory.</p><input value={directRemark} onChange={e=>setDirectRemark(e.target.value)} placeholder="Direct Sale Deed remark (mandatory)" className="flex h-9 w-full rounded-xl border border-[#C5A05A]/20 bg-white/60 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A05A]/20" /></>}
                </div>
                <div className="pt-4 border-t border-[#EDE6CE]/60">
                  <p className="text-xs font-bold text-[#8A7E6E] uppercase tracking-widest mb-2">Sign-offs (done by respective teams after creation)</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: "CSO Sign", by: "CSO" },
                      { key: "KYC Upload", by: "CRM" },
                      { key: "CRM Team Sign", by: "CRM" },
                      { key: "Management Sign", by: "Management" },
                    ].map((s) => (
                      <span key={s.key} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/60 text-[#8A7E6E] border border-[#C5A05A]/15">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C5A05A]/40" />
                        {s.key} · {s.by}
                      </span>
                    ))}
                  </div>
                </div>
                {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">{error}</p>}
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="btn-luxury text-xs uppercase tracking-widest inline-flex items-center gap-2"><Plus size={14}/> Create Booking</button>
                  <button type="button" onClick={() => router.push("/bookings")} className="border border-[#C5A05A]/20 text-[#8A6F3B] px-5 py-2.5 rounded-xl text-xs font-medium hover:bg-white/60 transition">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </AppLayout>
      </div>
    </div>
  )
}
