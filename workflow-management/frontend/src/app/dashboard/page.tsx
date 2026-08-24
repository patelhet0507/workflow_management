"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { api, deriveUnitStatus } from "@/lib/api";
import AppLayout from "@/components/app-layout";
import Link from "next/link";
import {
  Shield, ChevronRight, BarChart3, AlertTriangle,
  CheckCircle2, Clock, LockOpen, ScrollText, ArrowUp, Users, FileCheck
} from "lucide-react";

const SUMMARY = [
  { label: "Total Units", value: 42 },
  { label: "Allocation Pending", value: 3, color: "amber" },
  { label: "ATS Active", value: 9 },
  { label: "Sale Deed Active", value: 14 },
  { label: "Direct Sale Deed", value: 4, color: "blue" },
  { label: "Completed", value: 6, color: "green" },
  { label: "Cancelled", value: 1, color: "red" },
];

const PENDING_BY_ROLE = [
  { role: "CRM", count: 4 },
  { role: "CSO", count: 1 },
  { role: "MANAGEMENT", count: 3 },
  { role: "LEGAL_EXEC", count: 2 },
  { role: "LEGAL_MGR", count: 2 },
  { role: "CFO", count: 3 },
  { role: "ADMIN", count: 1 },
  { role: "CRM_EXEC", count: 5 },
];

const EXCEPTIONS = [
  { label: "Financial Exceptions", value: 6 },
  { label: "Reopened", value: 1, color: "amber" },
  { label: "Cancellations", value: 1, color: "red" },
  { label: "Unit Changes", value: 0 },
  { label: "Customer Changes", value: 1, color: "blue" },
  { label: "Mgmt Overrides", value: 2 },
  { label: "Legal Mgr Acting", value: 5, color: "purple" },
];

const UNITS = [
  { project: "Trident Experia", unit: "B-901", customer: "Ojesh Agrawal", crm: "Kevin Patel", workflow: "Sale Deed", stage: "CFO Receipt Check", holder: "CFO", days: 2, pending: 2, overall: "attention" },
  { project: "Trident Experia", unit: "B-902", customer: "R. Shah", crm: "Rohan Mehta", workflow: "Direct Sale Deed", stage: "Legal Manager Check", holder: "Legal Mgr", days: 1, pending: 0, overall: "in-progress" },
  { project: "Trident Experia", unit: "B-903", customer: "P. Iyer", crm: "Kevin Patel", workflow: "ATS", stage: "Registration", holder: "Legal Exec", days: 4, pending: 0, overall: "in-progress" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [sortCol, setSortCol] = useState("days");
  const [live, setLive] = useState<any[] | null>(null);
  const [pendingLive, setPendingLive] = useState<Record<string,number> | null>(null);
  const [summaryLive, setSummaryLive] = useState<any | null>(null);
  useEffect(()=>{ if(user) Promise.all([api.getBookings(user.id, user.role), api.getApprovalFlow().catch(()=>[]) as any]).then(([b, flow])=>{
    if(b.length===0) return;
    const byUnit: Record<string,any[]> = {}
    b.forEach(x=>{ const k=(x as any).unit_key||x.unit_no; (byUnit[k]=byUnit[k]||[]).push(x)})
    const rows = b.map(x=>({ project: x.project_name||"-", unit: x.unit_no, customer: x.client_name, crm: x.sales_exec_name||"-", workflow: x.is_direct_sale_deed?"Direct Sale Deed": x.status, stage: x.status, holder: (x as any).current_holder||"-", days: x.created_at? Math.floor((Date.now()-x.created_at.toMillis())/86400000):0, pending: (x as any).financial_exceptions?.filter((e:any)=>e.status==="OPEN").length||0, overall: x.status_overall==="ATTENTION_REQUIRED"?"attention":"in-progress", id: x.id }))
    setLive(rows)
    // pending by role — map current status → required role (§78)
    const flowMap: Record<string,string> = {}; (flow as any[]).forEach((s:any)=> flowMap[s.status]=s.role)
    const counts: Record<string,number> = {}; b.forEach(x=>{ if(x.status==="completed"||x.status==="rejected"||(x as any).lifecycle_status==="CANCELLED") return; const r = flowMap[x.status] || "unknown"; counts[r]=(counts[r]||0)+1 })
    setPendingLive(counts)
    // unit summary live (§78)
    const active = b.filter(x=> (x as any).lifecycle_status!=="CANCELLED" && (x as any).lifecycle_status!=="SUPERSEDED")
    setSummaryLive({ total: Object.keys(byUnit).length, pending: active.filter(x=>x.status==="booking_completed").length, ats: active.filter(x=> (x as any).sale_deed_in_progress || x.status.includes("ats")).length, saleDeed: active.filter(x=> x.status.includes("legal")||x.status.includes("accounts")).length, direct: active.filter(x=> x.is_direct_sale_deed).length, completed: active.filter(x=>x.status==="completed").length, cancelled: b.filter(x=> (x as any).lifecycle_status==="CANCELLED").length })
  }).catch(()=>{})},[user])
  const source = live ?? UNITS
  const sorted = [...source].sort((a, b) => (sortCol === "days" ? (b.days - a.days) : a.overall.localeCompare(b.overall)));

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F4E8] via-[#EDE6CE] to-[#F0E8D4] text-[#141623] relative">
      <div className="mesh-gradient" />
      <div className="max-w-6xl mx-auto px-6 py-10 relative z-10">
        <AppLayout>
          <div className="max-w-5xl space-y-8">
            {/* Title */}
            <div className="flex items-center gap-3 mb-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C5A05A]/20 to-[#8A6F3B]/10 flex items-center justify-center border border-[#C5A05A]/20">
                <BarChart3 size={16} className="text-[#8A6F3B]" />
              </span>
              <h1 className="font-editorial text-4xl text-[#141623]">Dashboard</h1>
            </div>

            {/* Filter bar */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-3 text-xs text-[#8A7E6E] mb-3">
                <span className="font-medium">Filters</span>
                <span>·</span>
                <button className="bg-[#C5A05A]/10 px-2 py-0.5 rounded-full border border-[#C5A05A]/20">Project: All ▾</button>
                <button className="bg-[#C5A05A]/10 px-2 py-0.5 rounded-full border border-[#C5A05A]/20">Date range ▾</button>
                <button className="bg-[#C5A05A]/10 px-2 py-0.5 rounded-full border border-[#C5A05A]/20">Viewing as: MANAGEMENT ▾</button>
              </div>
            </div>

            {/* Unit Summary */}
            <div className="glass-card p-6">
              <h3 className="font-editorial text-lg text-[#141623] mb-3">Unit Summary</h3>
              <div className="flex flex-wrap gap-2">
                {SUMMARY.map((s) => (
                  <span key={s.label} className={`text-xs font-medium px-3 py-1.5 rounded-full border transition ${s.color === "green" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : s.color === "red" ? "bg-red-50 border-red-200 text-red-700" : s.color === "amber" ? "bg-amber-50 border-amber-200 text-amber-700" : s.color === "blue" ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-[#F8F4E8] border-[#C5A05A]/20 text-[#141623]"}`}>
                    {s.label}: <span className="font-bold">{s.value}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Pending by Role — live from flow mapping, fallback demo */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4"><h3 className="font-editorial text-lg text-[#141623]">Pending by Role (§78)</h3>{pendingLive && <span className="text-[11px] text-[#8A7E6E] bg-[#C5A05A]/10 px-2 py-0.5 rounded-full border border-[#C5A05A]/20">live</span>}</div>
              <div className="flex flex-wrap gap-2">
                {(pendingLive ? Object.entries(pendingLive) : PENDING_BY_ROLE.map(r=>[r.role,r.count] as const)).map(([role,count]:any) => (
                  <span key={String(role)} className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-[#C5A05A]/10 to-[#C5A05A]/5 border border-[#C5A05A]/20 text-[#8A6F3B]">
                    {String(role).toUpperCase()}: <span className="font-bold text-[#141623]">{count as number}</span>
                  </span>
                ))}
                {!pendingLive && <span className="text-[11px] text-[#8A7E6E] ml-2">(demo — no bookings yet)</span>}
              </div>
            </div>

            {/* Exception Summary */}
            <div className="glass-card p-6">
              <h3 className="font-editorial text-lg text-[#141623] mb-3">Exception Summary (§78)</h3>
              <div className="flex flex-wrap gap-2">
                {EXCEPTIONS.map((e) => (
                  <span key={e.label} className={`text-xs font-medium px-3 py-1 rounded-full border ${e.color === "red" ? "bg-red-50 text-red-700 border-red-200" : e.color === "amber" ? "bg-amber-50 text-amber-700 border-amber-200" : e.color === "blue" ? "bg-blue-50 text-blue-700 border-blue-200" : e.color === "purple" ? "bg-purple-50 text-purple-700 border-purple-200" : e.color === "green" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-[#F8F4E8] text-[#141623] border-[#C5A05A]/20"}`}>
                    {e.label}: <span className="font-bold">{e.value}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Unit-wise Table */}
            <div className="glass-card p-6 shadow-lg shadow-[#C5A05A]/5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs uppercase tracking-[0.2em] text-[#8A7E6E]">Unit-wise Table (§80)</span>
                <span className="text-[10px] text-[#8A7E6E]">Click row → opens Control Sheet (Sheet 02)</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#C5A05A]/20">
                    {["Project", "Unit", "Customer", "CRM", "Type", "Current Stage", "Respons.", "Physical", "Days", "Financial", "Overall"].map((h) => (
                      <th key={h} className="text-left p-2 text-[11px] font-semibold text-[#8A7E6E] uppercase tracking-wider cursor-pointer hover:text-[#C5A05A] transition" onClick={() => h === "Days" ? setSortCol("days") : undefined}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row:any, i) => (
                    <tr key={i} className="border-t border-[#EDE6CE]/40 hover:bg-[#C5A05A]/5 transition cursor-pointer" onClick={()=> row.id && (window.location.href=`/bookings/${row.id}`)}>
                      <td className="p-2 text-xs">{row.project}</td>
                      <td className="p-2 font-medium">{row.unit}</td>
                      <td className="p-2 text-xs">{row.customer}</td>
                      <td className="p-2 text-xs">{row.crm}</td>
                      <td className="p-2 text-xs">{row.workflow}</td>
                      <td className="p-2 text-xs">{row.stage}</td>
                      <td className="p-2 text-xs">{row.holder}</td>
                      <td className="p-2 text-xs">{row.holder}</td>
                      <td className="p-2 text-xs font-medium">{row.days}</td>
                      <td className="p-2"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${row.pending > 0 ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`}>{row.pending > 0 ? `${row.pending} P.` : "Clear"}</span></td>
                      <td className="p-2"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${row.overall === "attention" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>{row.overall === "attention" ? "Attention" : "In Progress"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-xs text-[#8A7E6E] mt-3 flex gap-4">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-300" /> Attention Required</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-300" /> In Progress</span>
                <span>Every row opens the Control Sheet on click (§81)</span>
              </div>
            </div>
          </div>
        </AppLayout>
      </div>
    </div>
  );
}
