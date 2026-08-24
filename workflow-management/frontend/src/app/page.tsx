"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import AppLayout from "@/components/app-layout";
import HeroIntro from "@/components/hero-intro";
import { ArrowRight, Shield, FileStack, Landmark, Layers, Workflow } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F4E8] via-[#EDE6CE] to-[#F0E8D4] text-[#141623] relative">
      <div className="mesh-gradient" />
      <div className="max-w-6xl mx-auto px-6 py-10 relative z-10">
        <AppLayout>
          <div className="space-y-16">
            <HeroIntro />

            <section className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Shield, title: "19-Stage Approval Flow", body: "Every deal moves through Allocation → CSO → Management ×3 → Customer Signature → Legal Print → Scan → CFO Ledger → Receipts → Handing → Sales Close → Handover. Role-gated at every stage." },
                { icon: Layers, title: "Unit Lifecycle", body: "A unit holds exactly one ACTIVE claim at any moment. Twelve derived states — from AVAILABLE through ATS_REGISTERED and SALE_DEED_REGISTERED to COMPLETED or FINANCIAL_EXCEPTION." },
                { icon: Landmark, title: "Physical + Financial Independence", body: "Physical document identity starts at print (ATS_PRINT / SALE_DEED_PRINT), before any scan exists. Financial exceptions live parallel to workflow and never block progress." },
              ].map((item) => (
                <div key={item.title} className="glass-card p-8 hover:-translate-y-2 transition duration-500 group">
                  <item.icon size={28} className="text-[#C5A05A] mb-4 group-hover:scale-110 transition" />
                  <h3 className="font-editorial text-xl text-[#141623] mb-3">{item.title}</h3>
                  <p className="text-sm text-[#5B5340] leading-relaxed">{item.body}</p>
                </div>
              ))}
            </section>

            <section className="glass-card p-10 md:p-14 relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-72 h-72 bg-gradient-to-br from-[#C5A05A]/10 to-transparent rounded-full blur-3xl" />
              <h2 className="font-editorial text-3xl md:text-4xl text-[#141623] mb-4">Why this architecture is frozen</h2>
              <p className="text-[#5B5340] mb-6">Every correction from the v1.3.2 release — physical document identity from creation, the finalized unit status derivation, configuration-driven cancellation approval, financial exception independence, and the cancellation/rebooking snapshot rule — is preserved exactly. Nothing is redesigned. The specification is authoritative.</p>
              <div className="flex gap-3">
                <Link href="/workflow-page" className="btn-luxury inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em]"><FileStack size={14}/> Read Spec</Link>
                <Link href="/dashboard" className="border border-[#C5A05A]/30 text-[#8A6F3B] px-5 py-2.5 rounded-xl text-xs font-medium hover:bg-[#C5A05A]/10 transition inline-flex items-center gap-2"><ArrowRight size={14}/> Open App</Link>
              </div>
            </section>
          </div>
        </AppLayout>
      </div>
    </div>
  );
}
