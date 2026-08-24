"use client";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

export default function HeroIntro() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#181520] via-[#23263a] to-[#141623] text-[#F8F4E8] p-10 md:p-14 shadow-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(197,160,90,0.12),transparent_60%)]" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#C5A05A]/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 max-w-2xl"
      >
        <div className="flex items-center gap-2 mb-6">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#C5A05A]/60" />
          <span className="text-[11px] uppercase tracking-[0.25em] text-[#C5A05A]/80 font-serif">Real Estate Workflow — v1.3.2 Frozen</span>
        </div>

        <h1 className="font-editorial text-5xl md:text-7xl font-light leading-[1.05] mb-6">
          <span className="italic font-display text-[#C5A05A]">Sale Deed</span>
          <br />
          <span className="text-[#F8F4E8]">Action Screen</span>
        </h1>

        <p className="text-[#D6CDBB] text-lg leading-relaxed max-w-lg mb-8">
          19-stage approval flow with role gates, send-back remarks, physical custody tracking, and immutable audit. Every action server-validated per §1.6.
        </p>

        <div className="flex items-center gap-8 text-sm text-[#D6CDBB]/90">
          {[
            { label: "Stages", value: "19" },
            { label: "Roles", value: "9" },
            { label: "Document Types", value: "13" },
            { label: "Version", value: "V1.3.2" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="font-editorial text-2xl text-[#C5A05A]">{stat.value}</div>
              <div className="text-xs uppercase tracking-wider text-[#D6CDBB]/60">{stat.label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
