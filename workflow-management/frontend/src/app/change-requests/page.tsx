"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import AppLayout from "@/components/app-layout";
import { FileEdit, Send, CheckCircle2, Clock } from "lucide-react";

export default function ChangesPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [selected, setSelected] = useState("");
  const [type, setType] = useState<"cancellation"|"unit"|"customer">("cancellation");
  const [reason, setReason] = useState("");
  const [financial, setFinancial] = useState(false);
  const [newUnit, setNewUnit] = useState("");
  const [proposed, setProposed] = useState("");
  const [msg, setMsg] = useState("");
  const [pending, setPending] = useState<any[]>([]);
  const [mode, setMode] = useState<"raise"|"pending">("raise");

  const load = () => {
    if (!user) return;
    api.getBookings().then(setBookings).catch(()=>{});
    Promise.all([api.getCancellations().catch(()=>[]), api.getUnitChanges().catch(()=>[]), api.getCustomerChanges().catch(()=>[])]).then(([c,u,cu])=>{
      const all = [...(c as any[]).map(x=>({...x, _type:"Cancellation"})), ...(u as any[]).map(x=>({...x, _type:"Unit Change"})), ...(cu as any[]).map(x=>({...x, _type:"Customer Change"}))].sort((a:any,b:any)=> (b.created_at?.toMillis?.()||0)-(a.created_at?.toMillis?.()||0))
      setPending(all)
    }).catch(()=>{})
  };
  useEffect(()=>{ load() },[user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg("");
    if (!selected) return setMsg("Select a booking");
    if (!reason.trim()) return setMsg("Reason required (§1.9 formal remark)");
    try{
      if (type==="cancellation") await api.requestCancellation(selected, reason, financial, user!.id);
      else if (type==="unit") { if(!newUnit.trim()) return setMsg("New unit required"); await api.requestUnitChange(selected, newUnit.trim(), reason, user!.id); }
      else { if(!proposed.trim()) return setMsg("Proposed name required"); await api.requestCustomerChange(selected, proposed.trim(), reason, user!.id); }
      setMsg("Request raised"); setReason(""); setNewUnit(""); setProposed(""); load();
    } catch(err:any){ setMsg(err.message)}
  };

  const approve = async (r:any) => {
    try{
      if (r._type==="Cancellation") await api.approveCancellation(r.id, user!.id);
      else if (r._type==="Customer Change") await api.approveCustomerChange(r.id, user!.id);
      else setMsg("Unit Change approval creates new transaction — use detail page");
      load();
    } catch(e:any){ setMsg(e.message)}
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F4E8] via-[#EDE6CE] to-[#F0E8D4] text-[#141623] relative">
      <div className="mesh-gradient" />
      <div className="max-w-6xl mx-auto px-6 py-10 relative z-10">
        <AppLayout>
          <div className="max-w-5xl space-y-8">
            <div className="flex items-center gap-3"><span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C5A05A]/20 to-[#8A6F3B]/10 flex items-center justify-center border border-[#C5A05A]/20"><FileEdit size={18} className="text-[#8A6F3B]" /></span><h1 className="font-editorial text-4xl">Change Requests</h1></div>

            <div className="flex gap-2">
              <button onClick={()=>setMode("raise")} className={`px-4 py-2 rounded-xl text-xs font-semibold border ${mode==="raise"?"bg-gradient-to-r from-[#C5A05A]/15 to-[#C5A05A]/5 text-[#8A6F3B] border-[#C5A05A]/20":"bg-white/60 text-[#8A7E6E] border-[#C5A05A]/15"}`}>Raise Request (§1.9)</button>
              <button onClick={()=>setMode("pending")} className={`px-4 py-2 rounded-xl text-xs font-semibold border ${mode==="pending"?"bg-gradient-to-r from-[#C5A05A]/15 to-[#C5A05A]/5 text-[#8A6F3B] border-[#C5A05A]/20":"bg-white/60 text-[#8A7E6E] border-[#C5A05A]/15"}`}>Pending ({pending.filter(p=>p.status==="PENDING").length})</button>
            </div>

            {mode==="raise" ? (
              <div className="glass-card p-6 md:p-8">
                <h2 className="font-editorial text-xl mb-4">Raise — CRM only (§2)</h2>
                <form onSubmit={submit} className="space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    {(["cancellation","unit","customer"] as const).map(t=>(
                      <button key={t} type="button" onClick={()=>setType(t)} className={`px-3 py-1.5 rounded-full text-xs font-bold border capitalize ${type===t?"bg-[#C5A05A]/15 text-[#8A6F3B] border-[#C5A05A]/20":"bg-white/60 text-[#8A7E6E] border-[#C5A05A]/15"}`}>{t}</button>
                    ))}
                  </div>
                  <select value={selected} onChange={e=>setSelected(e.target.value)} className="w-full h-9 rounded-xl border border-[#C5A05A]/20 bg-white/60 px-3 text-sm">
                    <option value="">Select booking…</option>
                    {bookings.filter(b=> (b as any).lifecycle_status!=="CANCELLED").map(b=> <option key={b.id} value={b.id}>{b.unit_no} · {b.client_name} · {b.status}</option>)}
                  </select>
                  <textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Formal reason (permanent, distinct from internal comment §1.9)" className="w-full rounded-xl border border-[#C5A05A]/20 bg-white/60 px-3 py-2 text-sm min-h-[70px]" />
                  {type==="cancellation" && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={financial} onChange={e=>setFinancial(e.target.checked)} className="accent-[#C5A05A]" /> Has financial/refund implications (→ CFO then Management)</label>}
                  {type==="unit" && <input value={newUnit} onChange={e=>setNewUnit(e.target.value)} placeholder="New unit number e.g. B-902" className="w-full h-9 rounded-xl border border-[#C5A05A]/20 bg-white/60 px-3 text-sm" />}
                  {type==="customer" && <input value={proposed} onChange={e=>setProposed(e.target.value)} placeholder="Proposed customer name" className="w-full h-9 rounded-xl border border-[#C5A05A]/20 bg-white/60 px-3 text-sm" />}
                  <button type="submit" className="btn-luxury text-xs inline-flex items-center gap-1.5"><Send size={14}/> Raise Request</button>
                  {msg && <p className="text-sm px-3 py-2 rounded-xl border bg-white/60 border-[#C5A05A]/15 text-[#8A6F3B]">{msg}</p>}
                </form>
                <div className="mt-6 grid md:grid-cols-3 gap-4 text-xs leading-relaxed">
                  {[
                    { title: "Cancellation", body: "Config-driven (§1.9): Management-only unless financial_implications → CFO → Management. Old lifecycle → CANCELLED, unit becomes AVAILABLE, previous_cancelled_transaction_id links rebooking (§1.9d no copy)." },
                    { title: "Unit Change", body: "New txn with source_transaction_id + UNIT_CHANGE, old → SUPERSEDED, unit → UNIT_CHANGED. New unit must have no ACTIVE (§1.9 validation)."},
                    { title: "Customer Change", body: "Same txn, customer_name updated. History in customer_changes (never source_change_type=CUSTOMER_CHANGE)."},
                  ].map(c=>(
                    <div key={c.title} className="bg-white/60 rounded-xl p-4 border border-[#C5A05A]/10"><h3 className="font-semibold text-[#141623] mb-1">{c.title}</h3><p className="text-[#5B5340]">{c.body}</p></div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="glass-card p-6">
                <h3 className="font-editorial text-lg mb-3">Pending Requests</h3>
                {pending.length===0 ? <p className="text-sm text-[#8A7E6E]">No requests yet.</p> : (
                  <div className="overflow-x-auto rounded-xl border border-[#EDE6CE]/60">
                    <table className="w-full text-sm">
                      <thead className="bg-gradient-to-r from-[#141623]/5 to-transparent"><tr><th className="text-left p-3 text-xs uppercase tracking-wider text-[#8A7E6E]">Type</th><th className="text-left p-3 text-xs uppercase tracking-wider text-[#8A7E6E]">Transaction</th><th className="text-left p-3 text-xs uppercase tracking-wider text-[#8A7E6E]">Reason</th><th className="text-left p-3 text-xs uppercase tracking-wider text-[#8A7E6E]">Status</th><th className="p-3"></th></tr></thead>
                      <tbody className="divide-y divide-[#EDE6CE]/40">
                        {pending.map(r=>(
                          <tr key={r.id} className="hover:bg-[#C5A05A]/5">
                            <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full bg-[#C5A05A]/10 border border-[#C5A05A]/20 text-[#8A6F3B]">{r._type}</span></td>
                            <td className="p-3 text-xs font-mono">{String(r.transaction_id||r.old_transaction_id||"").slice(0,8)}</td>
                            <td className="p-3 text-xs max-w-[220px] truncate">{r.reason}</td>
                            <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full border ${r.status==="PENDING"?"bg-amber-50 text-amber-700 border-amber-200": r.status==="APPROVED"?"bg-emerald-50 text-emerald-700 border-emerald-200":"bg-gray-50 text-gray-600 border-gray-200"}`}>{r.status}</span></td>
                            <td className="p-3">{r.status==="PENDING" && (user?.role==="management"||user?.role==="super_admin"||user?.role==="accounts") && <button onClick={()=>approve(r)} className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100">Approve</button>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="text-xs text-[#8A7E6E] mt-3">Rebooking uses previous_cancelled_transaction_id, distinct from source_transaction_id (§1.9c) — queries never conflate them.</p>
              </div>
            )}
          </div>
        </AppLayout>
      </div>
    </div>
  );
}
