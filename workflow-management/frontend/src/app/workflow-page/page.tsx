"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/app-layout";
import { BookOpen, ShieldCheck, ChevronRight, Sparkles } from "lucide-react";

const SECTIONS = [
  { label: "Identity & RBAC", id: "rbac" },
  { label: "Unit Lifecycle", id: "lifecycle" },
  { label: "Financials", id: "financials" },
  { label: "Documents & Custody", id: "docs" },
  { label: "Workflow Engine", id: "engine" },
  { label: "Cancellation / Rebooking", id: "cancel" },
];

export default function WorkflowPage() {
  const [hoverSection, setHoverSection] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F4E8] via-[#F0E8D4] to-[#EDE6CE] text-[#141623] relative">
      <div className="mesh-gradient" />
      <div className="max-w-6xl mx-auto px-6 py-10 relative z-10">
        <AppLayout>
          <div className="max-w-5xl space-y-12">
            {/* Hero */}
            <motion.header
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#181520] via-[#23263a] to-[#141623] text-[#F8F4E8] p-10 md:p-14 shadow-2xl"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(197,160,90,0.15),transparent_60%)]" />
              <div className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-gradient-to-br from-[#C5A05A]/15 to-transparent rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-5">
                  <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#C5A05A]/60" />
                  <span className="text-[11px] uppercase tracking-[0.25em] text-[#C5A05A]/90 font-editorial">Real Estate CRM — Frozen Architecture</span>
                </div>
                <h1 className="font-editorial text-5xl md:text-7xl font-light leading-[1.05] mb-6">
                  <span className="italic font-display text-[#C5A05A]">Workflow</span>
                  <br />Specification v1.3.2
                </h1>
                <p className="text-[#D6CDBB] text-lg leading-relaxed max-w-2xl mb-8">
                  The complete Phase 1 specification — database schema, permission matrix, 19-stage approval flow, unit lifecycle, document identity, financial exception independence, cancellation/rebooking, and all wireframes.
                </p>
                <div className="flex gap-3">
                  <a href="#spec" className="btn-luxury text-xs uppercase tracking-[0.15em] flex items-center gap-2">Read Specification <ChevronRight size={14}/></a>
                  <a href="/workflow-action" className="bg-transparent border border-[#C5A05A]/30 text-[#C5A05A] px-5 py-2.5 rounded-xl text-xs font-medium hover:bg-[#C5A05A]/10 transition flex items-center gap-2"><Sparkles size={14}/> Action Screen</a>
                </div>
              </div>
            </motion.header>

            {/* Section Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              {SECTIONS.map((sec) => (
                <a href={`#spec`} key={sec.id} className="group block">
                  <div
                    className="glass-card p-6 h-full relative overflow-hidden cursor-pointer"
                    onMouseEnter={() => setHoverSection(sec.id)}
                    onMouseLeave={() => setHoverSection(null)}
                  >
                    <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#C5A05A]/0 via-[#C5A05A]/40 to-[#C5A05A]/0 transition-all duration-500 ${hoverSection === sec.id ? "opacity-100" : "opacity-0"}`} />
                    <BookOpen size={20} className="text-[#8A6F3B] mb-3" />
                    <h3 className="font-editorial text-lg text-[#141623] mb-1">{sec.label}</h3>
                    <p className="text-xs text-[#8A7E6E]">§1.{sec.id === "rbac" ? "1" : sec.id === "lifecycle" ? "3" : sec.id === "financials" ? "5" : sec.id === "docs" ? "4" : sec.id === "engine" ? "6" : sec.id === "cancel" ? "9" : "1"}</p>
                  </div>
                </a>
              ))}
            </div>

            {/* Spec Content */}
            <section id="spec" className="glass-card p-10 md:p-14 relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-[300px] h-[300px] bg-gradient-to-br from-[#C5A05A]/10 to-transparent rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C5A05A]/20 to-transparent flex items-center justify-center border border-[#C5A05A]/20"><ShieldCheck size={20} className="text-[#8A6F3B]" /></div>
                  <div>
                    <h2 className="font-editorial text-3xl text-[#141623]">Phase 1 Specification</h2>
                    <p className="text-xs text-[#8A7E6E] uppercase tracking-widest">Key architecture — frozen for implementation</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8 text-sm leading-relaxed">
                  {[
                    { title: "Workflow Engine (§1.6)", body: "19-stage approval flows (Allocation / ATS / Sale Deed) — versioned definitions (DRAFT → ACTIVE → RETIRED), role-gated stages with delegation, send-back requires remark, no Reject." },
                    { title: "Unit Lifecycle (§1.3)", body: "12 states: AVAILABLE → ATS_REGISTERED → SALE_DEED_REGISTERED → COMPLETED / FINANCIAL_EXCEPTION → UNIT_CHANGED → SUPERSEDED. Single authoritative recomputation function (recompute_unit_status). Only one ACTIVE transaction per unit." },
                    { title: "Physical Documents (§1.4 / §1.7)", body: "ATS_PRINT / SALE_DEED_PRINT identity from creation (before scan). Physical custody independent of workflow stage — user-initiated transfer, never inferred. Scan creates digital row linked via physical_document_id." },
                  ].map((item) => (
                    <div key={item.title} className="bg-gradient-to-b from-white/60 to-transparent rounded-2xl p-6 border border-[#C5A05A]/10 shadow-inner">
                      <h3 className="font-editorial text-lg text-[#141623] mb-3">{item.title}</h3>
                      <p className="text-[#5B5340]">{item.body}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-6 bg-gradient-to-r from-[#141623]/5 to-transparent rounded-2xl border border-[#141623]/10">
                  <h3 className="font-editorial text-xl text-[#141623] mb-3">Key Rules — What Must Not Change (§1.9, §1.3)</h3>
                  <div className="grid md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-[#5B5340]">
                    {[
                      "One ACTIVE transaction per unit (§1.3 partial unique index)",
                      "Unlimited history — CANCELLED / SUPERSEDED preserved (§1.3)",
                      "Cancellation approval = config-driven via workflow_definitions (§1.9)",
                      "Unit Change creates new transaction; Customer Change does NOT (§1.9)",
                      "Rebooking uses previous_cancelled_transaction_id (new field, separate from source_change_type) (§1.9d)",
                      "Financial snapshot independence — never copy old values (§1.9d)",
                      "Financial exceptions never block workflow (§1.5)",
                      "TDS is a non-blocking exception (§1.5)",
                      "Physical custody independent of workflow (§1.7)",
                      "Server-side identity — user_id, actual_role, nominal_role never trusted from client (§1.6, §10)",
                      "Immutable audit log with INSERT+SELECT-only DB grants (§1.10)",
                    ].map((rule) => (
                      <div key={rule} className="flex gap-2.5 items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C5A05A] mt-1.5 shrink-0" />
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </AppLayout>
      </div>
    </div>
  );
}
