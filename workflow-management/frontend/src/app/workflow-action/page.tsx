"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/app-layout";
import HeroIntro from "@/components/hero-intro";
import { CheckCircle, Send, FileText, Clock, User, ShieldCheck, Sparkles } from "lucide-react";

const STAGES = [
  { key: "ALLOCATION_PENDING", label: "Allocation Pending", role: "CRM" },
  { key: "CSO_APPROVE", label: "CSO Approve", role: "CSO" },
  { key: "MANAGEMENT_APPROVE_1", label: "Management Approve (1/3)", role: "MANAGEMENT" },
  { key: "MANAGEMENT_APPROVE_2", label: "Management Approve (2/3)", role: "MANAGEMENT" },
  { key: "MANAGEMENT_APPROVE_3", label: "Management Approve (3/3)", role: "MANAGEMENT" },
  { key: "CUSTOMER_SIGNATURE", label: "Customer Signature", role: "CRM" },
  { key: "LEGAL_EXEC_PRINT", label: "Legal Executive Print / Garvi", role: "LEGAL_EXECUTIVE", doc: "SALE_DEED_PRINT" },
  { key: "ADMIN_SCAN", label: "Admin Scan / Accounts Copy", role: "ADMIN_EXECUTIVE", doc: "SALE_DEED_SCAN" },
  { key: "CRM_EXEC_SCAN_CHECK", label: "CRM Executive Scan Check", role: "CRM_EXECUTIVE" },
  { key: "CFO_LEDGER_CHECK", label: "CFO Ledger Check", role: "CFO" },
  { key: "CFO_RECEIPT_CHECK", label: "CFO Receipt Check", role: "CFO" },
  { key: "CUSTOMER_RECEIVING_COPY", label: "Customer Receiving Copy", role: "CRM" },
  { key: "SALES_CLOSE", label: "Sales Close Confirm", role: "ADMIN_EXECUTIVE" },
  { key: "HANDOVER", label: "Customer Handover", role: "CRM_EXECUTIVE" },
];

function WorkflowActionInner() {
  const { user } = useAuth();
  const params = useSearchParams();
  const bookingId = params.get("id") || params.get("booking") || "";
  const [booking, setBooking] = useState<any>(null);
  const [currentStageIndex, setCurrentStageIndex] = useState(6);
  const [remark, setRemark] = useState("");
  const [sendBackRemark, setSendBackRemark] = useState("");
  const [showSendBack, setShowSendBack] = useState(false);
  const [actionLog, setActionLog] = useState([
    { stage: "MANAGEMENT_APPROVE_3", user: "A. Sharma (MANAGEMENT)", action: "APPROVE", time: "26 Jul 10:30 AM" },
    { stage: "CUSTOMER_SIGNATURE", user: "R. Mehta (CRM)", action: "SUBMIT", time: "26 Jul 11:00 AM" },
  ]);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(()=>{
    if (bookingId) api.getBooking(bookingId).then(b=>{ setBooking(b); const idx = STAGES.findIndex(s=> s.key.toLowerCase()=== (b.status||"").toLowerCase() || s.label.toLowerCase().includes((b.status||"").replace(/_/g," ")) ); if(idx>=0) setCurrentStageIndex(idx); api.getBookingHistory(bookingId).then(h=> setActionLog(h.map((x:any)=>({ stage: x.stage, user:`${x.user_name} (${x.actual_role||x.stage})`, action: x.action, time: x.created_at?.toMillis? new Date(x.created_at.toMillis()).toLocaleString(): "" })))).catch(()=>{}) }).catch(()=>{})
    else api.getBookings().then(setBookings).catch(()=>{})
  },[bookingId]);

  const current = STAGES[currentStageIndex];

  const handleApprove = async () => {
    if (!remark.trim()) { alert("Remark required per §68 for formal actions."); return; }
    if (bookingId && user) {
      try { await api.approveBooking(bookingId, "approve", remark, user.id, user.name, user.role); const b=await api.getBooking(bookingId); setBooking(b); setActionLog(prev=>[...prev, { stage: current.label, user:`You (${user.role})`, action:"APPROVE", time: new Date().toLocaleString()}]) } catch(e:any){ alert(e.message); return}
    } else setActionLog((prev) => [...prev, { stage: current.label, user: "You (LEGAL_EXECUTIVE)", action: "APPROVE", time: new Date().toLocaleString() }]);
    if (currentStageIndex < STAGES.length - 1) setCurrentStageIndex((i) => i + 1);
    setRemark("");
  };

  const handleSendBack = async () => {
    if (!sendBackRemark.trim()) { alert("Send-back remark is mandatory (§68)."); return; }
    if (bookingId && user) {
      try { await api.approveBooking(bookingId, "SEND_BACK", sendBackRemark, user.id, user.name, user.role); } catch(e:any){ alert(e.message); return}
    }
    setActionLog((prev) => [...prev, { stage: current.label, user: user? `You (${user.role})`:"You (LEGAL_EXECUTIVE)", action: "SEND_BACK", time: new Date().toLocaleString(), remark: sendBackRemark }]);
    setSendBackRemark("");
    setShowSendBack(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F4E8] via-[#F0E8D4] to-[#EDE6CE] text-[#141623] relative">
      <div className="mesh-gradient" />
      <div className="max-w-6xl mx-auto px-6 py-10 relative z-10">
        <AppLayout>
          <div className="max-w-5xl space-y-10">
            <HeroIntro />
            {!bookingId && bookings.length>0 && (
              <div className="glass-card p-5">
                <p className="text-xs font-bold text-[#8A7E6E] uppercase tracking-widest mb-2">Select a real booking to drive this workflow — or use demo below</p>
                <div className="flex gap-2 flex-wrap">{bookings.slice(0,6).map(b=> <a key={b.id} href={`/workflow-action?id=${b.id}`} className="text-xs px-3 py-1.5 rounded-full border border-[#C5A05A]/20 bg-white/60 hover:bg-[#C5A05A]/10 text-[#8A6F3B]">{b.unit_no} · {b.client_name} · {b.status}</a>)}</div>
              </div>
            )}
            {booking && (
              <div className="glass-card p-5 border-[#C5A05A]/30">
                <p className="text-xs font-bold text-[#8A7E6E] uppercase tracking-widest">Linked booking</p>
                <p className="font-semibold text-[#141623]">{booking.unit_no} · {booking.client_name} · {booking.project_name||"-"} · <span className="text-[#8A6F3B]">{booking.status}</span> {booking.is_direct_sale_deed && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">Direct</span>}</p>
              </div>
            )}

            {/* Identity Glass Card */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="glass-card p-8 md:p-10 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C5A05A]/40 to-transparent" />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C5A05A]/20 to-[#8A6F3B]/10 flex items-center justify-center border border-[#C5A05A]/20">
                  <ShieldCheck size={20} className="text-[#8A6F3B]" />
                </div>
                <div>
                  <h2 className="font-editorial text-2xl text-[#141623]">Transaction Identity</h2>
                  <p className="text-xs text-[#8A7E6E] uppercase tracking-widest">§1.3 / §1.4 — Immutable record</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5 text-sm">
                {[
                  { k: "Project", v: "Trident Experia", sub: "RERA registered" },
                  { k: "Unit", v: "B-901", sub: "Unit key: B901" },
                  { k: "Transaction ID", v: "txn-7a3f-9e2c", sub: "UUID v4" },
                  { k: "Customer", v: "Ojesh Agrawal", sub: "Current customer" },
                  { k: "Sale Deed Value", v: "₹1,85,00,000", sub: "Locked after Allocation" },
                  { k: "Workflow Version", v: "Sale Deed V1 (ACTIVE)", sub: "DRAFT → ACTIVE → RETIRED" },
                ].map((row) => (
                  <div key={row.k} className="border-l-2 border-[#C5A05A]/30 pl-4">
                    <div className="text-[10px] uppercase tracking-widest text-[#8A7E6E] mb-0.5">{row.k}</div>
                    <div className="font-semibold text-[#141623]">{row.v}</div>
                    <div className="text-[11px] text-[#8A7E6E]">{row.sub}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-[#EDE6CE]/60">
                {["WORKFLOW ACTIVE — V1.3.2", "NO OPEN FINANCIAL EXCEPTION", "PHYSICAL DOC: SALE_DEED_PRINT", "DOCUMENT ID: doc-sale-88f2", "REGISTRATION DETAILS: Pending scan"].map((tag) => (
                  <span key={tag} className="text-[11px] font-medium px-3 py-1 rounded-full bg-gradient-to-r from-[#C5A05A]/10 to-[#C5A05A]/5 border border-[#C5A05A]/20 text-[#8A6F3B]">{tag}</span>
                ))}
              </div>
            </motion.section>

            {/* Stage Timeline */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="glass-card p-8 md:p-10"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C5A05A]/10 to-transparent flex items-center justify-center border border-[#C5A05A]/15"><FileText size={20} className="text-[#8A6F3B]" /></div>
                <div>
                  <h2 className="font-editorial text-2xl text-[#141623]">Stage Timeline</h2>
                  <p className="text-xs text-[#8A7E6E] uppercase tracking-widest">§1.6 — Configured per workflow definition</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {STAGES.map((s, i) => {
                  const done = i < currentStageIndex;
                  const active = i === currentStageIndex;
                  return (
                    <motion.button
                      key={s.key}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCurrentStageIndex(i)}
                      className={`text-left text-xs rounded-xl px-3 py-3.5 border transition-all duration-300 ${
                        active ? "stage-pill active shadow-lg shadow-[#C5A05A]/10" :
                        done ? "stage-pill completed" : "stage-pill opacity-60 hover:opacity-100 hover:border-[#C5A05A]/30"
                      }`}
                    >
                      <div className={`font-semibold mb-1 ${done ? "text-emerald-700" : active ? "text-[#141623]" : "text-[#8A7E6E]"}`}>
                        {done && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 align-middle" />}
                        {s.label}
                      </div>
                      <div className="text-[10px] opacity-70">{s.role}</div>
                      {active && <div className="mt-2 text-[10px] font-medium text-[#C5A05A]">CURRENT ACTION</div>}
                    </motion.button>
                  );
                })}
              </div>
            </motion.section>

            {/* Action Panel */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="animated-border bg-gradient-to-br from-[#FBF8F0]/90 to-[#F4F0E4]/90 backdrop-blur-xl rounded-2xl p-8 md:p-10 shadow-xl shadow-[#C5A05A]/5"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8A6F3B]/10 to-[#C5A05A]/10 flex items-center justify-center border border-[#C5A05A]/20"><User size={20} className="text-[#8A6F3B]" /></div>
                <div>
                  <h2 className="font-editorial text-2xl text-[#141623]">Current Action</h2>
                  <p className="text-xs text-[#8A7E6E] uppercase tracking-widest">§1.6b — Server-side validation</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-[#141623]/5 to-transparent border border-[#C5A05A]/15 rounded-xl p-5 mb-6 relative overflow-hidden">
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-[#C5A05A]/10 to-transparent rounded-full blur-2xl" />
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#8A7E6E] mb-1">Stage Key</div>
                <div className="font-mono font-bold text-3xl text-[#141623] tracking-tight">{current.key}</div>
                <div className="text-lg text-[#8A7E6E] font-editorial italic mt-1">{current.label}</div>
                <div className="flex gap-2 mt-3">
                  <span className="bg-[#141623]/5 text-[#141623] text-xs font-medium px-2.5 py-1 rounded-full border border-[#141623]/10">Required: {current.role}</span>
                  {current.doc && <span className="bg-[#C5A05A]/10 text-[#8A6F3B] text-xs font-medium px-2.5 py-1 rounded-full border border-[#C5A05A]/20">Doc: {current.doc}</span>}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#8A7E6E] mb-2">Formal Remark (§68 — mandatory for SUBMIT / APPROVE / SEND_BACK)</label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  rows={3}
                  className="w-full bg-white/60 border border-[#C5A05A]/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A05A]/30 focus:border-[#C5A05A]/40 transition shadow-inner"
                  placeholder="Enter formal remark..."
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleApprove}
                  className="btn-luxury flex items-center gap-2 text-sm"
                ><CheckCircle size={16} /> Approve Stage</motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowSendBack(!showSendBack)}
                  className="bg-gradient-to-r from-amber-700 to-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-amber-900/20 hover:shadow-amber-900/30 transition flex items-center gap-2"
                ><Send size={16} /> Send Back</motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setCurrentStageIndex((i) => i + 1)}
                  className="border border-[#C5A05A]/30 text-[#8A6F3B] px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-white/60 transition"
                >Complete / Skip (Super Admin)</motion.button>
              </div>

              <AnimatePresence>
                {showSendBack && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-6 bg-gradient-to-r from-red-50/80 to-red-50/40 border border-red-200/60 rounded-xl p-5">
                      <label className="block text-xs font-bold text-red-800 uppercase tracking-widest mb-2">Send-Back Remark — Mandatory (§68)</label>
                      <textarea
                        value={sendBackRemark}
                        onChange={(e) => setSendBackRemark(e.target.value)}
                        rows={2}
                        className="w-full bg-white/70 border border-red-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-200"
                        placeholder="Why sent back? Target stage..."
                      />
                      <button onClick={handleSendBack} className="bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-800 transition shadow-md shadow-red-900/20">Confirm Send Back</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>

            {/* Action Log */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="glass-card p-8 md:p-10"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-900/10 to-blue-800/5 flex items-center justify-center border border-blue-900/10"><Clock size={20} className="text-blue-800" /></div>
                <div>
                  <h2 className="font-editorial text-2xl text-[#141623]">Immutable Action Log</h2>
                  <p className="text-xs text-[#8A7E6E] uppercase tracking-widest">§1.6 — Every SUBMIT / APPROVE / SEND_BACK recorded server-side</p>
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl border border-[#EDE6CE]/60">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-[#141623]/5 to-transparent">
                    <tr>
                      <th className="text-left p-3 font-semibold text-[#8A7E6E] text-xs uppercase tracking-wider">Stage</th>
                      <th className="text-left p-3 font-semibold text-[#8A7E6E] text-xs uppercase tracking-wider">User / Role</th>
                      <th className="text-left p-3 font-semibold text-[#8A7E6E] text-xs uppercase tracking-wider">Action</th>
                      <th className="text-left p-3 font-semibold text-[#8A7E6E] text-xs uppercase tracking-wider">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actionLog.map((a, i) => (
                      <tr key={i} className="border-t border-[#EDE6CE]/50 hover:bg-[#C5A05A]/5 transition">
                        <td className="p-3 font-medium text-[#141623]">{a.stage}</td>
                        <td className="p-3 text-[#8A7E6E]">{a.user}</td>
                        <td className="p-3"><span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${a.action === "APPROVE" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{a.action}</span></td>
                        <td className="p-3 text-[#8A7E6E] text-xs">{a.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.section>

            {/* Physical Custody */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.75 }}
              className="glass-card p-8 md:p-10 relative overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-[#C5A05A]/10 to-transparent rounded-full blur-3xl" />
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-700/10 to-amber-600/5 flex items-center justify-center border border-amber-700/15"><FileText size={20} className="text-amber-800" /></div>
                <div>
                  <h2 className="font-editorial text-2xl text-[#141623]">Physical Custody</h2>
                  <p className="text-xs text-[#8A7E6E] uppercase tracking-widest">§1.7 — Independent of workflow stage; never inferred</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6 relative z-10">
                <div className="bg-gradient-to-br from-white/70 to-white/40 backdrop-blur rounded-2xl p-6 border border-[#C5A05A]/15 shadow-xs">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#8A7E6E] mb-1">Current Holder</div>
                  <div className="font-editorial text-xl text-[#141623]">Legal Executive</div>
                  <div className="text-sm text-[#8A7E6E] mt-1">Print stage — physical document with identity from creation (§1.4)</div>
                  <div className="mt-3 inline-block bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-200">Document ID: doc-sale-88f2 (SALE_DEED_PRINT)</div>
                </div>
                <div className="bg-gradient-to-br from-white/70 to-white/40 backdrop-blur rounded-2xl p-6 border border-[#C5A05A]/15 shadow-xs">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#8A7E6E] mb-1">Next Transfer To</div>
                  <div className="font-editorial text-xl text-[#141623]">Admin Executive</div>
                  <div className="text-sm text-[#8A7E6E] mt-1">Scan / Accounts Copy stage — requires manual "Transfer Physical Document" action</div>
                  <div className="mt-3 inline-block bg-amber-50 text-amber-800 text-[11px] font-bold px-2.5 py-1 rounded-full border border-amber-200">Requires user-initiated custody log (§1.7)</div>
                </div>
              </div>
            </motion.section>

            {/* Legend */}
            <section className="glass-card p-8 md:p-10">
              <h3 className="font-editorial text-xl text-[#141623] mb-4">Design Notes</h3>
              <ol className="list-decimal pl-5 space-y-2 text-sm text-[#5B5340] leading-relaxed">
                <li><strong>Luxury real-estate aesthetic:</strong> editorial serif typography, gold/amber gradients, parchment backgrounds, glassmorphism.</li>
                <li><strong>Animations:</strong> Framer Motion staggered reveals, hover lifts, shimmer text, animated gradient borders.</li>
                <li><strong>Role gate:</strong> only users with required_role or permitted_acting_roles / active delegation may act (§1.6b).</li>
                <li><strong>Send-back (§68):</strong> formal remark mandatory; targets valid send_back_target_stage.</li>
                <li><strong>Physical custody (§1.7):</strong> user-initiated, never inferred from workflow stage.</li>
                <li><strong>Financial exceptions (§1.5):</strong> do not block approval — CFO approves with pending receipts.</li>
                <li><strong>Document identity (§1.4):</strong> SALE_DEED_PRINT row exists at print; scan creates separate digital row linked via physical_document_id.</li>
              </ol>
            </section>
          </div>
        </AppLayout>
      </div>
    </div>
  );
}

export default function WorkflowActionPage(){
  return <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-[#F8F4E8] via-[#EDE6CE] to-[#F0E8D4] flex items-center justify-center text-[#8A7E6E] text-sm">Loading workflow…</div>}><WorkflowActionInner/></Suspense>
}
