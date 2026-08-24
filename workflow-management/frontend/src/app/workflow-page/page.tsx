import { readFileSync } from "fs";
import { join } from "path";
import { marked } from "marked";
import { BookOpen, FileText, Shield } from "lucide-react";

export default function WorkflowPage() {
  const readmePath = join(process.cwd(), "..", "..", "developer-delivery-package-v1.3.2", "README-v1.3.2.md");
  const md = readFileSync(readmePath, "utf-8");
  const html = marked.parse(md) as string;

  return (
    <div className="min-h-screen bg-[#F4EEE0] text-[#1F2A3D]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <header className="mb-10 border-b-2 border-[#CBBE9C] pb-6">
          <div className="flex items-center gap-3 text-[#A87C3F] mb-2">
            <BookOpen size={22} />
            <span className="font-mono text-xs uppercase tracking-widest">Delivery Package v1.3.2 — Frozen Spec</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: "Georgia, serif" }}>
            Real Estate Customer Document Workflow & Transaction Management System
          </h1>
          <p className="text-[#5B5340] text-sm leading-relaxed max-w-3xl">
            Merged site exposing the full v1.3.2 specification: 19-stage approval flows, 9-role RBAC, unit lifecycle tracking,
            physical document identity, financial exception independence, cancellation/rebooking, workflow versioning, and all wireframes.
          </p>
          <div className="flex gap-3 mt-4">
            <a href="#readme" className="inline-flex items-center gap-2 bg-[#1F2A3D] text-[#F4EEE0] text-xs font-semibold px-3 py-2 rounded hover:bg-[#2c3b56]">
              <FileText size={14} /> Read README
            </a>
            <a href="#spec" className="inline-flex items-center gap-2 border-2 border-[#A87C3F] text-[#A87C3F] text-xs font-semibold px-3 py-2 rounded hover:bg-[#FBF8F0]">
              <Shield size={14} /> Phase 1 Specification
            </a>
          </div>
        </header>

        <section id="readme" className="bg-white border border-[#E4DCC6] rounded-xl p-8 shadow-sm mb-12">
          <div className="prose prose-sm max-w-none text-[#1F2A3D]" dangerouslySetInnerHTML={{ __html: html }} />
        </section>

        <section id="spec" className="bg-[#1F2A3D] text-[#F4EEE0] rounded-xl p-8 mb-12">
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "Georgia, serif" }}>Phase 1 Specification — Key Architecture</h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm leading-relaxed">
            <div>
              <h3 className="font-semibold text-[#CBBE9C] mb-2">Workflow Engine</h3>
              <ul className="list-disc pl-4 space-y-1 text-[#DCCDBB]">
                <li>19-stage approval flows (Allocation / ATS / Sale Deed)</li>
                <li>Versioned definitions: DRAFT → ACTIVE → RETIRED</li>
                <li>Role-gated stages with delegation support</li>
                <li>Send-back requires remark; history preserved</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-[#CBBE9C] mb-2">Unit Lifecycle</h3>
              <ul className="list-disc pl-4 space-y-1 text-[#DCCDBB]">
                <li>12 states: AVAILABLE → ATS_REGISTERED → SALE_DEED_REGISTERED → COMPLETED → UNIT_CHANGED → SUPERSEDED</li>
                <li>Single authoritative recomputation function</li>
                <li>Only one ACTIVE transaction per unit at any time</li>
                <li>Completion requires zero open financial exceptions</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-[#CBBE9C] mb-2">Financial & Document</h3>
              <ul className="list-disc pl-4 space-y-1 text-[#DCCDBB]">
                <li>Financial exceptions independent of workflow stage</li>
                <li>CFO can approve with pending receipts (TDS included)</li>
                <li>Physical document identity from print moment (ATS_PRINT / SALE_DEED_PRINT)</li>
                <li>Scan creates new digital record linked back to print</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-6 mb-12">
          <a href="/dashboard" className="block bg-white border-2 border-[#E4DCC6] rounded-xl p-6 hover:border-[#A87C3F] transition">
            <h3 className="font-bold text-lg mb-2" style={{ fontFamily: "Georgia, serif" }}>Dashboard (Wireframe 01)</h3>
            <p className="text-sm text-[#5B5340]">Unit summary, workflow pending by role, exception summary, sortible unit-wise table.</p>
          </a>
          <a href="/dashboard" className="block bg-white border-2 border-[#E4DCC6] rounded-xl p-6 hover:border-[#A87C3F] transition">
            <h3 className="font-bold text-lg mb-2" style={{ fontFamily: "Georgia, serif" }}>Control Sheet (Wireframe 02)</h3>
            <p className="text-sm text-[#5B5340]">Identity header, allocation block, ATS/sale deed stages, physical custody, changes & exceptions.</p>
          </a>
        </section>
      </div>
    </div>
  );
}
