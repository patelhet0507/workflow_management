"use client";
import AppLayout from "@/components/app-layout";
import { FileEdit, ArrowRight } from "lucide-react";

export default function ChangesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F4E8] via-[#EDE6CE] to-[#F0E8D4] text-[#141623] relative">
      <div className="mesh-gradient" />
      <div className="max-w-6xl mx-auto px-6 py-10 relative z-10">
        <AppLayout>
          <div className="max-w-5xl space-y-8">
            <div className="flex items-center gap-3"><span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C5A05A]/20 to-[#8A6F3B]/10 flex items-center justify-center border border-[#C5A05A]/20"><FileEdit size={18} className="text-[#8A6F3B]" /></span><h1 className="font-editorial text-4xl">Change Requests</h1></div>
            <div className="glass-card p-8 md:p-10">
              <h2 className="font-editorial text-xl mb-4">Cancellation / Unit Change / Customer Change (§1.9)</h2>
              <div className="grid md:grid-cols-3 gap-6 text-sm">
                {[
                  { title: "Cancellation", body: "Configuration-driven approval. Default: Management-only; if financial_implications=true → CFO → Management (via workflow_stage_defs.applicable_if_financial_implications). Old txn lifecycle → CANCELLED. Unit available for new transaction. Previous transaction preserved permanently." },
                  { title: "Unit Change", body: "New transaction created with source_transaction_id + source_change_type='UNIT_CHANGE'. Old txn lifecycle → SUPERSEDED. Unit status → UNIT_CHANGED. Financials copied as editable baseline. Old unit's data never overwritten." },
                  { title: "Customer Change", body: "No new transaction created. Same transaction; customer_name updated. History in customer_change_requests (existing/proposed/approved names, reason, approved_by). Source_change_type never set to CUSTOMER_CHANGE — that's deliberately not valid." },
                ].map((c) => (
                  <div key={c.title} className="bg-gradient-to-b from-white/60 to-transparent rounded-2xl p-5 border border-[#C5A05A]/10 shadow-inner">
                    <h3 className="font-editorial text-lg mb-2">{c.title}</h3>
                    <p className="text-[#5B5340] leading-relaxed">{c.body}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-amber-50/30 rounded-xl border border-amber-200 text-sm text-[#5B5340]">Rebooking (Cancellation + new allocation) uses previous_cancelled_transaction_id (new v1.3.2 field), separate from source_transaction_id. No financial fields copied. See §1.9c comparison table.</div>
            </div>
          </div>
        </AppLayout>
      </div>
    </div>
  );
}
