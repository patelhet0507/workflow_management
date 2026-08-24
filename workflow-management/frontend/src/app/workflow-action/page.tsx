"use client";

import { useState } from "react";
import AppLayout from "@/components/app-layout";
import { CheckCircle, XCircle, Send, FileText, Clock, User } from "lucide-react";

const STAGES = [
  { key: "ALLOCATION_PENDING", label: "Allocation Pending", role: "CRM", status: "pending" },
  { key: "CSO_APPROVE", label: "CSO Approve", role: "CSO", status: "pending" },
  { key: "MANAGEMENT_APPROVE_1", label: "Management Approve (1/3)", role: "MANAGEMENT", status: "pending" },
  { key: "MANAGEMENT_APPROVE_2", label: "Management Approve (2/3)", role: "MANAGEMENT", status: "pending" },
  { key: "MANAGEMENT_APPROVE_3", label: "Management Approve (3/3)", role: "MANAGEMENT", status: "pending" },
  { key: "CUSTOMER_SIGNATURE", label: "Customer Signature", role: "CRM", status: "pending" },
  { key: "LEGAL_EXEC_PRINT", label: "Legal Executive Print / Garvi", role: "LEGAL_EXECUTIVE", status: "pending", doc: "SALE_DEED_PRINT" },
  { key: "ADMIN_SCAN", label: "Admin Scan / Accounts Copy", role: "ADMIN_EXECUTIVE", status: "pending", doc: "SALE_DEED_SCAN" },
  { key: "CRM_EXEC_SCAN_CHECK", label: "CRM Executive Scan Check", role: "CRM_EXECUTIVE", status: "pending" },
  { key: "CFO_LEDGER_CHECK", label: "CFO Ledger Check", role: "CFO", status: "pending" },
  { key: "CFO_RECEIPT_CHECK", label: "CFO Receipt Check", role: "CFO", status: "pending" },
  { key: "CUSTOMER_RECEIVING_COPY", label: "Customer Receiving Copy", role: "CRM", status: "pending" },
  { key: "SALES_CLOSE", label: "Sales Close Confirm", role: "ADMIN_EXECUTIVE", status: "pending" },
  { key: "HANDOVER", label: "Customer Handover", role: "CRM_EXECUTIVE", status: "pending" },
];

export default function WorkflowActionPage() {
  const [currentStageIndex, setCurrentStageIndex] = useState(6); // at Legal Executive Print
  const [remark, setRemark] = useState("");
  const [sendBackRemark, setSendBackRemark] = useState("");
  const [showSendBack, setShowSendBack] = useState(false);
  const [actionLog, setActionLog] = useState([
    { stage: "MANAGEMENT_APPROVE_3", user: "A. Sharma (MANAGEMENT)", action: "APPROVE", time: "26 Jul 10:30 AM" },
    { stage: "CUSTOMER_SIGNATURE", user: "R. Mehta (CRM)", action: "SUBMIT", time: "26 Jul 11:00 AM" },
  ]);

  const current = STAGES[currentStageIndex];

  const handleApprove = () => {
    if (!remark.trim()) { alert("Remark required per §68 for formal actions."); return; }
    setActionLog((prev) => [...prev, { stage: current.label, user: "You (LEGAL_EXECUTIVE)", action: "APPROVE", time: new Date().toLocaleString() }]);
    if (currentStageIndex < STAGES.length - 1) setCurrentStageIndex((i) => i + 1);
    setRemark("");
  };

  const handleSendBack = () => {
    if (!sendBackRemark.trim()) { alert("Send-back remark is mandatory (§68)."); return; }
    setActionLog((prev) => [...prev, { stage: current.label, user: "You (LEGAL_EXECUTIVE)", action: "SEND_BACK", time: new Date().toLocaleString(), remark: sendBackRemark }]);
    setSendBackRemark("");
    setShowSendBack(false);
  };

  return (
    <div className="min-h-screen bg-[#F4EEE0] text-[#1F2A3D]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <AppLayout>
          <div className="max-w-4xl space-y-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-1 h-6 bg-[#1F2A3D] rounded-full inline-block" />
              <h1 className="text-3xl font-bold">Sale Deed Action — Shelf 03</h1>
            </div>
            <p className="text-sm text-[#5B5340]">19-stage approval flow (§1.6). Role-gated with delegation (§62-65). Send-back requires formal remark (§68). Physical custody tracked independently (§1.7).</p>

            {/* Identity Header */}
            <section className="bg-[#1F2A3D] text-[#F4EEE0] rounded-xl p-6 shadow-sm">
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div><span className="text-[#CBBE9C] block text-xs uppercase tracking-wider">Project</span><span className="font-semibold">Trident Experia</span></div>
                <div><span className="text-[#CBBE9C] block text-xs uppercase tracking-wider">Unit</span><span className="font-semibold">B-901</span></div>
                <div><span className="text-[#CBBE9C] block text-xs uppercase tracking-wider">Transaction</span><span className="font-mono text-xs">txn-7a3f-9e2c</span></div>
                <div><span className="text-[#CBBE9C] block text-xs uppercase tracking-wider">Customer</span><span>Ojesh Agrawal</span></div>
                <div><span className="text-[#CBBE9C] block text-xs uppercase tracking-wider">Sale Deed Value</span><span>₹1,85,00,000</span></div>
                <div><span className="text-[#CBBE9C] block text-xs uppercase tracking-wider">Current Stage</span><span className="font-semibold text-amber-300">{current.label}</span></div>
              </div>
              <div className="flex gap-2 mt-4">
                <span className="bg-amber-500/20 text-amber-200 text-xs px-2 py-0.5 rounded">WORKFLOW ACTIVE — V1.3.2</span>
                <span className="bg-green-500/20 text-green-200 text-xs px-2 py-0.5 rounded">NO OPEN FINANCIAL EXCEPTION</span>
                <span className="bg-blue-500/20 text-blue-200 text-xs px-2 py-0.5 rounded">PHYSICAL DOC: SALE_DEED_PRINT</span>
              </div>
            </section>

            {/* Stages */}
            <section className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm ring-1 ring-gray-200 dark:ring-gray-800">
              <div className="flex items-center gap-3 mb-4"><FileText size={14} className="text-blue-600" /><p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Workflow Stages (§1.6 / §1.7)</p></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {STAGES.map((s, i) => (
                  <button
                    key={s.key}
                    onClick={() => setCurrentStageIndex(i)}
                    className={`text-left text-xs rounded px-2 py-2 border transition ${
                      i === currentStageIndex ? "border-amber-500 bg-amber-50 ring-1 ring-amber-200" :
                      i < currentStageIndex ? "border-green-300 bg-green-50 text-green-800" : "border-gray-200 bg-gray-50 text-gray-500"
                    }`}
                  >
                    <div className="font-semibold">{s.label}</div>
                    <div className="text-[10px] opacity-70">{s.role}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* Action Panel */}
            <section className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm ring-1 ring-gray-200 dark:ring-gray-800">
              <div className="flex items-center gap-3 mb-4"><User size={14} className="text-amber-600" /><h2 className="font-bold">Current Action</h2></div>

              <div className="bg-[#FBF8F0] border border-[#CBBE9C] rounded-lg p-4 mb-4">
                <div className="text-xs text-[#5B5340] uppercase tracking-wider mb-1">Stage Key</div>
                <div className="font-mono font-bold text-lg">{current.key}</div>
                <div className="text-sm text-[#5B5340]">{current.label}</div>
                <div className="flex gap-2 mt-2 text-xs">
                  <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">Required Role: {current.role}</span>
                  {current.doc && <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">Doc: {current.doc}</span>}
                </div>
              </div>

              {/* Remark */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#5B5340] mb-1">Formal Remark (§68 — required for SUBMIT / APPROVE / SEND_BACK)</label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  rows={3}
                  className="w-full border border-[#CBBE9C] rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
                  placeholder="Enter formal remark..."
                />
              </div>

              <div className="flex gap-3">
                <button onClick={handleApprove} className="bg-green-700 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-800 flex items-center gap-2"><CheckCircle size={14} /> Approve</button>
                <button onClick={() => setShowSendBack(!showSendBack)} className="bg-amber-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-amber-700 flex items-center gap-2"><Send size={14} /> Send Back</button>
                <button onClick={() => setCurrentStageIndex((i) => i + 1)} className="border-2 border-[#CBBE9C] text-[#A87C3F] px-4 py-2 rounded text-sm font-medium hover:bg-[#FBF8F0]">Skip / Complete (Super Admin only)</button>
              </div>

              {showSendBack && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <label className="block text-xs font-semibold text-red-700 mb-1">Send-Back Remark (mandatory — §68)</label>
                  <textarea
                    value={sendBackRemark}
                    onChange={(e) => setSendBackRemark(e.target.value)}
                    rows={2}
                    className="w-full border border-red-300 rounded px-3 py-2 text-sm bg-white mb-2"
                    placeholder="Why sent back? Target stage..."
                  />
                  <button onClick={handleSendBack} className="bg-red-700 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-red-800">Confirm Send Back</button>
                </div>
              )}
            </section>

            {/* Action Log */}
            <section className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm ring-1 ring-gray-200 dark:ring-gray-800">
              <div className="flex items-center gap-3 mb-4"><Clock size={14} className="text-blue-600" /><h3 className="font-bold">Action Log (§1.6 — immutable)</h3></div>
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-left p-2">Stage</th><th className="text-left p-2">User / Role</th><th className="text-left p-2">Action</th><th className="text-left p-2">Time</th></tr></thead>
                <tbody>
                  {actionLog.map((a, i) => (
                    <tr key={i} className="border-t border-[#F0EAD9]">
                      <td className="p-2">{a.stage}</td>
                      <td className="p-2">{a.user}</td>
                      <td className="p-2"><span className={`text-xs font-medium px-1.5 py-0.5 rounded ${a.action === "APPROVE" ? "bg-green-100 text-green-800" : a.action === "SEND_BACK" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>{a.action}</span></td>
                      <td className="p-2">{a.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* Physical Custody */}
            <section className="bg-[#F8F6F1] border border-[#CBBE9C] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2"><FileText size={14} className="text-amber-600" /><h3 className="font-bold">Physical Custody (§1.7 — independent of workflow)</h3></div>
              <p className="text-sm text-[#5B5340] mb-3">Physical document identity from print (ATS_PRINT / SALE_DEED_PRINT). Scan creates separate digital record linked via physical_document_id. Custody never inferred from stage.</p>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div className="bg-white rounded p-3 shadow-sm"><div className="text-xs text-gray-500">Current Holder</div><div className="font-semibold">Legal Executive (print stage)</div><div className="text-xs text-green-700">Document ID: doc-sale-88f2 (SALE_DEED_PRINT)</div></div>
                <div className="bg-white rounded p-3 shadow-sm"><div className="text-xs text-gray-500">Next Transfer To</div><div className="font-semibold">Admin Executive (scan/check stage)</div><div className="text-xs text-amber-700">Requires manual "Transfer Physical Document" action (§1.7)</div></div>
              </div>
            </section>

            <div className="legend"><h3 className="text-sm font-semibold text-[#8C7A4D] mb-1">Notes</h3><ol className="list-disc pl-4 text-sm text-[#5B5340]"><li>Role gate: only users with role = current.required_role (or permitted_acting_roles / active delegation) may act.</li><li>Send-back requires formal remark (§68) and targets a valid send_back_target_stage (§1.6).</li><li>Physical custody is user-initiated, never inferred from workflow stage (§1.7).</li><li>Financial exceptions do not block approval (CFO approves with pending receipts — §1.5).</li><li>Document identity from creation: SALE_DEED_PRINT row exists at print time (§1.4).</li></ol></div>
          </div>
        </AppLayout>
      </div>
    </div>
  );
}
