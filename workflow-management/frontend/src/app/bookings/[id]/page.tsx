"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { api, type StageDef, type BookingFieldDef } from "@/lib/api"
import { FIELD_GROUPS, statusLabel, roleLabel, type FieldGroup, canonicalRole } from "@/lib/constants"
import AppLayout from "@/components/app-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollText, ShieldCheck, History, FileText, Pencil, Save, X } from "lucide-react"

function CustodyPanel({ bookingId }: { bookingId: string }) {
  const { user } = useAuth()
  const [log, setLog] = useState<any[]>([])
  const [docId, setDocId] = useState("ATS_PRINT")
  const [toRole, setToRole] = useState("legal")
  const [remark, setRemark] = useState("")
  const load = ()=> { if (!bookingId) return; api.getCustodyLog(bookingId).then(setLog).catch(()=>{}) }
  useEffect(()=>{ if (!bookingId) return; load() },[bookingId])
  if (!bookingId) return null
  return (<>
    <div className="flex gap-2 flex-wrap items-center mb-3">
      <select value={docId} onChange={e=>setDocId(e.target.value)} className="h-8 rounded-xl border border-[#C5A05A]/20 bg-white/60 px-2 text-xs"><option value="ATS_PRINT">ATS Print</option><option value="SALE_DEED_PRINT">Sale Deed Print</option></select>
      <select value={toRole} onChange={e=>setToRole(e.target.value)} className="h-8 rounded-xl border border-[#C5A05A]/20 bg-white/60 px-2 text-xs"><option value="crm">CRM</option><option value="legal">Legal Manager</option><option value="legal_execution">Legal Exec</option><option value="accounts">CFO</option><option value="admin">Admin</option></select>
      <input value={remark} onChange={e=>setRemark(e.target.value)} placeholder="Remark" className="h-8 rounded-xl border border-[#C5A05A]/20 bg-white/60 px-2 text-xs flex-1 min-w-[120px]" />
      <button onClick={async()=>{ await api.transferCustody(bookingId, docId, toRole, "", remark, user?.id||"self", user?.name||"self"); setRemark(""); load()}} className="btn-luxury text-xs py-1.5 px-3">Transfer</button>
    </div>
    {log.length===0? <p className="text-xs text-[#8A7E6E]">No custody transfers yet — latest per document shown above when present.</p> :
      <div className="overflow-x-auto rounded-xl border border-[#EDE6CE]/60"><table className="w-full text-xs"><thead className="bg-gradient-to-r from-[#141623]/5 to-transparent"><tr className="text-[#8A7E6E] text-left"><th className="p-2 font-semibold uppercase tracking-wider text-[11px]">Document</th><th className="p-2">To</th><th className="p-2">At</th><th className="p-2">Remark</th></tr></thead><tbody>{log.slice().reverse().map((c:any,i:number)=>(<tr key={i} className="border-t border-[#EDE6CE]/40"><td className="p-2">{c.document_id}</td><td className="p-2">{c.to_role}</td><td className="p-2 text-[#8A7E6E]">{c.created_at?.toMillis? new Date(c.created_at.toMillis()).toLocaleString():""}</td><td className="p-2">{c.remark||"—"}</td></tr>))}</tbody></table></div>}
  </>)
}

const statusColors: Record<string, any> = {
  booking_completed: "secondary", unit_allocated: "secondary", kyc_pending: "secondary", kyc_completed: "secondary", crm_approved: "secondary", management_approval_pending: "secondary", ats_approved: "secondary", sale_deed_approved: "secondary", print_requested: "secondary", documents_printed: "secondary", legal_verification_pending: "secondary", accounts_verification_pending: "secondary", client_signature_pending: "secondary", executed: "secondary", registration_completed: "secondary", index_ii_received: "secondary", document_scanned: "secondary", sales_closed: "secondary", archived: "secondary", completed: "success", rejected: "destructive",
}
const SIGN_LABELS: Record<string, string> = { cso_sign: "CSO Sign", kyc_upload: "KYC Upload", crm_team_sign: "CRM Team Sign", management_sign: "Management Sign" }
function displayValue(f: { key: string; type?: string }, booking: any): string {
  const raw = booking[f.key]
  if (raw === undefined || raw === null || raw === "") return "-"
  if (f.type === "checkbox") return raw ? "Yes" : "No"
  if (f.type === "number") return Number(raw).toLocaleString()
  return String(raw)
}
export default function BookingDetailPage() {
  const { user, isLoading, verifyPassword } = useAuth()
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [booking, setBooking] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [flow, setFlow] = useState<StageDef[]>([])
  const [formFields, setFormFields] = useState<BookingFieldDef[]>([])
  const [comment, setComment] = useState("")
  const [error, setError] = useState("")
  const [loadError, setLoadError] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState("")
  const [password, setPassword] = useState("")
  const [confirmError, setConfirmError] = useState("")
  const [editingGroup, setEditingGroup] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, string | boolean>>({})
  const [saveError, setSaveError] = useState("")
  const load = () => {
    if (!id || !user) return
    setLoadError("")
    Promise.all([ api.getBooking(id), api.getBookingHistory(id), api.getApprovalFlow(), api.getBookingForm(), ]).then(([b, h, f, bf]) => { setBooking(b); setHistory(h); setFlow(f); setFormFields(bf) }).catch((e:any)=>{ console.error(e); setLoadError(e.message||"Failed to load booking") })
  }
  useEffect(() => { if (!isLoading && !user) router.push("/login"); else if (id && user) load() }, [user, isLoading, router, id])
  const confirmAndApprove = async (action: string) => {
    setConfirmError("")
    try { await verifyPassword(password); if (!user) return; await api.approveBooking(id, action, comment, user.id, user.name, user.role); setConfirmOpen(false); setPassword(""); setComment(""); load() } catch (err: any) { if (err.code === "auth/wrong-password" || err.message?.includes("wrong-password") || err.message?.includes("invalid-credential")) setConfirmError("Incorrect password"); else setConfirmError(err.message || "Verification failed") }
  }
  const canApprove = (): { allowed: boolean; reason?: string } => {
    if (!user || !booking) return { allowed: false }
    if (booking.status === "completed" || booking.status === "rejected") return { allowed: false, reason: "Booking already finalized" }
    if (booking.lifecycle_status === "CANCELLED" || booking.lifecycle_status === "SUPERSEDED") return { allowed: false, reason: "Transaction is terminal — no further actions" }
    const stage = flow.find((s) => s.status === booking.status)
    if (!stage) return { allowed: false, reason: "Cannot approve at this stage" }
    const me = canonicalRole(user.role)
    if (me === "super_admin") return { allowed: true }
    const alias: Record<string,string[]> = { legal:["crm","accounts"], crm:["crm"], crm_executive:["crm"] }
    const acting = alias[stage.role] || [stage.role]
    if (me !== stage.role && !acting.includes(me)) return { allowed: false, reason: `Only ${roleLabel(stage.role)} can approve at this stage (you are ${roleLabel(me)})` }
    return { allowed: true }
  }
  const canEditGroup = (group: FieldGroup): boolean => { if (!user) return false; const me = canonicalRole(user.role); return group.owners.includes(me) }
  const startEdit = (group: FieldGroup) => { const d: Record<string, string | boolean> = {}; group.fields.forEach((f) => { const v = booking[f.key]; d[f.key] = f.type === "checkbox" ? !!v : (v === undefined || v === null ? "" : String(v)) }); setDraft(d); setEditingGroup(group.key); setSaveError("") }
  const saveGroup = async (group: FieldGroup) => {
    if (!id) return; setSaveError(""); const updates: Record<string, any> = {}; group.fields.forEach((f) => { const v = draft[f.key]; if (f.type === "checkbox") { updates[f.key] = !!v; return } const s = v === undefined ? "" : String(v).trim(); if (s === "") { updates[f.key] = null; return } updates[f.key] = f.type === "number" ? parseFloat(s) : s }); try { await api.updateBooking(id, updates); setEditingGroup(null); load() } catch (err: any) { setSaveError(err.message || "Save failed") }
  }
  if (isLoading || !user) return null
  if (loadError) return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F4E8] via-[#EDE6CE] to-[#F0E8D4] flex items-center justify-center p-6"><div className="glass-card p-8 max-w-md text-center"><p className="font-editorial text-xl text-[#141623] mb-2">Failed to load booking</p><p className="text-sm text-[#8A7E6E] mb-4">{loadError}</p><p className="text-xs text-[#8A7E6E]">ID: {id}</p><button onClick={()=>load()} className="btn-luxury mt-4 text-xs">Retry</button></div></div>
  )
  if (!booking) return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F4E8] via-[#EDE6CE] to-[#F0E8D4] flex items-center justify-center p-6"><div className="glass-card p-8 text-center"><p className="text-sm text-[#8A7E6E]">Loading booking…</p></div></div>
  )
  const stages = [{ status: "booking_completed", role: "Created" }, ...flow, { status: "completed", role: "Completed" }]
  const currentIdx = stages.findIndex((s) => s.status === booking.status)
  const progress = booking.status === "rejected" ? 0 : booking.status === "completed" ? 100 : Math.max(0, currentIdx) * (100 / (stages.length - 1))
  const approval = canApprove()
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F4E8] via-[#EDE6CE] to-[#F0E8D4] text-[#141623] relative">
      <div className="mesh-gradient" />
      <div className="max-w-6xl mx-auto px-6 py-10 relative z-10">
        <AppLayout>
          <div className="max-w-5xl space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C5A05A]/20 to-[#8A6F3B]/10 flex items-center justify-center border border-[#C5A05A]/20"><ScrollText size={16} className="text-[#8A6F3B]" /></span>
                <h1 className="font-editorial text-4xl text-[#141623]">{booking.client_name || "Booking"}</h1>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {booking.previous_cancelled_transaction_id && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Rebooking · {String(booking.previous_cancelled_transaction_id).slice(0,6)}</span>}
                {booking.source_transaction_id && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Unit Change · {String(booking.source_transaction_id).slice(0,6)}</span>}
                {booking.is_direct_sale_deed && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">Direct Sale Deed</span>}
                <Badge variant={statusColors[booking.status] || "outline"}>{statusLabel(booking.status)}</Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[{ k:"Workflow", v: booking.status_workflow || (booking.status==="completed"?"COMPLETED":"IN_PROGRESS") },{ k:"Document", v: booking.status_document || "PENDING" },{ k:"Financial", v: booking.status_financial || "PENDING" },{ k:"Handover", v: booking.status_handover || "PENDING" },{ k:"Overall", v: booking.status_overall || "IN_PROGRESS" },].map(s=>(
                <span key={s.k} className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${s.v==="COMPLETED"||s.v==="CLOSED"?"bg-emerald-50 text-emerald-700 border-emerald-200": s.v==="ATTENTION_REQUIRED"?"bg-red-50 text-red-700 border-red-200":"bg-white/60 text-[#8A7E6E] border-[#C5A05A]/20"}`}>{s.k}: {s.v}</span>
              ))}
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-[#C5A05A]/15 to-[#C5A05A]/5 text-[#8A6F3B] border border-[#C5A05A]/20">Lifecycle: {booking.lifecycle_status||"ACTIVE"}</span>
            </div>
            <div className="glass-card p-5">
              <div className="h-2 rounded-full bg-[#C5A05A]/10 overflow-hidden"><div className="h-full bg-gradient-to-r from-[#C5A05A] to-[#8A6F3B] transition-all" style={{width: `${progress}%`}} /></div>
              <div className="flex justify-between text-[11px] text-[#8A7E6E] mt-2 gap-1 flex-wrap">
                {stages.map((s, i) => (<span key={s.status} className={i <= currentIdx && booking.status !== "rejected" ? "text-[#8A6F3B] font-semibold" : ""}>{s.role}</span>))}
              </div>
            </div>
            {formFields.length > 0 && (
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4"><span className="w-1 h-5 bg-gradient-to-b from-[#C5A05A] to-[#8A6F3B] rounded-full inline-block" /><h3 className="font-editorial text-lg text-[#141623]">Booking Details</h3></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                  {formFields.map((f) => (<div key={f.key} className={f.type === "textarea" ? "md:col-span-2" : ""}><p className="text-xs font-medium text-[#8A7E6E] uppercase tracking-wider">{f.label}{f.required && <span className="text-red-500"> *</span>}</p><p className="text-sm font-medium text-[#141623]">{displayValue(f, booking)}</p></div>))}
                </div>
                <div className="mt-4 pt-3 border-t border-[#EDE6CE]/60 flex flex-wrap gap-2">
                  {(["cso_sign", "kyc_upload", "crm_team_sign", "management_sign"] as const).map((k) => (<div key={k} className="flex items-center gap-1.5 text-xs"><span className={`w-2 h-2 rounded-full ${booking[k] ? "bg-emerald-500" : "bg-[#C5A05A]/20"}`} /><span className="text-[#8A7E6E]">{SIGN_LABELS[k]}</span>{booking[k] ? <span className="font-medium text-[#141623]">{booking[k]}</span> : <span className="text-[#8A7E6E]">pending</span>}</div>))}
                </div>
              </div>
            )}
            <div className="space-y-5">
              {FIELD_GROUPS.map((group) => {
                const editing = editingGroup === group.key
                return (
                  <div key={group.key} className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2"><span className="w-1 h-5 bg-gradient-to-b from-[#C5A05A] to-[#8A6F3B] rounded-full inline-block" /><h3 className="font-editorial text-lg text-[#141623]">{group.label}</h3></div>
                      {!editing && canEditGroup(group) && (<button onClick={() => startEdit(group)} className="inline-flex items-center gap-1.5 border border-[#C5A05A]/20 text-[#8A6F3B] px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-white/60 transition"><Pencil className="w-3.5 h-3.5" /> Edit</button>)}
                    </div>
                    {editing ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {group.fields.map((f) => (<div key={f.key} className={f.type === "textarea" || f.type === "checkbox" ? "md:col-span-2" : ""}><Label className="text-xs text-[#8A7E6E] uppercase tracking-wider">{f.label}</Label>{f.type === "checkbox" ? (<label className="flex items-center gap-2 mt-1.5 text-sm text-[#141623]"><input type="checkbox" checked={!!draft[f.key]} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.checked })} className="accent-[#C5A05A]" />{f.label}</label>) : f.type === "textarea" ? (<textarea value={String(draft[f.key] ?? "")} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} className="mt-1 flex min-h-[60px] w-full rounded-xl border border-[#C5A05A]/20 bg-white/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A05A]/20" />) : (<Input type={f.type || "text"} value={String(draft[f.key] ?? "")} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} className="mt-1 focus:ring-2 focus:ring-[#C5A05A]/20" />)}</div>))}
                        {saveError && <p className="text-sm text-red-600 md:col-span-2">{saveError}</p>}
                        <div className="md:col-span-2 flex gap-2"><button onClick={() => saveGroup(group)} className="btn-luxury text-xs inline-flex items-center gap-1.5"><Save className="w-3.5 h-3.5" /> Save</button><button onClick={() => { setEditingGroup(null); setSaveError("") }} className="border border-[#C5A05A]/20 text-[#8A7E6E] px-4 py-2 rounded-xl text-xs font-medium hover:bg-white/60 inline-flex items-center gap-1.5"><X className="w-3.5 h-3.5" /> Cancel</button></div>
                      </div>
                    ) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5">{group.fields.map((f) => (<div key={f.key} className={f.type === "textarea" ? "md:col-span-2" : ""}><p className="text-xs font-medium text-[#8A7E6E] uppercase tracking-wider">{f.label}</p><p className="text-sm font-medium text-[#141623]">{displayValue(f, booking)}</p></div>))}</div>)}
                  </div>
                )
              })}
            </div>
            {booking.status !== "completed" && booking.status !== "rejected" && (
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4"><ShieldCheck size={16} className="text-[#8A6F3B]" /><h3 className="text-xs font-bold text-[#8A7E6E] uppercase tracking-widest">Approval Action — Send Back requires remark (§68)</h3></div>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Remark — mandatory for Send Back, optional for Approve..." className="mb-3 flex min-h-[60px] w-full rounded-xl border border-[#C5A05A]/20 bg-white/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A05A]/20" />
                {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
                {!approval.allowed && approval.reason && <p className="text-sm text-[#8A7E6E] mb-2 italic">{approval.reason}</p>}
                {approval.allowed && (<div className="flex gap-2 flex-wrap"><button onClick={() => { setPendingAction("approve"); setConfirmOpen(true) }} className="btn-luxury text-xs">Approve &amp; move forward</button><button onClick={async()=>{ if(!comment.trim()){setError("Send Back requires a remark");return;} setError(""); setPendingAction("SEND_BACK"); setConfirmOpen(true)}} className="border border-red-200 text-red-700 px-4 py-2 rounded-xl text-xs font-medium hover:bg-red-50">Send Back</button><button onClick={() => { setPendingAction("reject"); setConfirmOpen(true) }} className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-medium hover:bg-red-700">Reject</button></div>)}
              </div>
            )}
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-3"><FileText size={16} className="text-[#8A6F3B]" /><h3 className="text-xs font-bold text-[#8A7E6E] uppercase tracking-widest">Physical Custody — per document (§1.7, identity from print)</h3></div>
              <p className="text-xs text-[#8A7E6E] mb-3">ATS_PRINT / SALE_DEED_PRINT gets identity at Legal Exec print (§1.4) — transfer picks the specific document.</p>
              <CustodyPanel bookingId={id} />
            </div>
            {confirmOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#141623]/40 backdrop-blur-sm"><div className="glass-card p-6 w-full max-w-sm mx-4 shadow-2xl"><h3 className="font-editorial text-lg mb-1 capitalize text-[#141623]">{pendingAction} Booking</h3><p className="text-sm text-[#8A7E6E] mb-4">Enter your password to confirm</p><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" className="mb-3 focus:ring-2 focus:ring-[#C5A05A]/20" onKeyDown={(e) => { if (e.key === "Enter") confirmAndApprove(pendingAction) }} autoFocus />{confirmError && <p className="text-sm text-red-600 mb-3">{confirmError}</p>}<div className="flex gap-2 justify-end"><button onClick={() => { setConfirmOpen(false); setPassword(""); setConfirmError("") }} className="border border-[#C5A05A]/20 px-4 py-2 rounded-xl text-sm">Cancel</button><button onClick={() => confirmAndApprove(pendingAction)} className="btn-luxury text-sm">Confirm</button></div></div></div>)}
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4"><History size={16} className="text-[#8A6F3B]" /><h3 className="text-xs font-bold text-[#8A7E6E] uppercase tracking-widest">Approval History</h3></div>
              {history.length === 0 ? <p className="text-sm text-[#8A7E6E]">No history yet</p> : (<div className="space-y-3">{history.map((h: any, i: number) => (<div key={i} className="flex items-start gap-3 text-sm pb-3 border-b border-[#EDE6CE]/40 last:border-0"><div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${h.action === "reject" ? "bg-red-500" : "bg-[#C5A05A]"}`} /><div><p className="font-medium capitalize text-[#141623]">{h.action} by {h.user_name || h.user_id}</p><p className="text-[#8A7E6E] text-xs">{h.created_at ? new Date(h.created_at.toMillis()).toLocaleString() : ""}</p>{h.comment && <p className="text-[#5B5340] mt-1 text-xs italic">"{h.comment}"</p>}</div></div>))}</div>)}
            </div>
          </div>
        </AppLayout>
      </div>
    </div>
  )
}
