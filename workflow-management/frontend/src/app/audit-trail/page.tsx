"use client";
import { motion } from "framer-motion";
import AppLayout from "@/components/app-layout";
import { Clock, ShieldCheck, FileCheck } from "lucide-react";

export default function AuditTrailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F4E8] via-[#EDE6CE] to-[#F0E8D4] text-[#141623] relative">
      <div className="mesh-gradient" />
      <div className="max-w-6xl mx-auto px-6 py-10 relative z-10">
        <AppLayout>
          <div className="max-w-5xl space-y-10">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C5A05A]/20 to-[#8A6F3B]/10 flex items-center justify-center border border-[#C5A05A]/20"><ShieldCheck size={18} className="text-[#8A6F3B]" /></span>
              <h1 className="font-editorial text-4xl">Audit Trail</h1>
            </div>
            <div className="glass-card p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6"><FileCheck size={18} className="text-blue-700" /><h2 className="font-editorial text-xl">Immutable Log (§1.10)</h2></div>
              <p className="text-sm text-[#5B5340] mb-4">Append-only. No UPDATE or DELETE grants at DB-role level. Every SUBMIT / APPROVE / SEND_BACK writes here server-side with user_id, actual_role, nominal_role, ip_address, device_info from session — never from request body.</p>
              <div className="overflow-x-auto rounded-xl border border-[#EDE6CE]/60">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-[#141623]/5 to-transparent"><tr><th className="text-left p-3 text-[11px] uppercase tracking-wider">Entity</th><th>Action</th><th>User</th><th>Actual Role</th><th>Nominal</th><th>Time</th></tr></thead>
                  <tbody>
                    {[
                      { e: "transaction", a: "CREATE", u: "K. Patel", ar: "CRM", nr: "CRM", t: "24 Jul 10:00" },
                      { e: "workflow_instance", a: "SUBMIT", u: "K. Patel", ar: "CRM", nr: "CRM", t: "24 Jul 10:30" },
                      { e: "workflow_action", a: "APPROVE", u: "A. Sharma", ar: "MANAGEMENT", nr: "MANAGEMENT", t: "26 Jul 11:00" },
                      { e: "workflow_action", a: "SEND_BACK", u: "V. Mehta", ar: "LEGAL_EXEC", nr: "LEGAL_EXEC", t: "26 Jul 11:45" },
                      { e: "financial_exception", a: "CREATE", u: "CFO", ar: "CFO", nr: "CFO", t: "26 Jul 12:00" },
                    ].map((r, i) => (
                      <tr key={i} className="border-t border-[#EDE6CE]/40 hover:bg-[#C5A05A]/5">
                        <td className="p-3 font-medium">{r.e}</td><td className="p-3"><span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800">{r.a}</span></td>
                        <td className="p-3">{r.u}</td><td className="p-3">{r.ar}</td><td className="p-3 text-[#8A7E6E]">{r.nr}</td><td className="p-3 text-xs text-[#8A7E6E]">{r.t}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 p-4 bg-gradient-to-r from-[#141623]/5 to-transparent rounded-xl border border-[#C5A05A]/10 text-sm text-[#5B5340]">Super Admin-only access (§2, §10). No edit/delete possible at DB grants level.</div>
            </div>
          </div>
        </AppLayout>
      </div>
    </div>
  );
}
