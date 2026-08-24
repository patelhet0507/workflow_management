import React, { useState, useEffect } from "react";
/*
 * v1.3.2 — App.jsx is a FUNCTIONAL UI PROTOTYPE, not the production implementation.
 * It exists to demonstrate business logic and let a non-technical business owner confirm the
 * workflow matches their real process — it is not a UI/visual design reference and not a build
 * spec. Where this prototype is simplified relative to the full system (e.g. My Tasks here is
 * simpler than the full My Tasks wireframe in phase2-wireframes-v1.3.2.html; only 4 of 19
 * reports are wired to real data), phase2-wireframes-v1.3.2.html and
 * phase1-specification-v1.3.2.md are authoritative — not this file. See README-v1.3.2.md §3.
 */
import {
  LayoutDashboard, Building2, Users as UsersIcon, Bell, CheckCircle2,
  Plus, ChevronRight, ShieldCheck, AlertCircle, X, Trash2, ArrowLeft,
  Stamp, ScrollText, AlertTriangle, RotateCcw, Ban, ArrowRightLeft, UserCog2,
  MessageSquare, Wallet, FileBarChart, History
} from "lucide-react";

/* Ink navy / aged paper / stamp red / seal green / brass — see prior design notes */
const ROLES = {
  SUPERADMIN: "Super Admin", CRM: "CRM", CRM_EXEC: "CRM Executive", CSO: "CSO",
  MANAGEMENT: "Management", LEGAL_EXEC: "Legal Executive", LEGAL_MGR: "Legal Manager",
  CFO: "CFO", ADMIN_EXEC: "Admin Executive",
};

const FIN_COMPONENTS = [
  { key: "basicAmount", label: "Basic Amount" },
  { key: "gst", label: "GST" },
  { key: "runningMaintenance", label: "Running Maintenance" },
  { key: "maintenanceDeposit", label: "Maintenance Deposit" },
  { key: "stampDuty", label: "Stamp Duty" },
  { key: "legalFees", label: "Legal Fees" },
  { key: "png", label: "PNG Gas Connection" },
];

const REPORT_KEYS = [
  "unit-status", "workflow-pending", "department-pending", "user-pending", "financial-exception",
  "registration", "handover", "cancellation", "unit-change", "customer-change", "direct-sale-deed",
  "management-exception", "super-admin-financial-change", "legal-manager-acting", "physical-custody",
  "complete-audit", "booking-source", "booked-by", "payment-plan",
];
// v1.3: only these two are wired to real prototype data — see CHANGELOG-v1.3.md. The rest are
// listed in the selector to show the intended catalogue, not implemented individually here.
const IMPLEMENTED_REPORTS = ["financial-exception", "legal-manager-acting", "physical-custody", "cancellation"];

const ALLOCATION_STAGES = [
  { id: "crm_fill", requiredRole: "CRM", label: "CRM submits (CCF + KYC required)", fields: [
      { key: "clientConfirmationForm", label: "Client Confirmation Form (file ref)", type: "file", required: true },
      { key: "kyc", label: "KYC captured", type: "checkbox", required: true },
  ]},
  { id: "cso_approve", requiredRole: "CSO", label: "CSO Approval", fields: [] },
  { id: "mgmt_approve", requiredRole: "MANAGEMENT", label: "Management Approval (Allocation) — approval 1 of 3", fields: [] },
];

const ATS_STAGES = [
  { id: "crm_request", requiredRole: "CRM", label: "CRM requests ATS Execution Approval", fields: [] },
  { id: "mgmt_approve", requiredRole: "MANAGEMENT", label: "Management Approval (ATS) — approval 2 of 3", fields: [] },
  { id: "customer_email", requiredRole: "CRM", label: "Customer ATS draft approval (email PDF upload)", fields: [
      { key: "mailApprovalPdf", label: "Customer approval email (file ref)", type: "file", required: true },
  ]},
  { id: "legal_exec_print", requiredRole: "LEGAL_EXEC", label: "Legal Executive: print ATS & Garvi", fields: [
      { key: "garviRefNo", label: "Garvi reference no.", type: "text", required: true },
  ]},
  { id: "legal_mgr_check", requiredRole: "LEGAL_MGR", actingRoles: ["LEGAL_MGR", "CRM", "CFO"], label: "Legal Manager: ATS verification", fields: [] },
  { id: "cfo_ledger", requiredRole: "CFO", label: "CFO: ATS ledger check", fields: [
      { key: "ledgerVerified", label: "Ledger Verified", type: "checkbox", required: true },
  ]},
  { id: "customer_signature", requiredRole: "CRM", label: "Customer ATS signature obtained", fields: [
      { key: "signedCopyRef", label: "Signed ATS copy (file ref)", type: "file", required: true },
  ]},
  { id: "legal_final", requiredRole: "LEGAL_MGR", actingRoles: ["LEGAL_MGR", "CRM", "CFO"], label: "Legal final ATS verification", fields: [] },
  { id: "registration", requiredRole: "LEGAL_EXEC", label: "ATS registration (SRO) — entered by Legal Executive", fields: [
      { key: "sro", label: "SRO", type: "text", required: true },
      { key: "registrationNumber", label: "Registration / Document No.", type: "text", required: true },
      { key: "registrationDate", label: "Registration Date", type: "date", required: true },
      { key: "executionDate", label: "Execution Date", type: "date", required: false },
  ]},
  { id: "admin_scan", requiredRole: "ADMIN_EXEC", label: "Admin: scan, Accounts copy, Sales Close", fields: [
      { key: "scanned", label: "Registered ATS scanned & saved to Drive", type: "checkbox", required: true },
      { key: "accountsCopyGiven", label: "Photocopy given to Accounts", type: "checkbox", required: true },
      { key: "salesCloseConfirmed", label: "Sales Close Confirmation", type: "checkbox", required: true },
  ]},
  { id: "scan_check", requiredRole: "CRM_EXEC", label: "CRM Executive: scan check", fields: [
      { key: "scanVerified", label: "Scan Verified (correct, complete, readable, right unit/customer/folder)", type: "checkbox", required: true },
  ]},
  { id: "handover", requiredRole: "CRM_EXEC", label: "Customer handover", fields: [
      { key: "handoverDate", label: "Document handover date", type: "date", required: true },
      { key: "receivingCopyRef", label: "Customer receiving copy (file ref)", type: "file", required: true },
  ]},
];

const SALEDEED_STAGES = [
  { id: "crm_request", requiredRole: "CRM", label: "CRM requests Sale Deed Execution Approval", fields: [] },
  { id: "mgmt_approve", requiredRole: "MANAGEMENT", label: "Management Approval (Sale Deed) — approval 3 of 3", fields: [] },
  { id: "legal_exec_print", requiredRole: "LEGAL_EXEC", label: "Legal Executive: prepare/print & Garvi", fields: [
      { key: "garviRefNo", label: "Garvi reference no.", type: "text", required: true },
  ]},
  { id: "legal_mgr_check", requiredRole: "LEGAL_MGR", actingRoles: ["LEGAL_MGR", "CRM", "CFO"], label: "Legal Manager: verification", fields: [] },
  { id: "cfo_receipt_check", requiredRole: "CFO", label: "CFO: receipt checklist (may approve with pending items)", fields: [
      ...FIN_COMPONENTS.map((c) => ({ key: c.key, label: c.label + " received", type: "checkbox", required: false })),
      { key: "tds", label: "TDS received / N-A", type: "checkbox", required: false },
      { key: "loanCheque", label: "Loan Cheque (DD) details", type: "loanCheque", required: false },
  ]},
  { id: "customer_signature", requiredRole: "CRM", label: "Customer Sale Deed signature obtained", fields: [
      { key: "signedCopyRef", label: "Signed Sale Deed copy (file ref)", type: "file", required: true },
  ]},
  { id: "legal_final", requiredRole: "LEGAL_MGR", actingRoles: ["LEGAL_MGR", "CRM", "CFO"], label: "Legal final verification", fields: [] },
  { id: "registration", requiredRole: "LEGAL_EXEC", label: "Sale Deed registration (SRO) — entered by Legal Executive", fields: [
      { key: "sro", label: "SRO", type: "text", required: true },
      { key: "registrationNumber", label: "Registration / Document No.", type: "text", required: true },
      { key: "registrationDate", label: "Registration Date", type: "date", required: true },
      { key: "executionDate", label: "Execution Date", type: "date", required: true },
  ]},
  { id: "garvi_downloads", requiredRole: "LEGAL_EXEC", allowManagementSkip: true, label: "Index II / Certified Copy download confirmation", fields: [
      { key: "indexII", label: "Index II Downloaded", type: "checkbox", required: true },
      { key: "certifiedCopy", label: "Certified Copy Downloaded", type: "checkbox", required: true },
  ]},
  { id: "admin_scan", requiredRole: "ADMIN_EXEC", label: "Admin: scan, Accounts copy, Sales Close", fields: [
      { key: "scanned", label: "Registered Sale Deed scanned & saved to Drive", type: "checkbox", required: true },
      { key: "accountsCopyGiven", label: "Photocopy given to Accounts", type: "checkbox", required: true },
      { key: "salesCloseConfirmed", label: "Sales Close Confirmation", type: "checkbox", required: true },
  ]},
  { id: "scan_check", requiredRole: "CRM_EXEC", label: "CRM Executive: scan check", fields: [
      { key: "scanVerified", label: "Scan Verified", type: "checkbox", required: true },
  ]},
  { id: "handover", requiredRole: "CRM_EXEC", label: "Customer handover", fields: [
      { key: "handoverDate", label: "Document handover date", type: "date", required: true },
      { key: "receivingCopyRef", label: "Customer receiving copy (file ref)", type: "file", required: true },
  ]},
];

const STORAGE_KEY = "workflow-data-v3";
function newId(p) { return p + "_" + Math.random().toString(36).slice(2, 9); }
function unitKey(s) { return (s || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); }
function today() { return new Date().toISOString().slice(0, 10); }
function fmt(ts) { return new Date(ts).toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
function withinRange(d) { const t = today(); return d.startDate <= t && t <= d.endDate; }
function unitHasActiveTxn(records, unitId) { return Object.values(records).some((r) => r.unitId === unitId && r.lifecycleStatus === "ACTIVE"); }

function seedData() {
  const users = [
    { id: "u1", name: "Priya Shah", role: "SUPERADMIN" },
    { id: "u2", name: "Kevin Patel", role: "CRM" },
    { id: "u3", name: "Rohan Mehta", role: "CRM" },
    { id: "u4", name: "Ruchika", role: "CRM_EXEC" },
    { id: "u5", name: "Amay", role: "CSO" },
    { id: "u6", name: "Bharti Ma'am", role: "MANAGEMENT" },
    { id: "u7", name: "Nidhi", role: "LEGAL_EXEC" },
    { id: "u8", name: "Pranav Bhai", role: "LEGAL_MGR" },
    { id: "u9", name: "Vaibhav Bhai", role: "CFO" },
    { id: "u10", name: "Dipak Bhai", role: "ADMIN_EXEC" },
  ];
  const projects = [
    { id: "p1", name: "Trident Experia", units: [
        { id: "un1", number: "B-901" }, { id: "un2", number: "B-902" }, { id: "un3", number: "B-903" },
    ]},
  ];
  const sourceMaster = ["Direct", "Channel Partner", "Agent", "Employee Reference", "Existing Customer", "Other"]
    .map((n) => ({ id: newId("src"), name: n, active: true }));
  const bookedByMaster = [{ id: newId("bb"), name: "Rajesh Kaurani", type: "Agent", active: true, mergedIntoId: null }];
  const paymentPlanMaster = ["Construction Linked Plan (CLP)", "Down Payment Plan", "Time Linked Plan", "Custom Plan"]
    .map((n) => ({ id: newId("pp"), name: n, active: true }));
  return {
    users, projects, sourceMaster, bookedByMaster, paymentPlanMaster, records: {},
    delegations: [], notifications: [], auditLog: [],
    workflowVersions: { allocation: 1, ats: 1, saledeed: 1 }, // v1.3
  };
}

function StampBadge({ tone = "pending", children }) {
  const styles = {
    pending: "border-[#A93226] text-[#A93226]", done: "border-[#2E6B4F] text-[#2E6B4F]",
    idle: "border-[#8C8272] text-[#8C8272]", warn: "border-[#A87C3F] text-[#A87C3F]",
  };
  return (
    <span className={`inline-block select-none border-2 rounded px-2 py-0.5 text-[10px] font-bold tracking-[0.10em] uppercase -rotate-2 ${styles[tone]}`}
      style={{ fontFamily: "Georgia, serif" }}>{children}</span>
  );
}

function stageActingRoles(stage) { return stage.actingRoles || [stage.requiredRole]; }

function canActOnStage(stage, currentUser, delegations) {
  if (stageActingRoles(stage).includes(currentUser.role)) return { can: true, viaDelegation: null };
  const deleg = delegations.find((d) => d.active && d.nominalRole === stage.requiredRole && d.delegatedRole === currentUser.role && withinRange(d));
  if (deleg) return { can: true, viaDelegation: deleg };
  return { can: false };
}

function Field({ field, value, onChange }) {
  const set = (v) => onChange(field.key, v);
  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-2 py-1.5 text-sm text-[#1F2A3D] cursor-pointer">
        <input type="checkbox" checked={!!value} onChange={(e) => set(e.target.checked)} className="w-4 h-4 accent-[#A87C3F]" />
        {field.label}{field.required && <span className="text-[#A93226]">*</span>}
      </label>
    );
  }
  if (field.type === "loanCheque") {
    const v = value || {};
    const upd = (k, val) => set({ ...v, [k]: val });
    return (
      <div className="border border-[#CBBE9C] rounded-md p-3 mt-1 bg-[#FBF8F0]">
        <div className="text-xs font-semibold uppercase tracking-wide text-[#8C7A4D] mb-2">{field.label}</div>
        <label className="flex items-center gap-2 text-sm mb-2"><input type="checkbox" checked={!!v.available} onChange={(e) => upd("available", e.target.checked)} className="accent-[#A87C3F]" /> Loan cheque available</label>
        {v.available && (
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={v.date || ""} onChange={(e) => upd("date", e.target.value)} className="border border-[#CBBE9C] rounded px-2 py-1 text-sm bg-white" />
            <input placeholder="Bank name" value={v.bankName || ""} onChange={(e) => upd("bankName", e.target.value)} className="border border-[#CBBE9C] rounded px-2 py-1 text-sm bg-white" />
            <input placeholder="Cheque no." value={v.chequeNo || ""} onChange={(e) => upd("chequeNo", e.target.value)} className="border border-[#CBBE9C] rounded px-2 py-1 text-sm bg-white" />
            <input placeholder="Amount" value={v.amount || ""} onChange={(e) => upd("amount", e.target.value)} className="border border-[#CBBE9C] rounded px-2 py-1 text-sm bg-white" />
          </div>
        )}
      </div>
    );
  }
  return (
    <label className="block text-sm mb-2">
      <span className="text-[#1F2A3D]">{field.label}{field.required && <span className="text-[#A93226]">*</span>}</span>
      <input type={field.type === "date" ? "date" : "text"} value={value || ""} onChange={(e) => set(e.target.value)}
        placeholder={field.type === "file" ? "e.g. scan_0042.pdf" : ""}
        className="mt-1 w-full border border-[#CBBE9C] rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#A87C3F]" />
    </label>
  );
}

function summarize(field, value) {
  if (field.type === "checkbox") return `${field.label}: ${value ? "Yes" : "No"}`;
  if (field.type === "loanCheque") { const v = value || {}; return v.available ? `${field.label}: ${v.bankName || "-"} / ${v.chequeNo || "-"} / ${v.amount || "-"}` : `${field.label}: not available`; }
  return `${field.label}: ${value || "-"}`;
}

// v1.3: WorkflowPanel no longer computes/displays "physical custody" itself — that's now the
// standalone PhysicalCustodyPanel below, driven by an explicit log, never inferred from stage.
function WorkflowPanel({ workflowKey, wfState, stages, currentUser, meta, onSubmitStage, onManagementSkip, disabledReason }) {
  const [formData, setFormData] = useState({});
  const [remark, setRemark] = useState("");
  const [error, setError] = useState("");
  const currentStep = wfState?.currentStep ?? 0;
  const complete = wfState && currentStep >= stages.length;

  useEffect(() => { setFormData({}); setRemark(""); setError(""); }, [currentStep, workflowKey]);

  if (disabledReason) return <div className="border border-dashed border-[#CBBE9C] rounded-lg p-5 text-sm text-[#8C8272] bg-[#FBF8F0]">{disabledReason}</div>;
  if (wfState?.skipped) return (
    <div className="border-2 border-dashed border-[#A87C3F] rounded-lg p-4 bg-[#FBF8F0]">
      <div className="font-semibold text-sm text-[#A87C3F]">ATS Skipped — Direct Sale Deed Case</div>
      {wfState.remark && <div className="text-xs text-[#5B5340] mt-1 italic">"{wfState.remark}"</div>}
    </div>
  );

  const activeStage = !complete ? stages[currentStep] : null;
  const acting = activeStage ? canActOnStage(activeStage, currentUser, meta.delegations) : { can: false };

  function handleChange(k, v) { setFormData((f) => ({ ...f, [k]: v })); }

  function submit() {
    for (const f of activeStage.fields) {
      if (f.required) {
        const v = formData[f.key];
        const empty = f.type === "checkbox" ? !v : !v;
        if (empty) { setError(`"${f.label}" is required.`); return; }
      }
    }
    onSubmitStage(workflowKey, currentStep, formData, remark, acting.viaDelegation);
  }

  return (
    <div className="space-y-3">
      {stages.map((s, i) => {
        const done = i < currentStep;
        const isActive = i === currentStep && !complete;
        const logEntry = wfState?.log?.[i];
        return (
          <div key={s.id} className={`rounded-lg border ${isActive ? "border-[#A87C3F] bg-[#FBF8F0]" : "border-[#E4DCC6] bg-white"} px-4 py-3`}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-mono text-[#8C8272] shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <span className={`text-sm ${done ? "text-[#2E6B4F] font-medium" : isActive ? "text-[#1F2A3D] font-semibold" : "text-[#8C8272]"}`}>{s.label}</span>
              </div>
              {done && <StampBadge tone="done">Signed</StampBadge>}
              {isActive && <StampBadge tone="pending">{ROLES[s.requiredRole]} pending{stageActingRoles(s).length > 1 ? " (or acting)" : ""}</StampBadge>}
              {!done && !isActive && <StampBadge tone="idle">Queued</StampBadge>}
            </div>
            {done && logEntry && (
              <div className="mt-2 pl-6 text-xs text-[#5B5340] space-y-0.5 border-l-2 border-[#E4DCC6] ml-1">
                <div>By <span className="font-semibold">{logEntry.actor.name}</span> ({ROLES[logEntry.actualRole]}{logEntry.actualRole !== logEntry.nominalRole ? `, acting as ${ROLES[logEntry.nominalRole]}` : ""}) &middot; {fmt(logEntry.timestamp)}</div>
                {s.fields.map((f) => logEntry.data[f.key] !== undefined && <div key={f.key}>{summarize(f, logEntry.data[f.key])}</div>)}
                {logEntry.remark && <div className="italic">Formal remark: "{logEntry.remark}"</div>}
              </div>
            )}
            {isActive && (
              acting.can ? (
                <div className="mt-3 pl-6 border-l-2 border-[#A87C3F] ml-1">
                  {acting.viaDelegation && <div className="text-[11px] text-[#A87C3F] mb-2">Acting via delegation from {ROLES[acting.viaDelegation.nominalRole]}.</div>}
                  {s.fields.map((f) => <Field key={f.key} field={f} value={formData[f.key]} onChange={handleChange} />)}
                  <label className="block text-sm mb-2"><span className="text-[#1F2A3D]">Formal remark (part of this approval's audit record)</span>
                    <textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={2} className="mt-1 w-full border border-[#CBBE9C] rounded px-2 py-1.5 text-sm bg-white" /></label>
                  {error && <div className="text-xs text-[#A93226] mb-2 flex items-center gap-1"><AlertCircle size={13} />{error}</div>}
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={submit} className="inline-flex items-center gap-1.5 bg-[#1F2A3D] text-[#F4EEE0] text-sm font-medium px-4 py-1.5 rounded hover:bg-[#2c3b56]">
                      <Stamp size={14} /> Sign &amp; move forward
                    </button>
                    {i > 0 && (
                      <button onClick={() => { if (!remark.trim()) { setError("Send Back requires a remark."); return; } onSubmitStage(workflowKey, currentStep, formData, remark, acting.viaDelegation, true); }}
                        className="inline-flex items-center gap-1.5 border-2 border-[#A93226] text-[#A93226] text-sm font-medium px-4 py-1.5 rounded hover:bg-[#FBEDEA]">
                        Send Back
                      </button>
                    )}
                    {s.allowManagementSkip && currentUser.role === "MANAGEMENT" && (
                      <button onClick={() => { if (!remark.trim()) { setError("Management skip requires a remark."); return; } onManagementSkip(workflowKey, currentStep, remark); }}
                        className="inline-flex items-center gap-1.5 border-2 border-[#A87C3F] text-[#A87C3F] text-sm font-medium px-4 py-1.5 rounded hover:bg-[#FBF8F0]">
                        Management skip (bypass)
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-2 pl-6 text-xs text-[#8C8272] ml-1">Waiting on <span className="font-semibold">{ROLES[s.requiredRole]}</span>{stageActingRoles(s).length > 1 ? ` (or ${stageActingRoles(s).filter(r => r !== s.requiredRole).map(r => ROLES[r]).join("/")} acting)` : ""}. You're viewing as {ROLES[currentUser.role]}.</div>
              )
            )}
          </div>
        );
      })}
      {complete && (
        <div className="rounded-lg border-2 border-[#2E6B4F] bg-[#F1F7F3] px-4 py-3 flex items-center gap-2">
          <CheckCircle2 className="text-[#2E6B4F]" size={18} /><span className="text-sm font-semibold text-[#2E6B4F]">Workflow complete</span>
        </div>
      )}
    </div>
  );
}

// v1.3.1 — physical custody now identifies WHICH document moved, not just the transaction.
// A transaction can have several physical documents in flight (its ATS print, its Sale Deed
// print, a receiving copy) with different current holders at the same time.
// v1.3.2: every physical document now has an identity from the moment it's created/printed —
// auto-created as a rec.documents row when the legal_exec_print / admin_scan stages complete
// (see submitStage). Custody transfers pick from that list instead of free-typing a label each
// time, matching the corrected schema (documents row exists before any Drive/scan reference).
function PhysicalCustodyPanel({ rec, workflowKey, currentUser, onTransfer }) {
  const log = rec.custodyLog?.[workflowKey] || [];
  const docs = (rec.documents || []).filter((d) => d.workflowType === workflowKey);
  const currentByDoc = docs.map((d) => ({ doc: d, entry: [...log].reverse().find((c) => c.documentId === d.id) }));
  const [docId, setDocId] = useState(docs[0]?.id || "");
  const [toRole, setToRole] = useState("CRM");
  const [toName, setToName] = useState("");
  const [remark, setRemark] = useState("");
  useEffect(() => { if (!docId && docs[0]) setDocId(docs[0].id); }, [docs.length]);
  if (!rec[workflowKey]) return null;
  return (
    <div className="bg-white border border-[#E4DCC6] rounded-lg p-4 mt-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold flex items-center gap-1.5"><History size={14} /> Physical custody ({workflowKey.toUpperCase()}) — per document</div>
      </div>
      {currentByDoc.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-2">
          {currentByDoc.map(({ doc, entry }) => (
            <StampBadge key={doc.id} tone={entry ? "warn" : "idle"}>{doc.label}{doc.driveFileId ? " (scanned)" : ""}: {entry ? `with ${entry.toName || ROLES[entry.toRole]}` : "not yet transferred"}</StampBadge>
          ))}
        </div>
      )}
      {docs.length === 0 ? (
        <div className="text-xs text-[#8C8272] mb-2">No physical document exists yet for this workflow — one is created automatically the moment Legal Executive completes the print/Garvi stage.</div>
      ) : (
        <div className="row flex gap-2 flex-wrap items-center mb-2">
          <select value={docId} onChange={(e) => setDocId(e.target.value)} className="border border-[#CBBE9C] rounded px-2 py-1 text-xs">
            {docs.map((d) => <option key={d.id} value={d.id}>{d.label}{d.driveFileId ? " (scanned)" : ""}</option>)}
          </select>
          <select value={toRole} onChange={(e) => setToRole(e.target.value)} className="border border-[#CBBE9C] rounded px-2 py-1 text-xs">
            {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input value={toName} onChange={(e) => setToName(e.target.value)} placeholder="Name (optional)" className="border border-[#CBBE9C] rounded px-2 py-1 text-xs w-28" />
          <input value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Remark (optional)" className="border border-[#CBBE9C] rounded px-2 py-1 text-xs flex-1 min-w-[100px]" />
          <button onClick={() => { if (!docId) return; onTransfer(workflowKey, docId, toRole, toName, remark); setToName(""); setRemark(""); }}
            className="bg-[#1F2A3D] text-white text-xs px-3 py-1.5 rounded">Transfer</button>
        </div>
      )}
      <div className="text-[11px] text-[#8C8272] mb-1">Standalone action, identified by document — never changes automatically just because a workflow stage advances.</div>
      {log.length > 0 && (
        <table className="w-full text-xs mt-1">
          <thead><tr className="text-[#8C8272] text-left"><th className="pr-2">Document</th><th className="pr-2">From</th><th className="pr-2">To</th><th className="pr-2">Date/time</th><th className="pr-2">User</th><th>Remark</th></tr></thead>
          <tbody>
            {[...log].reverse().map((c, i) => (
              <tr key={i} className="border-t border-[#F0EAD9] text-[#5B5340]">
                <td className="pr-2 py-0.5">{(rec.documents || []).find((d) => d.id === c.documentId)?.label || c.documentId}</td><td className="pr-2 py-0.5">{c.fromLabel || "—"}</td>
                <td className="pr-2 py-0.5">{c.toName || ROLES[c.toRole]}</td><td className="pr-2 py-0.5">{fmt(c.at)}</td>
                <td className="pr-2 py-0.5">{c.by}</td><td className="py-0.5">{c.remark || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// v1.3 — new: internal comments, visibly separate from formal workflow remarks.
function InternalComments({ rec, currentUser, onAdd }) {
  const [msg, setMsg] = useState("");
  return (
    <div className="bg-white border border-[#E4DCC6] rounded-lg p-4 mt-3">
      <div className="text-sm font-semibold flex items-center gap-1.5 mb-2"><MessageSquare size={14} /> Internal comments (operational — never moves workflow)</div>
      <div className="space-y-1 mb-2 max-h-32 overflow-y-auto">
        {(rec.internalComments || []).length === 0 && <div className="text-xs text-[#8C8272]">No comments yet.</div>}
        {(rec.internalComments || []).map((c) => (
          <div key={c.id} className="text-xs text-[#5B5340]"><span className="font-semibold">{c.userName}</span> &middot; {fmt(c.at)}: {c.message}</div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="@FirstName to mention a specific user..." className="flex-1 border border-[#CBBE9C] rounded px-2 py-1.5 text-xs" />
        <button onClick={() => { if (!msg.trim()) return; onAdd(msg); setMsg(""); }} className="bg-[#A87C3F] text-white text-xs px-3 py-1.5 rounded">Post</button>
      </div>
    </div>
  );
}

function NewAllocationModal({ meta, currentUser, onCreate, onClose }) {
  const [projectId, setProjectId] = useState(meta.projects[0]?.id || "");
  const [unitId, setUnitId] = useState("");
  const [clientName, setClientName] = useState("");
  const [saleDeedValue, setSaleDeedValue] = useState("");
  const [onboardingDate, setOnboardingDate] = useState(today());
  const [clientConfirmationDate, setClientConfirmationDate] = useState(today());
  const [sourceId, setSourceId] = useState(meta.sourceMaster[0]?.id || "");
  const [bookedById, setBookedById] = useState(meta.bookedByMaster[0]?.id || "");
  const [bookingRemark, setBookingRemark] = useState("");
  const [paymentPlanId, setPaymentPlanId] = useState(meta.paymentPlanMaster[0]?.id || "");
  const [isDirect, setIsDirect] = useState(false);
  const [directRemark, setDirectRemark] = useState("");
  const [ccf, setCcf] = useState("");
  const [kyc, setKyc] = useState(false);
  const [fin, setFin] = useState({ basicAmount: "", gst: "", runningMaintenance: "", maintenanceDeposit: "", stampDuty: "", legalFees: "", png: "", tds: "" });
  const [remark, setRemark] = useState("");
  const [error, setError] = useState("");

  const project = meta.projects.find((p) => p.id === projectId);
  // v1.3: a unit is available if it has no currently-ACTIVE transaction — not "no record ever"
  const availableUnits = (project?.units || []).filter((u) => !unitHasActiveTxn(meta.records, u.id));
  const historicalUnits = (project?.units || []).filter((u) => unitHasActiveTxn(meta.records, u.id));

  function submit() {
    if (!projectId || !unitId || !clientName || !saleDeedValue || !ccf || !kyc) { setError("Project, Unit, Client Name, SD Value, CCF and KYC are all mandatory."); return; }
    if (isDirect && !directRemark.trim()) { setError("Direct Sale Deed case requires a remark."); return; }
    onCreate({ projectId, unitId, clientName, saleDeedValue, onboardingDate, clientConfirmationDate, sourceId, bookedById, bookingRemark, paymentPlanId, isDirect, directRemark, ccf, kyc, fin, remark });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-[#F4EEE0] rounded-lg max-w-lg w-full p-5 border border-[#CBBE9C] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-[#1F2A3D]" style={{ fontFamily: "Georgia, serif" }}>New Unit Allocation</h3>
          <button onClick={onClose}><X size={18} className="text-[#8C8272]" /></button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm mb-2"><span>Project</span>
            <select value={projectId} onChange={(e) => { setProjectId(e.target.value); setUnitId(""); }} className="mt-1 w-full border border-[#CBBE9C] rounded px-2 py-1.5 text-sm bg-white">
              {meta.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <label className="block text-sm mb-2"><span>Unit Number</span>
            <select value={unitId} onChange={(e) => setUnitId(e.target.value)} className="mt-1 w-full border border-[#CBBE9C] rounded px-2 py-1.5 text-sm bg-white">
              <option value="">Select&hellip;</option>{availableUnits.map((u) => <option key={u.id} value={u.id}>{u.number}</option>)}</select></label>
        </div>
        {historicalUnits.length > 0 && <div className="text-[11px] text-[#8C8272] mb-2">Not shown (already have an active transaction): {historicalUnits.map(u => u.number).join(", ")}. A unit reappears here once its active transaction is Cancelled.</div>}
        <label className="block text-sm mb-2"><span>Client Name</span><input value={clientName} onChange={(e) => setClientName(e.target.value)} className="mt-1 w-full border border-[#CBBE9C] rounded px-2 py-1.5 text-sm bg-white" /></label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm mb-2"><span>Onboarding Date</span><input type="date" value={onboardingDate} onChange={(e) => setOnboardingDate(e.target.value)} className="mt-1 w-full border border-[#CBBE9C] rounded px-2 py-1.5 text-sm bg-white" /></label>
          <label className="block text-sm mb-2"><span>Client Confirmation Date</span><input type="date" value={clientConfirmationDate} onChange={(e) => setClientConfirmationDate(e.target.value)} className="mt-1 w-full border border-[#CBBE9C] rounded px-2 py-1.5 text-sm bg-white" /></label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm mb-2"><span>Source of Booking</span><select value={sourceId} onChange={(e) => setSourceId(e.target.value)} className="mt-1 w-full border border-[#CBBE9C] rounded px-2 py-1.5 text-sm bg-white">{meta.sourceMaster.filter(s => s.active).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
          <label className="block text-sm mb-2"><span>Booked By</span><select value={bookedById} onChange={(e) => setBookedById(e.target.value)} className="mt-1 w-full border border-[#CBBE9C] rounded px-2 py-1.5 text-sm bg-white">{meta.bookedByMaster.filter(b => b.active).map((b) => <option key={b.id} value={b.id}>{b.name} ({b.type})</option>)}</select></label>
        </div>
        <label className="block text-sm mb-2"><span>Booking / Reference Remark</span><input value={bookingRemark} onChange={(e) => setBookingRemark(e.target.value)} placeholder="e.g. confirmation via agent X" className="mt-1 w-full border border-[#CBBE9C] rounded px-2 py-1.5 text-sm bg-white" /></label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm mb-2"><span>Payment Plan</span><select value={paymentPlanId} onChange={(e) => setPaymentPlanId(e.target.value)} className="mt-1 w-full border border-[#CBBE9C] rounded px-2 py-1.5 text-sm bg-white">{meta.paymentPlanMaster.filter(p => p.active).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <label className="block text-sm mb-2"><span>Sale Deed Value</span><input value={saleDeedValue} onChange={(e) => setSaleDeedValue(e.target.value)} className="mt-1 w-full border border-[#CBBE9C] rounded px-2 py-1.5 text-sm bg-white" /></label>
        </div>

        <div className="border border-[#CBBE9C] rounded-md p-3 my-2 bg-[#FBF8F0]">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#8C7A4D] mb-2">Financial Details (locked after allocation approval)</div>
          <div className="grid grid-cols-2 gap-2">
            {["basicAmount", "gst", "runningMaintenance", "maintenanceDeposit", "stampDuty", "legalFees", "png", "tds"].map((k) => (
              <input key={k} placeholder={k} value={fin[k]} onChange={(e) => setFin((f) => ({ ...f, [k]: e.target.value }))} className="border border-[#CBBE9C] rounded px-2 py-1 text-sm bg-white" />
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm mb-2"><input type="checkbox" checked={isDirect} onChange={(e) => setIsDirect(e.target.checked)} className="accent-[#A87C3F]" /> Direct Sale Deed Case (skip ATS)</label>
        {isDirect && <label className="block text-sm mb-2"><span>Direct Sale Deed Remark <span className="text-[#A93226]">*</span></span><input value={directRemark} onChange={(e) => setDirectRemark(e.target.value)} className="mt-1 w-full border border-[#CBBE9C] rounded px-2 py-1.5 text-sm bg-white" /></label>}

        <label className="block text-sm mb-2"><span>Client Confirmation Form (file ref) <span className="text-[#A93226]">*</span></span><input value={ccf} onChange={(e) => setCcf(e.target.value)} placeholder="e.g. ccf_ojesh.pdf" className="mt-1 w-full border border-[#CBBE9C] rounded px-2 py-1.5 text-sm bg-white" /></label>
        <label className="flex items-center gap-2 text-sm mb-2"><input type="checkbox" checked={kyc} onChange={(e) => setKyc(e.target.checked)} className="accent-[#A87C3F]" /> KYC Captured <span className="text-[#A93226]">*</span></label>
        <label className="block text-sm mb-2"><span>Remark</span><textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={2} className="mt-1 w-full border border-[#CBBE9C] rounded px-2 py-1.5 text-sm bg-white" /></label>
        {error && <div className="text-xs text-[#A93226] mb-2 flex items-center gap-1"><AlertCircle size={13} />{error}</div>}
        <button onClick={submit} className="w-full bg-[#1F2A3D] text-[#F4EEE0] text-sm font-medium px-4 py-2 rounded hover:bg-[#2c3b56]">Create &amp; sign as {currentUser.name}</button>
      </div>
    </div>
  );
}

function MasterCard({ title, icon: Icon, items, fields, onAdd, onToggle }) {
  const [vals, setVals] = useState(Object.fromEntries(fields.map((f) => [f.key, ""])));
  return (
    <div className="bg-white border border-[#E4DCC6] rounded-lg p-4">
      <h4 className="font-semibold text-[#1F2A3D] mb-3 flex items-center gap-2 text-sm"><Icon size={15} /> {title}</h4>
      <div className="flex gap-2 mb-3 flex-wrap">
        {fields.map((f) => f.type === "select" ? (
          <select key={f.key} value={vals[f.key]} onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))} className="border border-[#CBBE9C] rounded px-2 py-1.5 text-sm">
            {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input key={f.key} placeholder={f.label} value={vals[f.key]} onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))} className="flex-1 min-w-[100px] border border-[#CBBE9C] rounded px-2 py-1.5 text-sm" />
        ))}
        <button onClick={() => { onAdd(vals); setVals(Object.fromEntries(fields.map((f) => [f.key, f.type === "select" ? f.options[0] : ""]))); }} className="bg-[#A87C3F] text-white px-3 rounded text-sm">Add</button>
      </div>
      <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
        {items.filter(it => !it.mergedIntoId).map((it) => (
          <div key={it.id} className="flex items-center justify-between text-sm border-b border-[#F0EAD9] py-1">
            <span className={it.active === false ? "line-through text-[#8C8272]" : ""}>{it.name}{it.type ? ` · ${it.type}` : ""}</span>
            <button onClick={() => onToggle(it.id)} className="text-xs text-[#A87C3F]">{it.active === false ? "Activate" : "Deactivate"}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SetupPanel({ meta, setMeta, onBumpVersion }) {
  const [projName, setProjName] = useState("");
  const [unitProjId, setUnitProjId] = useState(meta.projects[0]?.id || "");
  const [unitNo, setUnitNo] = useState("");
  const [unitError, setUnitError] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [bulkResult, setBulkResult] = useState(null);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("CRM");
  const [dOrig, setDOrig] = useState(meta.users[0]?.id || "");
  const [dActing, setDActing] = useState(meta.users[0]?.id || "");
  const [dNominal, setDNominal] = useState("LEGAL_EXEC");
  const [dDelegated, setDDelegated] = useState("CRM");
  const [dStart, setDStart] = useState(today());
  const [dEnd, setDEnd] = useState(today());
  const [dReason, setDReason] = useState("");
  const [mergeFrom, setMergeFrom] = useState("");
  const [mergeInto, setMergeInto] = useState("");

  const upd = (patch) => setMeta((m) => ({ ...m, ...patch }));

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="bg-white border border-[#E4DCC6] rounded-lg p-4">
        <h4 className="font-semibold text-[#1F2A3D] mb-3 flex items-center gap-2 text-sm"><Building2 size={15} /> Project &amp; Unit Master</h4>
        <div className="flex gap-2 mb-3">
          <input value={projName} onChange={(e) => setProjName(e.target.value)} placeholder="New project name" className="flex-1 border border-[#CBBE9C] rounded px-2 py-1.5 text-sm" />
          <button onClick={() => { if (!projName.trim()) return; upd({ projects: [...meta.projects, { id: newId("p"), name: projName.trim(), units: [] }] }); setProjName(""); }} className="bg-[#A87C3F] text-white px-3 rounded text-sm">Add</button>
        </div>
        <div className="flex gap-2 mb-1">
          <select value={unitProjId} onChange={(e) => setUnitProjId(e.target.value)} className="border border-[#CBBE9C] rounded px-2 py-1.5 text-sm">{meta.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <input value={unitNo} onChange={(e) => setUnitNo(e.target.value)} placeholder="Unit number e.g. B-901" className="flex-1 border border-[#CBBE9C] rounded px-2 py-1.5 text-sm" />
          <button onClick={() => {
              const proj = meta.projects.find((p) => p.id === unitProjId);
              const key = unitKey(unitNo);
              if (!unitNo.trim()) return;
              const dupe = proj?.units.find((u) => unitKey(u.number) === key);
              if (dupe) { setUnitError(`"${unitNo}" normalizes the same as existing unit "${dupe.number}" — not added.`); return; }
              upd({ projects: meta.projects.map((p) => p.id === unitProjId ? { ...p, units: [...p.units, { id: newId("un"), number: unitNo.trim() }] } : p) });
              setUnitNo(""); setUnitError("");
            }} className="bg-[#A87C3F] text-white px-3 rounded text-sm">Add</button>
        </div>
        {unitError && <div className="text-xs text-[#A93226] mb-2 flex items-center gap-1"><AlertCircle size={12} />{unitError}</div>}
        <div className="text-[11px] text-[#8C8272] mb-2">Duplicate check ignores spaces, hyphens and slashes.</div>
        <div className="border border-dashed border-[#CBBE9C] rounded-md p-2 mb-3 bg-[#FBF8F0]">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#8C7A4D] mb-1">Bulk import (paste, one unit number per line)</div>
          <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} rows={3} placeholder={"B-904\nB-905\nB-906"} className="w-full border border-[#CBBE9C] rounded px-2 py-1 text-sm bg-white mb-1" />
          <button onClick={() => {
              const proj = meta.projects.find((p) => p.id === unitProjId);
              const existingKeys = new Map(proj.units.map((u) => [unitKey(u.number), u.number]));
              const rows = bulkText.split(/\r?\n|,/).map((r) => r.trim()).filter(Boolean);
              const added = []; const skipped = []; const seenInBatch = new Map();
              rows.forEach((r) => {
                const key = unitKey(r);
                if (existingKeys.has(key)) skipped.push(`${r} — duplicate of existing unit "${existingKeys.get(key)}"`);
                else if (seenInBatch.has(key)) skipped.push(`${r} — duplicate within this list ("${seenInBatch.get(key)}")`);
                else { added.push({ id: newId("un"), number: r }); seenInBatch.set(key, r); }
              });
              if (added.length) upd({ projects: meta.projects.map((p) => p.id === unitProjId ? { ...p, units: [...p.units, ...added] } : p) });
              setBulkResult({ added: added.length, skipped });
              setBulkText("");
            }} className="bg-[#1F2A3D] text-white px-3 py-1.5 rounded text-xs">Import</button>
          {bulkResult && (
            <div className="mt-2 text-xs">
              <div className="text-[#2E6B4F] font-medium">{bulkResult.added} unit(s) added.</div>
              {bulkResult.skipped.length > 0 && <div className="text-[#A93226] mt-1">{bulkResult.skipped.length} skipped:<ul className="list-disc pl-4">{bulkResult.skipped.map((s, i) => <li key={i}>{s}</li>)}</ul></div>}
            </div>
          )}
        </div>
        <div className="space-y-1 max-h-32 overflow-y-auto pr-1 text-sm">
          {meta.projects.map((p) => <div key={p.id}><span className="font-medium">{p.name}</span>: <span className="text-xs text-[#8C8272]">{p.units.map(u => u.number).join(", ") || "no units"}</span></div>)}
        </div>
      </div>

      <div className="bg-white border border-[#E4DCC6] rounded-lg p-4">
        <h4 className="font-semibold text-[#1F2A3D] mb-3 flex items-center gap-2 text-sm"><UsersIcon size={15} /> Users</h4>
        <div className="flex gap-2 mb-3 flex-wrap">
          <input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Name" className="flex-1 min-w-[100px] border border-[#CBBE9C] rounded px-2 py-1.5 text-sm" />
          <select value={userRole} onChange={(e) => setUserRole(e.target.value)} className="border border-[#CBBE9C] rounded px-2 py-1.5 text-sm">{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <button onClick={() => { if (!userName.trim()) return; upd({ users: [...meta.users, { id: newId("u"), name: userName.trim(), role: userRole }] }); setUserName(""); }} className="bg-[#A87C3F] text-white px-3 rounded text-sm">Add</button>
        </div>
        <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
          {meta.users.map((u) => (
            <div key={u.id} className="flex items-center justify-between text-sm border-b border-[#F0EAD9] py-1">
              <span>{u.name} <span className="text-xs text-[#8C8272]">&middot; {ROLES[u.role]}</span></span>
              <button onClick={() => upd({ users: meta.users.filter((x) => x.id !== u.id) })}><Trash2 size={13} className="text-[#A93226]" /></button>
            </div>
          ))}
        </div>
      </div>

      <MasterCard title="Source of Booking Master" icon={ScrollText} items={meta.sourceMaster} fields={[{ key: "name", label: "Source name" }]}
        onAdd={(v) => v.name && upd({ sourceMaster: [...meta.sourceMaster, { id: newId("src"), name: v.name, active: true }] })}
        onToggle={(id) => upd({ sourceMaster: meta.sourceMaster.map((s) => s.id === id ? { ...s, active: !s.active } : s) })} />

      <div className="bg-white border border-[#E4DCC6] rounded-lg p-4">
        <h4 className="font-semibold text-[#1F2A3D] mb-3 flex items-center gap-2 text-sm"><ScrollText size={15} /> Booked By Master</h4>
        <MasterCardInner meta={meta} upd={upd} />
        <div className="mt-3 pt-2 border-t border-[#F0EAD9]">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#8C7A4D] mb-1">Merge duplicate (v1.3)</div>
          <div className="flex gap-2 flex-wrap">
            <select value={mergeFrom} onChange={(e) => setMergeFrom(e.target.value)} className="border border-[#CBBE9C] rounded px-2 py-1 text-xs">
              <option value="">Merge this...</option>
              {meta.bookedByMaster.filter(b => !b.mergedIntoId).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select value={mergeInto} onChange={(e) => setMergeInto(e.target.value)} className="border border-[#CBBE9C] rounded px-2 py-1 text-xs">
              <option value="">...into this</option>
              {meta.bookedByMaster.filter(b => !b.mergedIntoId).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <button onClick={() => {
                if (!mergeFrom || !mergeInto || mergeFrom === mergeInto) return;
                const from = meta.bookedByMaster.find(b => b.id === mergeFrom);
                upd({ bookedByMaster: meta.bookedByMaster.map((b) => b.id === mergeFrom ? { ...b, active: false, mergedIntoId: mergeInto } : b), });
                setMergeFrom(""); setMergeInto("");
              }} className="bg-[#1F2A3D] text-white text-xs px-3 py-1 rounded">Merge</button>
          </div>
          {meta.bookedByMaster.filter(b => b.mergedIntoId).map((b) => (
            <div key={b.id} className="text-[11px] text-[#8C8272] mt-1">"{b.name}" merged into "{meta.bookedByMaster.find(x => x.id === b.mergedIntoId)?.name}" — existing transactions keep pointing at "{b.name}" historically; reports roll it up.</div>
          ))}
        </div>
      </div>

      <MasterCard title="Payment Plan Master" icon={ScrollText} items={meta.paymentPlanMaster} fields={[{ key: "name", label: "Plan name" }]}
        onAdd={(v) => v.name && upd({ paymentPlanMaster: [...meta.paymentPlanMaster, { id: newId("pp"), name: v.name, active: true }] })}
        onToggle={(id) => upd({ paymentPlanMaster: meta.paymentPlanMaster.map((p) => p.id === id ? { ...p, active: !p.active } : p) })} />

      <div className="bg-white border border-[#E4DCC6] rounded-lg p-4">
        <h4 className="font-semibold text-[#1F2A3D] mb-3 flex items-center gap-2 text-sm"><History size={15} /> Workflow Versions (v1.3)</h4>
        <div className="text-xs text-[#8C8272] mb-2">Bumping a version only affects NEW transactions created after this point — anything already in flight stays on its original version.</div>
        {["allocation", "ats", "saledeed"].map((k) => (
          <div key={k} className="flex items-center justify-between text-sm border-b border-[#F0EAD9] py-1.5">
            <span className="capitalize">{k}</span>
            <span className="flex items-center gap-2">
              <StampBadge tone="done">V{meta.workflowVersions[k]}</StampBadge>
              <button onClick={() => onBumpVersion(k)} className="text-xs text-[#A87C3F] border border-[#A87C3F] rounded px-2 py-0.5">Activate V{meta.workflowVersions[k] + 1}</button>
            </span>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#E4DCC6] rounded-lg p-4 md:col-span-2">
        <h4 className="font-semibold text-[#1F2A3D] mb-3 flex items-center gap-2 text-sm"><UserCog2 size={15} /> Delegation</h4>
        <div className="text-xs text-[#8C8272] mb-2">Legal Executive → CRM/Legal Manager · Legal Manager → CRM/CFO · CFO → Management.</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
          <select value={dOrig} onChange={(e) => setDOrig(e.target.value)} className="border border-[#CBBE9C] rounded px-2 py-1.5 text-sm">{meta.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
          <select value={dActing} onChange={(e) => setDActing(e.target.value)} className="border border-[#CBBE9C] rounded px-2 py-1.5 text-sm">{meta.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
          <select value={dNominal} onChange={(e) => setDNominal(e.target.value)} className="border border-[#CBBE9C] rounded px-2 py-1.5 text-sm">{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <select value={dDelegated} onChange={(e) => setDDelegated(e.target.value)} className="border border-[#CBBE9C] rounded px-2 py-1.5 text-sm">{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <input type="date" value={dStart} onChange={(e) => setDStart(e.target.value)} className="border border-[#CBBE9C] rounded px-2 py-1.5 text-sm" />
          <input type="date" value={dEnd} onChange={(e) => setDEnd(e.target.value)} className="border border-[#CBBE9C] rounded px-2 py-1.5 text-sm" />
          <input value={dReason} onChange={(e) => setDReason(e.target.value)} placeholder="Reason" className="border border-[#CBBE9C] rounded px-2 py-1.5 text-sm" />
        </div>
        <button onClick={() => {
            if (!dReason.trim()) return;
            if (dStart > dEnd) { alert("Start date must be on or before end date."); return; }
            if (dOrig === dActing) { alert("Original user and acting user cannot be the same person."); return; }
            upd({ delegations: [...meta.delegations, { id: newId("del"), originalUserId: dOrig, actingUserId: dActing, nominalRole: dNominal, delegatedRole: dDelegated, startDate: dStart, endDate: dEnd, reason: dReason, active: true }] }); setDReason("");
          }} className="bg-[#A87C3F] text-white px-3 py-1.5 rounded text-sm">Create Delegation</button>
        <div className="mt-3 space-y-1 max-h-32 overflow-y-auto pr-1">
          {meta.delegations.map((d) => (
            <div key={d.id} className="text-xs flex items-center justify-between border-b border-[#F0EAD9] py-1">
              <span>{meta.users.find(u => u.id === d.actingUserId)?.name} acts as {ROLES[d.nominalRole]} ({d.startDate} → {d.endDate}) — {d.reason}</span>
              <button onClick={() => upd({ delegations: meta.delegations.map((x) => x.id === d.id ? { ...x, active: !x.active } : x) })} className="text-[#A87C3F]">{d.active ? "Revoke" : "Reactivate"}</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MasterCardInner({ meta, upd }) {
  const [name, setName] = useState(""); const [type, setType] = useState("Employee");
  return (
    <div className="flex gap-2 mb-2 flex-wrap">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="flex-1 min-w-[100px] border border-[#CBBE9C] rounded px-2 py-1.5 text-sm" />
      <select value={type} onChange={(e) => setType(e.target.value)} className="border border-[#CBBE9C] rounded px-2 py-1.5 text-sm">
        {["Employee", "Agent", "Channel Partner", "Other"].map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <button onClick={() => {
          if (!name.trim()) return;
          const key = unitKey(name);
          const dupe = meta.bookedByMaster.find((b) => !b.mergedIntoId && unitKey(b.name) === key && b.type === type);
          if (dupe) { alert(`Possible duplicate of existing "${dupe.name}" — create anyway if this is genuinely a different person, or use Merge below if not.`); }
          upd({ bookedByMaster: [...meta.bookedByMaster, { id: newId("bb"), name: name.trim(), type, active: true, mergedIntoId: null }] });
          setName("");
        }} className="bg-[#A87C3F] text-white px-3 rounded text-sm">Add</button>
      <div className="w-full space-y-1 max-h-32 overflow-y-auto pr-1">
        {meta.bookedByMaster.filter(b => !b.mergedIntoId).map((it) => (
          <div key={it.id} className="flex items-center justify-between text-sm border-b border-[#F0EAD9] py-1">
            <span className={it.active === false ? "line-through text-[#8C8272]" : ""}>{it.name} · {it.type}</span>
            <button onClick={() => upd({ bookedByMaster: meta.bookedByMaster.map((b) => b.id === it.id ? { ...b, active: !b.active } : b) })} className="text-xs text-[#A87C3F]">{it.active === false ? "Activate" : "Deactivate"}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [selectedKey, setSelectedKey] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [detailTab, setDetailTab] = useState("allocation");
  const [showHistorical, setShowHistorical] = useState(false);
  const [reportKey, setReportKey] = useState("financial-exception");

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY, false);
        if (res?.value) { const p = JSON.parse(res.value); setData(p); setCurrentUserId(p.users[0]?.id); }
        else { const s = seedData(); setData(s); setCurrentUserId(s.users[0]?.id); await window.storage.set(STORAGE_KEY, JSON.stringify(s), false); }
      } catch { const s = seedData(); setData(s); setCurrentUserId(s.users[0]?.id); }
      finally { setLoading(false); }
    })();
  }, []);

  async function persist(next) { setData(next); try { await window.storage.set(STORAGE_KEY, JSON.stringify(next), false); } catch {} }
  const setMeta = (patch) => setData((prev) => { const next = { ...prev, ...(typeof patch === "function" ? patch(prev) : patch) }; persist(next); return next; });

  if (loading || !data) return <div className="min-h-screen flex items-center justify-center bg-[#F4EEE0] text-[#1F2A3D]">Loading ledger&hellip;</div>;

  const currentUser = data.users.find((u) => u.id === currentUserId) || data.users[0];
  const meta = data;

  function pushAudit(next, entry) { next.auditLog = [{ id: newId("aud"), timestamp: Date.now(), ...entry }, ...next.auditLog]; }
  function pushNotif(next, entry) { next.notifications = [{ id: newId("ntf"), createdAt: Date.now(), read: false, ...entry }, ...next.notifications]; }

  function createAllocation(payload, extra = {}) {
    const id = newId("txn");
    const logEntry = { actor: { name: currentUser.name }, nominalRole: "CRM", actualRole: currentUser.role, action: "SUBMIT", timestamp: Date.now(), remark: payload.remark, data: { clientConfirmationForm: payload.ccf, kyc: payload.kyc } };
    const financials = Object.fromEntries(["basicAmount", "gst", "runningMaintenance", "maintenanceDeposit", "stampDuty", "legalFees", "png", "tds"].map((k) => [k, Number(payload.fin[k]) || 0]));
    // v1.3.2: Cancellation+Rebooking link — purely a navigation/reporting pointer to the most
    // recent CANCELLED transaction on this unit, if any. NEVER used to copy financial values —
    // see §1.9d. Deliberately separate from source_transaction_id (Unit Change only, §1.9c).
    const priorCancelled = !extra.sourceTransactionId
      ? Object.values(data.records).filter((r) => r.unitId === payload.unitId && r.lifecycleStatus === "CANCELLED").sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0]
      : null;
    const record = {
      id, projectId: payload.projectId, unitId: payload.unitId, clientName: payload.clientName, customerChangeRequests: [],
      saleDeedValue: payload.saleDeedValue, onboardingDate: payload.onboardingDate, clientConfirmationDate: payload.clientConfirmationDate,
      sourceId: payload.sourceId, bookedById: payload.bookedById, bookingRemark: payload.bookingRemark, paymentPlanId: payload.paymentPlanId,
      isDirectSaleDeed: payload.isDirect, directSaleDeedRemark: payload.directRemark,
      lifecycleStatus: "ACTIVE", sourceTransactionId: extra.sourceTransactionId || null, sourceChangeType: extra.sourceChangeType || null,
      previousCancelledTransactionId: priorCancelled ? priorCancelled.id : null,
      workflowVersionAtCreation: { ...data.workflowVersions },
      financials: { ...financials, locked: false, lockedAt: null, lockedBy: null },
      allocation: { currentStep: 1, log: [logEntry] }, ats: null, saledeed: null,
      financialExceptions: [], cancellation: null, unitChangeRequest: null, reopens: [],
      custodyLog: { ats: [], saledeed: [] }, internalComments: [], documents: [],
      createdAt: Date.now(),
    };
    const next = { ...data, records: { ...data.records, [id]: record } };
    pushAudit(next, { txKey: id, workflowType: "ALLOCATION", stage: "crm_fill", action: "SUBMIT", actor: currentUser.name, nominalRole: "CRM", actualRole: currentUser.role, remark: payload.remark });
    if (payload.isDirect) pushNotif(next, { toRoles: ["MANAGEMENT"], type: "MANAGEMENT_EXCEPTION", message: `Direct Sale Deed case flagged for ${payload.clientName} — ${payload.directRemark}`, txKey: id });
    if (priorCancelled) pushNotif(next, { toRoles: ["MANAGEMENT"], type: "REBOOKING", message: `Unit rebooked — previous transaction on this unit (${priorCancelled.clientName}, ₹${priorCancelled.saleDeedValue}) was cancelled. New Sale Deed Value: ₹${payload.saleDeedValue}.`, txKey: id });
    persist(next); setShowNew(false); setSelectedKey(id); setTab("units"); setDetailTab("allocation");
    return id;
  }

  function submitStage(workflowKey, stageIndex, formData, remark, viaDelegation, isSendBack = false) {
    if (!selectedKey) return;
    const rec = data.records[selectedKey];
    const stages = workflowKey === "allocation" ? ALLOCATION_STAGES : workflowKey === "ats" ? ATS_STAGES : SALEDEED_STAGES;
    const stage = stages[stageIndex];
    const wf = rec[workflowKey] || { currentStep: 0, log: [] };
    const nominalRole = stage.requiredRole;
    const actualRole = currentUser.role;
    const logEntry = { actor: { name: currentUser.name }, nominalRole, actualRole, action: isSendBack ? "SEND_BACK" : "APPROVE", timestamp: Date.now(), remark, data: formData };
    const newLog = [...(wf.log || [])];
    let newStep = stageIndex + (isSendBack ? 0 : 1);
    if (isSendBack) newStep = Math.max(0, stageIndex - 1);
    newLog[stageIndex] = isSendBack ? undefined : logEntry;
    const trimmedLog = isSendBack ? newLog.slice(0, stageIndex) : newLog;
    const newWf = { currentStep: newStep, log: trimmedLog };
    let updatedRec = { ...rec, [workflowKey]: newWf };

    const next = { ...data };
    pushAudit(next, { txKey: selectedKey, workflowType: workflowKey.toUpperCase(), stage: stage.id, action: isSendBack ? "SEND_BACK" : "APPROVE", actor: currentUser.name, nominalRole, actualRole, remark, viaDelegation: viaDelegation?.id || null });

    if (isSendBack) {
      pushNotif(next, { toRoles: ["CRM"], type: "SEND_BACK", message: `${ROLES[nominalRole]} sent back "${stage.label}" — ${remark}`, txKey: selectedKey });
    } else {
      if (workflowKey === "allocation" && newStep >= ALLOCATION_STAGES.length) {
        updatedRec.financials = { ...updatedRec.financials, locked: true, lockedAt: Date.now(), lockedBy: currentUser.name };
        if (updatedRec.isDirectSaleDeed) { updatedRec.ats = { skipped: true, remark: updatedRec.directSaleDeedRemark }; updatedRec.saledeed = { currentStep: 0, log: [] }; }
        else { updatedRec.ats = { currentStep: 0, log: [] }; updatedRec.saledeed = null; }
      }
      if (workflowKey === "ats" && newStep >= ATS_STAGES.length) { updatedRec.saledeed = { currentStep: 0, log: [] }; }
      // v1.3.2: a physical document gets its identity the moment it's printed — not only once
      // scanned. Auto-create a documents row (ATS_PRINT / SALE_DEED_PRINT) here so custody
      // transfers from this point forward always reference a real document, per §1.4.
      if (stage.id === "legal_exec_print") {
        const doc = { id: newId("doc"), workflowType: workflowKey, type: workflowKey === "ats" ? "ATS_PRINT" : "SALE_DEED_PRINT", label: workflowKey === "ats" ? "ATS print" : "Sale Deed print", driveFileId: null, physicalDocumentId: null, createdAt: Date.now() };
        updatedRec.documents = [...(updatedRec.documents || []), doc];
      }
      // v1.3.2: scanning creates a NEW documents row (the digital, Drive-versioned record) linked
      // back to the physical print row via physicalDocumentId — the print row itself is untouched.
      if (stage.id === "admin_scan" && formData.scanned) {
        const printDoc = (updatedRec.documents || []).find((d) => d.workflowType === workflowKey && d.type === (workflowKey === "ats" ? "ATS_PRINT" : "SALE_DEED_PRINT"));
        const scanDoc = { id: newId("doc"), workflowType: workflowKey, type: workflowKey === "ats" ? "ATS_SCAN" : "SALE_DEED_SCAN", label: workflowKey === "ats" ? "ATS scan" : "Sale Deed scan", driveFileId: `${workflowKey}_scan_${Date.now()}.pdf`, physicalDocumentId: printDoc ? printDoc.id : null, createdAt: Date.now() };
        updatedRec.documents = [...(updatedRec.documents || []), scanDoc];
      }
      if (workflowKey === "saledeed" && stage.id === "cfo_receipt_check") {
        const newExceptions = [];
        [...FIN_COMPONENTS, { key: "tds", label: "TDS" }].forEach((c) => {
          if (!formData[c.key]) newExceptions.push({ id: newId("fx"), workflowType: "SALE_DEED", component: c.key, label: c.label, amount: updatedRec.financials[c.key], status: "OPEN", createdAt: Date.now() });
        });
        if (newExceptions.length) {
          updatedRec.financialExceptions = [...updatedRec.financialExceptions, ...newExceptions];
          pushNotif(next, { toRoles: ["CFO", "MANAGEMENT", "CRM"], type: "FINANCIAL_EXCEPTION", message: `CFO approved Sale Deed with ${newExceptions.length} item(s) pending: ${newExceptions.map(e => e.label).join(", ")}`, txKey: selectedKey });
        }
      }
      if (workflowKey === "saledeed" && stage.id === "admin_scan") {
        const openEx = updatedRec.financialExceptions.filter((e) => e.status === "OPEN");
        if (openEx.length) pushNotif(next, { toRoles: ["CFO", "MANAGEMENT", "CRM"], type: "POST_SCAN_ALERT", message: `Sale Deed executed/registered/scanned, but ${openEx.length} financial receipt(s) remain unconfirmed.`, txKey: selectedKey });
      }
    }
    next.records = { ...data.records, [selectedKey]: updatedRec };
    persist(next);
  }

  function managementSkip(workflowKey, stageIndex, remark) {
    if (!selectedKey) return;
    const rec = data.records[selectedKey];
    const stages = SALEDEED_STAGES;
    const stage = stages[stageIndex];
    const wf = rec[workflowKey];
    const logEntry = { actor: { name: currentUser.name }, nominalRole: stage.requiredRole, actualRole: currentUser.role, action: "MANAGEMENT_SKIP", timestamp: Date.now(), remark, data: { indexII: "skipped", certifiedCopy: "skipped" } };
    const newLog = [...(wf.log || [])]; newLog[stageIndex] = logEntry;
    const updatedRec = { ...rec, [workflowKey]: { currentStep: stageIndex + 1, log: newLog } };
    const next = { ...data, records: { ...data.records, [selectedKey]: updatedRec } };
    pushAudit(next, { txKey: selectedKey, workflowType: "SALE_DEED", stage: stage.id, action: "MANAGEMENT_SKIP", actor: currentUser.name, nominalRole: stage.requiredRole, actualRole: currentUser.role, remark });
    pushNotif(next, { toRoles: ["MANAGEMENT"], type: "MANAGEMENT_EXCEPTION", message: `Index II/Certified Copy download skipped by Management — ${remark}`, txKey: selectedKey });
    persist(next);
  }

  function resolveException(txKey, exId) {
    const rec = data.records[txKey];
    const updated = { ...rec, financialExceptions: rec.financialExceptions.map((e) => e.id === exId ? { ...e, status: "RESOLVED", resolvedAt: Date.now(), resolvedBy: currentUser.name } : e) };
    const next = { ...data, records: { ...data.records, [txKey]: updated } };
    pushAudit(next, { txKey, workflowType: "SALE_DEED", stage: "financial_exception", action: "RESOLVE", actor: currentUser.name, nominalRole: "CFO", actualRole: currentUser.role, remark: "Receipt confirmed" });
    persist(next);
  }

  function superAdminEditFinancial(txKey, field, newValue, reason) {
    const rec = data.records[txKey];
    const oldValue = rec.financials[field];
    const updated = { ...rec, financials: { ...rec.financials, [field]: Number(newValue) } };
    const next = { ...data, records: { ...data.records, [txKey]: updated } };
    pushAudit(next, { txKey, workflowType: "FINANCIAL", stage: field, action: "SUPER_ADMIN_CHANGE", actor: currentUser.name, nominalRole: "SUPERADMIN", actualRole: currentUser.role, remark: `${reason} (old: ${oldValue}, new: ${newValue})` });
    pushNotif(next, { toRoles: ["CFO", "MANAGEMENT"], type: "SUPER_ADMIN_CHANGE", message: `Super Admin changed ${field} from ${oldValue} to ${newValue} — ${reason}`, txKey });
    persist(next);
  }

  function reopenWorkflow(txKey, workflowKey) {
    const rec = data.records[txKey];
    const stages = workflowKey === "allocation" ? ALLOCATION_STAGES : workflowKey === "ats" ? ATS_STAGES : SALEDEED_STAGES;
    const reason = prompt("Reason for reopening this completed workflow:");
    if (!reason) return;
    const updated = { ...rec, [workflowKey]: { currentStep: stages.length - 1, log: rec[workflowKey].log.slice(0, stages.length - 1) }, reopens: [...rec.reopens, { workflowKey, reason, by: currentUser.name, at: Date.now() }] };
    const next = { ...data, records: { ...data.records, [txKey]: updated } };
    pushAudit(next, { txKey, workflowType: workflowKey.toUpperCase(), stage: "reopen", action: "REOPEN", actor: currentUser.name, nominalRole: "SUPERADMIN", actualRole: currentUser.role, remark: reason });
    pushNotif(next, { toRoles: ["MANAGEMENT"], type: "REOPEN", message: `Workflow reopened (${workflowKey}) by Super Admin — ${reason}`, txKey });
    persist(next);
  }

  // v1.3: Cancellation now sets lifecycleStatus, not a bare boolean
  function requestCancellation(txKey, form) {
    const rec = data.records[txKey];
    const updated = { ...rec, cancellation: { ...form, requestedBy: currentUser.name, status: "PENDING", cfoApproved: !form.financialImplications, mgmtApproved: false } };
    const next = { ...data, records: { ...data.records, [txKey]: updated } };
    pushAudit(next, { txKey, workflowType: "CANCELLATION", stage: "request", action: "SUBMIT", actor: currentUser.name, nominalRole: "CRM", actualRole: currentUser.role, remark: form.reason });
    pushNotif(next, { toRoles: form.financialImplications ? ["CFO", "MANAGEMENT"] : ["MANAGEMENT"], type: "CANCELLATION", message: `Cancellation requested for unit — ${form.reason}`, txKey });
    persist(next);
  }

  function actOnCancellation(txKey, approve) {
    const rec = data.records[txKey];
    let c = { ...rec.cancellation };
    if (!c.cfoApproved && currentUser.role === "CFO") c.cfoApproved = approve;
    else if (currentUser.role === "MANAGEMENT" && c.cfoApproved) c.mgmtApproved = approve;
    if (!approve) c.status = "REJECTED_SEND_BACK";
    const fullyApproved = c.cfoApproved && c.mgmtApproved;
    if (fullyApproved) c.status = "APPROVED";
    const updated = { ...rec, cancellation: c, lifecycleStatus: fullyApproved ? "CANCELLED" : rec.lifecycleStatus };
    const next = { ...data, records: { ...data.records, [txKey]: updated } };
    pushAudit(next, { txKey, workflowType: "CANCELLATION", stage: "approval", action: approve ? "APPROVE" : "SEND_BACK", actor: currentUser.name, nominalRole: currentUser.role, actualRole: currentUser.role, remark: fullyApproved ? "Cancellation finalized — transaction CANCELLED, unit now available" : "" });
    if (fullyApproved) pushNotif(next, { toRoles: ["CRM", "MANAGEMENT"], type: "CANCELLATION", message: `Transaction cancelled — unit is now available for a new allocation.`, txKey });
    persist(next);
  }

  // v1.3.1: request → approve → new transaction created. The old transaction is historically
  // preserved — its unit_id, booking/financial baseline, documents, and workflow/audit history
  // are never overwritten or reassigned. Only its lifecycle status changes, ACTIVE → SUPERSEDED.
  function requestUnitChange(txKey, newUnitId, reason) {
    const rec = data.records[txKey];
    const request = { id: newId("uc"), oldTransactionId: txKey, oldUnitId: rec.unitId, newUnitId, reason, requestedBy: currentUser.name, requestDate: today(), status: "PENDING", newTransactionId: null };
    const updated = { ...rec, unitChangeRequest: request };
    const next = { ...data, records: { ...data.records, [txKey]: updated } };
    pushAudit(next, { txKey, workflowType: "UNIT_CHANGE", stage: "request", action: "SUBMIT", actor: currentUser.name, nominalRole: "CRM", actualRole: currentUser.role, remark: reason });
    pushNotif(next, { toRoles: ["MANAGEMENT"], type: "UNIT_CHANGE", message: `Unit Change requested by ${currentUser.name} — ${reason}`, txKey });
    persist(next);
  }

  // v1.3.1: explicit business validation before creating the new transaction — not just relying
  // on the partial-unique-index insert failure to catch a stale/unavailable unit.
  function approveUnitChange(txKey) {
    const rec = data.records[txKey];
    const req = rec.unitChangeRequest;
    if (rec.lifecycleStatus !== "ACTIVE") { alert("Cannot approve: the old transaction is no longer ACTIVE (it may already have been cancelled)."); return; }
    if (!req || req.status !== "PENDING") { alert("Cannot approve: this request is no longer PENDING."); return; }
    const project = data.projects.find((p) => p.id === rec.projectId);
    const newUnitExists = project?.units.some((u) => u.id === req.newUnitId);
    if (!newUnitExists) { alert("Cannot approve: the proposed unit no longer exists."); return; }
    if (unitHasActiveTxn(data.records, req.newUnitId)) { alert("Selected unit is no longer available — it now has an active transaction. Send this request back to CRM to pick a different unit."); return; }
    const newTxnId = newId("txn");
    const newRecord = {
      ...rec, id: newTxnId, unitId: req.newUnitId, lifecycleStatus: "ACTIVE",
      sourceTransactionId: txKey, sourceChangeType: "UNIT_CHANGE",
      unitChangeRequest: null, customerChangeRequests: [], financialExceptions: [], cancellation: null,
      custodyLog: { ats: [], saledeed: [] }, internalComments: [], documents: [], previousCancelledTransactionId: null, reopens: [], createdAt: Date.now(),
      allocation: { currentStep: ALLOCATION_STAGES.length, log: [...rec.allocation.log,
        { actor: { name: currentUser.name }, nominalRole: "MANAGEMENT", actualRole: currentUser.role, action: "APPROVE", timestamp: Date.now(), remark: "Carried forward via approved Unit Change — allocation not re-run", data: {} }] },
      ats: rec.isDirectSaleDeed ? { skipped: true, remark: rec.directSaleDeedRemark } : { currentStep: 0, log: [] },
      saledeed: rec.isDirectSaleDeed ? { currentStep: 0, log: [] } : null,
    };
    const oldUpdated = { ...rec, lifecycleStatus: "SUPERSEDED", unitChangeRequest: { ...req, status: "APPROVED", newTransactionId: newTxnId } };
    const next = { ...data, records: { ...data.records, [txKey]: oldUpdated, [newTxnId]: newRecord } };
    pushAudit(next, { txKey, workflowType: "UNIT_CHANGE", stage: "approval", action: "APPROVE", actor: currentUser.name, nominalRole: "MANAGEMENT", actualRole: currentUser.role, remark: `New transaction ${newTxnId} created; this one is now SUPERSEDED (unit_id unchanged, permanent history)` });
    pushNotif(next, { toRoles: ["CRM"], type: "UNIT_CHANGE", message: `Unit Change approved — new transaction created on the new unit.`, txKey: newTxnId });
    persist(next);
    setSelectedKey(newTxnId);
  }

  // v1.3: request/approve, with full history retained on the request row itself
  function requestCustomerChange(txKey, proposedName, reason) {
    const rec = data.records[txKey];
    const request = { id: newId("cc"), existingCustomerName: rec.clientName, proposedCustomerName: proposedName, reason, requestedBy: currentUser.name, requestDate: today(), status: "PENDING", approvedCustomerName: null, approvedBy: null, approvedAt: null };
    const updated = { ...rec, customerChangeRequests: [...rec.customerChangeRequests, request] };
    const next = { ...data, records: { ...data.records, [txKey]: updated } };
    pushAudit(next, { txKey, workflowType: "CUSTOMER_CHANGE", stage: "request", action: "SUBMIT", actor: currentUser.name, nominalRole: "CRM", actualRole: currentUser.role, remark: reason });
    pushNotif(next, { toRoles: ["MANAGEMENT"], type: "CUSTOMER_CHANGE", message: `Customer Change requested by ${currentUser.name}: ${rec.clientName} → ${proposedName} — ${reason}`, txKey });
    persist(next);
  }

  function approveCustomerChange(txKey, reqId) {
    const rec = data.records[txKey];
    const updatedRequests = rec.customerChangeRequests.map((r) => r.id === reqId
      ? { ...r, status: "APPROVED", approvedCustomerName: r.proposedCustomerName, approvedBy: currentUser.name, approvedAt: Date.now() } : r);
    const approvedName = updatedRequests.find((r) => r.id === reqId).approvedCustomerName;
    const updated = { ...rec, customerChangeRequests: updatedRequests, clientName: approvedName };
    const next = { ...data, records: { ...data.records, [txKey]: updated } };
    pushAudit(next, { txKey, workflowType: "CUSTOMER_CHANGE", stage: "approval", action: "APPROVE", actor: currentUser.name, nominalRole: "MANAGEMENT", actualRole: currentUser.role, remark: `Current customer now "${approvedName}"; full history retained on the request row` });
    persist(next);
  }

  function transferCustody(txKey, workflowType, documentId, toRole, toName, remark) {
    const rec = data.records[txKey];
    const log = rec.custodyLog?.[workflowType] || [];
    const lastForDoc = [...log].reverse().find((c) => c.documentId === documentId);
    const doc = (rec.documents || []).find((d) => d.id === documentId);
    const entry = { documentId, fromLabel: lastForDoc ? (lastForDoc.toName || ROLES[lastForDoc.toRole]) : "Legal Executive (print)", toRole, toName, remark, by: currentUser.name, at: Date.now() };
    const updated = { ...rec, custodyLog: { ...rec.custodyLog, [workflowType]: [...log, entry] } };
    const next = { ...data, records: { ...data.records, [txKey]: updated } };
    pushAudit(next, { txKey, workflowType: workflowType.toUpperCase(), stage: "physical_custody", action: "TRANSFER", actor: currentUser.name, nominalRole: currentUser.role, actualRole: currentUser.role, remark: `${doc?.label || documentId}: ${entry.fromLabel} → ${toName || ROLES[toRole]}${remark ? " — " + remark : ""}` });
    persist(next);
  }

  // v1.3.1 fix: @mentions now resolve against the user master and notify ONLY the specific
  // mentioned user(s) — v1.3's prototype incorrectly broadcast to every role. Notifications gain
  // an optional toUserIds field alongside the existing toRoles (used everywhere else); the
  // Notifications tab matches on either.
  function addComment(txKey, message) {
    const rec = data.records[txKey];
    const updated = { ...rec, internalComments: [...(rec.internalComments || []), { id: newId("cm"), userName: currentUser.name, message, at: Date.now() }] };
    const next = { ...data, records: { ...data.records, [txKey]: updated } };
    const mentionTokens = (message.match(/@(\w+)/g) || []).map((m) => m.slice(1).toLowerCase());
    const resolvedUsers = data.users.filter((u) => mentionTokens.some((t) => u.name.toLowerCase().split(" ")[0] === t || u.name.toLowerCase().replace(/\s/g, "") === t));
    const unresolved = mentionTokens.filter((t) => !data.users.some((u) => u.name.toLowerCase().split(" ")[0] === t || u.name.toLowerCase().replace(/\s/g, "") === t));
    if (resolvedUsers.length) pushNotif(next, { toRoles: [], toUserIds: resolvedUsers.map((u) => u.id), type: "MENTION", message: `${currentUser.name} mentioned you: "${message}"`, txKey });
    if (unresolved.length) pushNotif(next, { toRoles: ["SUPERADMIN"], type: "MENTION", message: `@${unresolved.join(", @")} in a comment did not match any user — "${message}"`, txKey });
    persist(next);
  }

  function bumpWorkflowVersion(key) {
    const next = { ...data, workflowVersions: { ...data.workflowVersions, [key]: data.workflowVersions[key] + 1 } };
    pushAudit(next, { txKey: null, workflowType: key.toUpperCase(), stage: "version", action: "VERSION_ACTIVATED", actor: currentUser.name, nominalRole: "SUPERADMIN", actualRole: currentUser.role, remark: `V${data.workflowVersions[key] + 1} activated — new transactions only; existing stay on their version` });
    persist(next);
  }

  const recordsList = Object.values(data.records).map((rec) => {
    const project = data.projects.find((p) => p.id === rec.projectId);
    const unit = project?.units.find((u) => u.id === rec.unitId);
    return { key: rec.id, rec, projectName: project?.name || "?", unitNumber: unit?.number || "?" };
  }).sort((a, b) => (b.rec.createdAt || 0) - (a.rec.createdAt || 0));
  const activeRecordsList = recordsList.filter(({ rec }) => rec.lifecycleStatus === "ACTIVE");
  const visibleRecordsList = showHistorical ? recordsList : activeRecordsList;

  function stageLabel(wf, stages) { if (!wf) return "Not started"; if (wf.skipped) return "Skipped — Direct Sale Deed"; if (wf.currentStep >= stages.length) return "Complete"; return `${wf.currentStep + 1}/${stages.length}: ${stages[wf.currentStep].label}`; }
  function stageTone(wf, stages) { if (!wf) return "idle"; if (wf.skipped) return "warn"; if (wf.currentStep >= stages.length) return "done"; return "pending"; }
  function financialStatus(rec) {
    const open = rec.financialExceptions.filter((e) => e.status === "OPEN");
    if (!rec.saledeed || rec.saledeed.currentStep < 4) return { label: "N/A", tone: "idle" };
    if (open.length) return { label: `${open.length} Pending`, tone: "warn" };
    return { label: "Complete", tone: "done" };
  }
  function overallStatus(rec) {
    if (rec.lifecycleStatus === "CANCELLED") return { label: "Cancelled", tone: "idle" };
    if (rec.lifecycleStatus === "SUPERSEDED") return { label: "Superseded", tone: "idle" };
    const sdComplete = rec.saledeed && rec.saledeed.currentStep >= SALEDEED_STAGES.length;
    const openEx = rec.financialExceptions.some((e) => e.status === "OPEN");
    if (sdComplete && !openEx) return { label: "Closed", tone: "done" };
    if (sdComplete && openEx) return { label: "Attention Required", tone: "warn" };
    return { label: "In Progress", tone: "pending" };
  }

  const myTasks = activeRecordsList.flatMap(({ key, rec, projectName, unitNumber }) => {
    const items = [];
    [["allocation", ALLOCATION_STAGES], ["ats", ATS_STAGES], ["saledeed", SALEDEED_STAGES]].forEach(([wk, stages]) => {
      const wf = rec[wk];
      if (wf && !wf.skipped && wf.currentStep < stages.length) {
        const stage = stages[wf.currentStep];
        const acting = canActOnStage(stage, currentUser, meta.delegations);
        if (acting.can) items.push({ key, projectName, unitNumber, workflow: wk, stage });
      }
    });
    return items;
  });
  const openExceptions = activeRecordsList.flatMap(({ key, rec, projectName, unitNumber }) => rec.financialExceptions.filter((e) => e.status === "OPEN").map((e) => ({ ...e, key, projectName, unitNumber })));
  function notifiesCurrentUser(n) { return (n.toRoles || []).includes(currentUser.role) || (n.toUserIds || []).includes(currentUser.id); }
  const unreadNotifs = data.notifications.filter((n) => notifiesCurrentUser(n) && !n.read).length;

  const selected = selectedKey ? data.records[selectedKey] : null;
  const selProject = selected ? data.projects.find((p) => p.id === selected.projectId) : null;
  const selUnit = selected ? selProject?.units.find((u) => u.id === selected.unitId) : null;
  const unitHistory = selected ? recordsList.filter((r) => r.rec.unitId === selected.unitId).sort((a, b) => (a.rec.createdAt || 0) - (b.rec.createdAt || 0)) : [];

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "findash", label: "Financial Dashboard", icon: Wallet },
    { id: "units", label: "Units", icon: Building2 },
    { id: "mytasks", label: "My Tasks", icon: CheckCircle2, badge: myTasks.length },
    { id: "exceptions", label: "Financial Exceptions", icon: AlertTriangle, badge: openExceptions.length },
    { id: "reports", label: "Reports", icon: FileBarChart },
    { id: "notifications", label: "Notifications", icon: Bell, badge: unreadNotifs },
    { id: "audit", label: "Audit Trail", icon: ScrollText },
    { id: "setup", label: "Setup", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-[#F4EEE0] text-[#1F2A3D]" style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <div className="flex flex-col md:flex-row min-h-screen">
        <div className="md:w-56 bg-[#1F2A3D] text-[#F4EEE0] p-4 flex md:flex-col justify-between md:justify-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Stamp size={20} />
              <div><div className="font-bold text-sm tracking-wide" style={{ fontFamily: "Georgia, serif" }}>Registry Desk</div><div className="text-[10px] text-[#B9AE8E] uppercase tracking-widest">Doc Workflow v1.3</div></div>
            </div>
            <nav className="flex md:flex-col gap-1 flex-wrap">
              {navItems.map((n) => (
                <button key={n.id} onClick={() => { setTab(n.id); setSelectedKey(null); }} className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition ${tab === n.id ? "bg-[#A87C3F] text-white" : "hover:bg-[#2c3b56] text-[#E4DCC6]"}`}>
                  <n.icon size={15} /> {n.label}{!!n.badge && <span className="ml-auto bg-[#A93226] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{n.badge}</span>}
                </button>
              ))}
            </nav>
          </div>
          <div className="mt-auto">
            <div className="text-[10px] uppercase tracking-widest text-[#B9AE8E] mb-1">Viewing as</div>
            <select value={currentUserId} onChange={(e) => setCurrentUserId(e.target.value)} className="w-full bg-[#2c3b56] border border-[#3d4f70] rounded px-2 py-1.5 text-sm text-white">
              {data.users.map((u) => <option key={u.id} value={u.id}>{u.name} &middot; {ROLES[u.role]}</option>)}
            </select>
          </div>
        </div>

        <div className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {tab === "dashboard" && (
            <div>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-lg font-bold" style={{ fontFamily: "Georgia, serif" }}>Project-wise Document Status</h2>
                {currentUser.role === "CRM" && <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 bg-[#A87C3F] text-white text-sm px-3 py-1.5 rounded"><Plus size={15} /> New Allocation</button>}
              </div>
              <div className="bg-white border border-[#E4DCC6] rounded-lg overflow-hidden overflow-x-auto">
                <table className="w-full text-sm min-w-[820px]">
                  <thead><tr className="bg-[#EFE7D3] text-left text-[11px] uppercase tracking-wide text-[#5B5340]">
                    <th className="px-3 py-2">Project</th><th className="px-3 py-2">Unit</th><th className="px-3 py-2">Client</th>
                    <th className="px-3 py-2">Allocation</th><th className="px-3 py-2">ATS</th><th className="px-3 py-2">Sale Deed</th>
                    <th className="px-3 py-2">Financial</th><th className="px-3 py-2">Overall</th>
                  </tr></thead>
                  <tbody>
                    {activeRecordsList.length === 0 && <tr><td colSpan={8} className="px-3 py-6 text-center text-[#8C8272]">No active units allotted yet.</td></tr>}
                    {activeRecordsList.map(({ key, rec, projectName, unitNumber }) => {
                      const fin = financialStatus(rec); const overall = overallStatus(rec);
                      return (
                        <tr key={key} className="border-t border-[#F0EAD9] hover:bg-[#FBF8F0] cursor-pointer" onClick={() => { setSelectedKey(key); setTab("units"); setDetailTab("allocation"); }}>
                          <td className="px-3 py-2">{projectName}</td><td className="px-3 py-2 font-medium">{unitNumber}</td><td className="px-3 py-2">{rec.clientName}</td>
                          <td className="px-3 py-2"><StampBadge tone={stageTone(rec.allocation, ALLOCATION_STAGES)}>{stageLabel(rec.allocation, ALLOCATION_STAGES)}</StampBadge></td>
                          <td className="px-3 py-2"><StampBadge tone={stageTone(rec.ats, ATS_STAGES)}>{stageLabel(rec.ats, ATS_STAGES)}</StampBadge></td>
                          <td className="px-3 py-2"><StampBadge tone={stageTone(rec.saledeed, SALEDEED_STAGES)}>{stageLabel(rec.saledeed, SALEDEED_STAGES)}</StampBadge></td>
                          <td className="px-3 py-2"><StampBadge tone={fin.tone}>{fin.label}</StampBadge></td>
                          <td className="px-3 py-2"><StampBadge tone={overall.tone}>{overall.label}</StampBadge></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "findash" && (
            <div>
              <h2 className="text-lg font-bold mb-1" style={{ fontFamily: "Georgia, serif" }}>Financial Management Dashboard</h2>
              <div className="text-xs text-[#8C8272] mb-4">Independent of document/workflow status — a fully registered, scanned, handed-over Sale Deed can still show pending amounts here.</div>
              <div className="flex gap-2 flex-wrap mb-4">
                <div className="bg-white border border-[#E4DCC6] rounded-lg px-4 py-3"><div className="text-xs text-[#8C8272]">Sale Deeds Completed</div><div className="text-xl font-bold">{activeRecordsList.filter(r => r.rec.saledeed && r.rec.saledeed.currentStep >= SALEDEED_STAGES.length).length}</div></div>
                <div className="bg-white border border-[#E4DCC6] rounded-lg px-4 py-3"><div className="text-xs text-[#8C8272]">With Open Exceptions</div><div className="text-xl font-bold">{new Set(openExceptions.map(e => e.key)).size}</div></div>
                <div className="bg-white border border-[#E4DCC6] rounded-lg px-4 py-3"><div className="text-xs text-[#8C8272]">Total Pending Amount</div><div className="text-xl font-bold">₹{openExceptions.reduce((s, e) => s + (Number(e.amount) || 0), 0).toLocaleString()}</div></div>
              </div>
              <div className="bg-white border border-[#E4DCC6] rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-[#EFE7D3] text-left text-[11px] uppercase tracking-wide text-[#5B5340]"><th className="px-3 py-2">Component</th><th className="px-3 py-2">Pending Amount</th><th className="px-3 py-2">Transactions</th></tr></thead>
                  <tbody>
                    {[...FIN_COMPONENTS, { key: "tds", label: "TDS" }].map((c) => {
                      const rows = openExceptions.filter((e) => e.component === c.key);
                      const sum = rows.reduce((s, e) => s + (Number(e.amount) || 0), 0);
                      return <tr key={c.key} className="border-t border-[#F0EAD9]"><td className="px-3 py-2">{c.label}</td><td className="px-3 py-2">{sum ? `₹${sum.toLocaleString()}` : "—"}</td><td className="px-3 py-2">{rows.length || "—"}</td></tr>;
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "units" && !selected && (
            <div>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-lg font-bold" style={{ fontFamily: "Georgia, serif" }}>Units</h2>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-[#5B5340]"><input type="checkbox" checked={showHistorical} onChange={(e) => setShowHistorical(e.target.checked)} /> Show cancelled/superseded</label>
                  {currentUser.role === "CRM" && <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 bg-[#A87C3F] text-white text-sm px-3 py-1.5 rounded"><Plus size={15} /> New Allocation</button>}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {visibleRecordsList.map(({ key, rec, projectName, unitNumber }) => (
                  <button key={key} onClick={() => { setSelectedKey(key); setDetailTab("allocation"); }} className="text-left bg-white border border-[#E4DCC6] rounded-lg p-3 hover:border-[#A87C3F]">
                    <div className="font-semibold">{unitNumber} {rec.lifecycleStatus !== "ACTIVE" && <span className="text-xs text-[#8C8272]">(historical)</span>}</div>
                    <div className="text-xs text-[#8C8272] mb-2">{projectName} &middot; {rec.clientName}{rec.isDirectSaleDeed ? " · Direct SD" : ""}{rec.sourceChangeType ? ` · via ${rec.sourceChangeType.replace("_", " ").toLowerCase()}` : ""}</div>
                    <StampBadge tone={overallStatus(rec).tone}>{overallStatus(rec).label}</StampBadge>
                  </button>
                ))}
                {visibleRecordsList.length === 0 && <div className="text-sm text-[#8C8272]">No units yet.</div>}
              </div>
            </div>
          )}

          {tab === "units" && selected && (
            <div>
              <button onClick={() => setSelectedKey(null)} className="flex items-center gap-1 text-sm text-[#8C8272] mb-3"><ArrowLeft size={14} /> Back to units</button>
              <div className="mb-4">
                <h2 className="text-lg font-bold" style={{ fontFamily: "Georgia, serif" }}>{selUnit?.number} &middot; {selProject?.name}</h2>
                <div className="text-sm text-[#8C8272]">{selected.clientName} &middot; SD Value {selected.saleDeedValue} &middot; Onboarded {selected.onboardingDate}{selected.isDirectSaleDeed ? " · Direct Sale Deed Case" : ""} &middot; Sale Deed workflow V{selected.workflowVersionAtCreation?.saledeed ?? 1}</div>
                <div className="mt-1 flex gap-2 flex-wrap">
                  <StampBadge tone={selected.lifecycleStatus === "ACTIVE" ? "done" : "idle"}>{selected.lifecycleStatus}</StampBadge>
                  {selected.sourceTransactionId && <StampBadge tone="idle">via {selected.sourceChangeType?.replace("_", " ")}</StampBadge>}
                  {selected.previousCancelledTransactionId && <StampBadge tone="idle">Rebooking — follows a cancelled transaction (own independent financials)</StampBadge>}
                </div>
                {unitHistory.length > 1 && (
                  <div className="mt-2 text-xs text-[#8C8272]">Unit history: {unitHistory.map((h, i) => (
                    <span key={h.key}>{i > 0 && " → "}<button onClick={() => setSelectedKey(h.key)} className={`underline ${h.key === selectedKey ? "font-semibold text-[#1F2A3D]" : ""}`}>{h.rec.clientName} ({h.rec.lifecycleStatus})</button></span>
                  ))}</div>
                )}
              </div>
              <div className="flex gap-2 mb-4 border-b border-[#E4DCC6] flex-wrap">
                {[["allocation", "Allocation"], ["ats", "ATS"], ["saledeed", "Sale Deed"], ["financials", "Financials"], ["changes", "Cancel / Change"]].map(([k, label]) => (
                  <button key={k} onClick={() => setDetailTab(k)} className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${detailTab === k ? "border-[#A87C3F] text-[#1F2A3D]" : "border-transparent text-[#8C8272]"}`}>{label}</button>
                ))}
              </div>

              {detailTab === "allocation" && (<>
                <WorkflowPanel workflowKey="allocation" wfState={selected.allocation} stages={ALLOCATION_STAGES} currentUser={currentUser} meta={meta} onSubmitStage={submitStage} />
                {currentUser.role === "SUPERADMIN" && selected.allocation.currentStep >= ALLOCATION_STAGES.length && (
                  <button onClick={() => reopenWorkflow(selectedKey, "allocation")} className="mt-3 flex items-center gap-1.5 text-xs text-[#A87C3F] border border-[#A87C3F] rounded px-2 py-1"><RotateCcw size={12} /> Reopen (Super Admin)</button>
                )}
              </>)}
              {detailTab === "ats" && (<>
                <WorkflowPanel workflowKey="ats" wfState={selected.ats} stages={ATS_STAGES} currentUser={currentUser} meta={meta} onSubmitStage={submitStage} disabledReason={!selected.ats ? "ATS unlocks once Unit Allocation is fully approved." : null} />
                {selected.ats && !selected.ats.skipped && <PhysicalCustodyPanel rec={selected} workflowKey="ats" currentUser={currentUser} onTransfer={(wk, doc, r, n, rm) => transferCustody(selectedKey, wk, doc, r, n, rm)} />}
                <InternalComments rec={selected} currentUser={currentUser} onAdd={(m) => addComment(selectedKey, m)} />
                {currentUser.role === "SUPERADMIN" && selected.ats && !selected.ats.skipped && selected.ats.currentStep >= ATS_STAGES.length && (
                  <button onClick={() => reopenWorkflow(selectedKey, "ats")} className="mt-3 flex items-center gap-1.5 text-xs text-[#A87C3F] border border-[#A87C3F] rounded px-2 py-1"><RotateCcw size={12} /> Reopen (Super Admin)</button>
                )}
              </>)}
              {detailTab === "saledeed" && (<>
                <WorkflowPanel workflowKey="saledeed" wfState={selected.saledeed} stages={SALEDEED_STAGES} currentUser={currentUser} meta={meta} onSubmitStage={submitStage} onManagementSkip={managementSkip}
                  disabledReason={!selected.saledeed ? "Sale Deed unlocks once ATS is complete (or immediately, if this is a Direct Sale Deed case)." : null} />
                {selected.saledeed && <PhysicalCustodyPanel rec={selected} workflowKey="saledeed" currentUser={currentUser} onTransfer={(wk, doc, r, n, rm) => transferCustody(selectedKey, wk, doc, r, n, rm)} />}
                <InternalComments rec={selected} currentUser={currentUser} onAdd={(m) => addComment(selectedKey, m)} />
                {currentUser.role === "SUPERADMIN" && selected.saledeed && selected.saledeed.currentStep >= SALEDEED_STAGES.length && (
                  <button onClick={() => reopenWorkflow(selectedKey, "saledeed")} className="mt-3 flex items-center gap-1.5 text-xs text-[#A87C3F] border border-[#A87C3F] rounded px-2 py-1"><RotateCcw size={12} /> Reopen (Super Admin)</button>
                )}
              </>)}

              {detailTab === "financials" && (
                <div className="bg-white border border-[#E4DCC6] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-semibold">Financial baseline</span>
                    <StampBadge tone={selected.financials.locked ? "done" : "idle"}>{selected.financials.locked ? "Locked" : "Unlocked"}</StampBadge>
                  </div>
                  <table className="w-full text-sm">
                    <tbody>
                      {[...FIN_COMPONENTS, { key: "tds", label: "TDS" }].map((c) => (
                        <FinRow key={c.key} c={c} rec={selected} currentUser={currentUser} onEdit={(v, reason) => superAdminEditFinancial(selectedKey, c.key, v, reason)} />
                      ))}
                    </tbody>
                  </table>
                  {selected.financialExceptions.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-[#8C7A4D] mb-1">Financial Exceptions</div>
                      {selected.financialExceptions.map((e) => (
                        <div key={e.id} className="flex items-center justify-between text-sm py-1 border-b border-[#F0EAD9]">
                          <span>{e.label} — ₹{e.amount} <StampBadge tone={e.status === "OPEN" ? "warn" : "done"}>{e.status}</StampBadge></span>
                          {e.status === "OPEN" && (currentUser.role === "CFO" || currentUser.role === "SUPERADMIN") && <button onClick={() => resolveException(selectedKey, e.id)} className="text-xs text-[#2E6B4F]">Mark received</button>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {detailTab === "changes" && (
                <ChangesPanel rec={selected} txKey={selectedKey} currentUser={currentUser} meta={meta}
                  onRequestCancellation={requestCancellation} onActOnCancellation={actOnCancellation}
                  onRequestCustomerChange={requestCustomerChange} onApproveCustomerChange={approveCustomerChange}
                  onRequestUnitChange={requestUnitChange} onApproveUnitChange={approveUnitChange} />
              )}
            </div>
          )}

          {tab === "mytasks" && (
            <div>
              <h2 className="text-lg font-bold mb-4" style={{ fontFamily: "Georgia, serif" }}>My Tasks</h2>
              <div className="space-y-2">
                {myTasks.length === 0 && <div className="text-sm text-[#8C8272]">Nothing pending for {ROLES[currentUser.role]}.</div>}
                {myTasks.map((t, i) => (
                  <div key={i} className="flex items-center justify-between bg-white border border-[#A87C3F] rounded-lg px-4 py-3 text-sm">
                    <div><div className="font-medium">{t.unitNumber} ({t.projectName}) &middot; {t.workflow.toUpperCase()}</div><div className="text-xs text-[#8C8272]">{t.stage.label}</div></div>
                    <button onClick={() => { setSelectedKey(t.key); setTab("units"); setDetailTab(t.workflow); }} className="text-[#A87C3F]"><ChevronRight size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "exceptions" && (
            <div>
              <h2 className="text-lg font-bold mb-1" style={{ fontFamily: "Georgia, serif" }}>Open Financial Exceptions</h2>
              <div className="text-xs text-[#8C8272] mb-4">Persist independently of document completion.</div>
              <div className="space-y-2">
                {openExceptions.length === 0 && <div className="text-sm text-[#8C8272]">None open.</div>}
                {openExceptions.map((e) => (
                  <div key={e.id} className="flex items-center justify-between bg-white border border-[#A93226] rounded-lg px-4 py-3 text-sm">
                    <div><div className="font-medium">{e.unitNumber} ({e.projectName}) &middot; {e.label}</div><div className="text-xs text-[#8C8272]">₹{e.amount} pending</div></div>
                    <div className="flex items-center gap-2">
                      {(currentUser.role === "CFO" || currentUser.role === "SUPERADMIN") && <button onClick={() => resolveException(e.key, e.id)} className="text-xs text-[#2E6B4F]">Mark received</button>}
                      <button onClick={() => { setSelectedKey(e.key); setTab("units"); setDetailTab("financials"); }} className="text-[#A87C3F]"><ChevronRight size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "reports" && (
            <div>
              <h2 className="text-lg font-bold mb-1" style={{ fontFamily: "Georgia, serif" }}>Reports</h2>
              <div className="text-xs text-[#8C8272] mb-4">Full catalogue shown; only a few are wired to live data in this prototype — see CHANGELOG-v1.3.md.</div>
              <select value={reportKey} onChange={(e) => setReportKey(e.target.value)} className="border border-[#CBBE9C] rounded px-2 py-1.5 text-sm bg-white mb-4">
                {REPORT_KEYS.map((k) => <option key={k} value={k}>{k}{!IMPLEMENTED_REPORTS.includes(k) ? " (not wired up)" : ""}</option>)}
              </select>

              {reportKey === "financial-exception" && (
                <table className="w-full text-sm bg-white border border-[#E4DCC6] rounded-lg overflow-hidden">
                  <thead><tr className="bg-[#EFE7D3] text-left text-[11px] uppercase tracking-wide text-[#5B5340]"><th className="px-3 py-2">Unit</th><th className="px-3 py-2">Customer</th><th className="px-3 py-2">Component</th><th className="px-3 py-2">Amount</th></tr></thead>
                  <tbody>{openExceptions.map((e) => <tr key={e.id} className="border-t border-[#F0EAD9]"><td className="px-3 py-2">{e.unitNumber}</td><td className="px-3 py-2">{data.records[e.key]?.clientName}</td><td className="px-3 py-2">{e.label}</td><td className="px-3 py-2">₹{e.amount}</td></tr>)}
                  {openExceptions.length === 0 && <tr><td colSpan={4} className="px-3 py-4 text-center text-[#8C8272]">None open.</td></tr>}</tbody>
                </table>
              )}
              {reportKey === "legal-manager-acting" && (
                <table className="w-full text-sm bg-white border border-[#E4DCC6] rounded-lg overflow-hidden">
                  <thead><tr className="bg-[#EFE7D3] text-left text-[11px] uppercase tracking-wide text-[#5B5340]"><th className="px-3 py-2">When</th><th className="px-3 py-2">Actual performer</th><th className="px-3 py-2">Nominal role</th><th className="px-3 py-2">Stage</th></tr></thead>
                  <tbody>{data.auditLog.filter(a => a.nominalRole === "LEGAL_MGR" && a.actualRole !== "LEGAL_MGR").map((a) => <tr key={a.id} className="border-t border-[#F0EAD9]"><td className="px-3 py-2">{fmt(a.timestamp)}</td><td className="px-3 py-2">{a.actor} ({ROLES[a.actualRole]})</td><td className="px-3 py-2">Legal Manager</td><td className="px-3 py-2">{a.stage}</td></tr>)}
                  {data.auditLog.filter(a => a.nominalRole === "LEGAL_MGR" && a.actualRole !== "LEGAL_MGR").length === 0 && <tr><td colSpan={4} className="px-3 py-4 text-center text-[#8C8272]">None yet.</td></tr>}</tbody>
                </table>
              )}
              {reportKey === "physical-custody" && (
                <table className="w-full text-sm bg-white border border-[#E4DCC6] rounded-lg overflow-hidden">
                  <thead><tr className="bg-[#EFE7D3] text-left text-[11px] uppercase tracking-wide text-[#5B5340]"><th className="px-3 py-2">Unit</th><th className="px-3 py-2">Document</th><th className="px-3 py-2">Currently with</th><th className="px-3 py-2">Since</th></tr></thead>
                  <tbody>{activeRecordsList.flatMap(({ key, rec, unitNumber }) => (rec.documents || []).map((doc) => {
                    const log = (rec.custodyLog?.[doc.workflowType] || []).filter((c) => c.documentId === doc.id);
                    const last = log[log.length - 1];
                    if (!last) return null;
                    return <tr key={doc.id} className="border-t border-[#F0EAD9]"><td className="px-3 py-2">{unitNumber}</td><td className="px-3 py-2">{doc.label}</td><td className="px-3 py-2">{last.toName || ROLES[last.toRole]}</td><td className="px-3 py-2">{fmt(last.at)}</td></tr>;
                  })).filter(Boolean)}</tbody>
                </table>
              )}
              {reportKey === "cancellation" && (
                <table className="w-full text-sm bg-white border border-[#E4DCC6] rounded-lg overflow-hidden">
                  <thead><tr className="bg-[#EFE7D3] text-left text-[11px] uppercase tracking-wide text-[#5B5340]"><th className="px-3 py-2">Unit</th><th className="px-3 py-2">Original Txn</th><th className="px-3 py-2">Original Customer</th><th className="px-3 py-2">Original Sale Value</th><th className="px-3 py-2">Cancellation Date</th><th className="px-3 py-2">Rebooking Txn</th><th className="px-3 py-2">New Customer</th><th className="px-3 py-2">New Sale Value</th><th className="px-3 py-2">Price Difference</th></tr></thead>
                  <tbody>{Object.values(data.records).filter((r) => r.previousCancelledTransactionId).map((r) => {
                    const old = data.records[r.previousCancelledTransactionId];
                    const project = data.projects.find((p) => p.id === r.projectId);
                    const unit = project?.units.find((u) => u.id === r.unitId);
                    const diff = Number(r.saleDeedValue) - Number(old?.saleDeedValue || 0);
                    return (
                      <tr key={r.id} className="border-t border-[#F0EAD9]">
                        <td className="px-3 py-2">{unit?.number}</td><td className="px-3 py-2">{old?.id.slice(0, 10)}</td>
                        <td className="px-3 py-2">{old?.clientName}</td><td className="px-3 py-2">₹{old?.saleDeedValue}</td>
                        <td className="px-3 py-2">{old?.cancellation?.date}</td><td className="px-3 py-2">{r.id.slice(0, 10)}</td>
                        <td className="px-3 py-2">{r.clientName}</td><td className="px-3 py-2">₹{r.saleDeedValue}</td>
                        <td className="px-3 py-2">{diff >= 0 ? "+" : ""}₹{diff.toLocaleString()} <span className="text-[10px] text-[#8C8272]">(derived, not stored)</span></td>
                      </tr>
                    );
                  })}
                  {Object.values(data.records).filter((r) => r.previousCancelledTransactionId).length === 0 && <tr><td colSpan={9} className="px-3 py-4 text-center text-[#8C8272]">No cancellation+rebooking cases yet.</td></tr>}</tbody>
                </table>
              )}
              {!IMPLEMENTED_REPORTS.includes(reportKey) && (
                <div className="bg-white border border-dashed border-[#CBBE9C] rounded-lg p-5 text-sm text-[#8C8272]">This report follows the same selector → filter → table → export → drill-down shape as the ones above, querying different fields. Not individually wired up in this prototype.</div>
              )}
            </div>
          )}

          {tab === "notifications" && (
            <div>
              <h2 className="text-lg font-bold mb-1" style={{ fontFamily: "Georgia, serif" }}>Notifications</h2>
              <div className="text-xs text-[#8C8272] mb-4">In production these send by email + in-app per the Notification Design doc. This prototype lists them here.</div>
              <div className="space-y-2">
                {data.notifications.filter(notifiesCurrentUser).length === 0 && <div className="text-sm text-[#8C8272]">Nothing yet.</div>}
                {data.notifications.filter(notifiesCurrentUser).map((n) => (
                  <div key={n.id} className="bg-white border border-[#E4DCC6] rounded-lg px-4 py-3 text-sm">
                    <div className="flex items-center gap-2 mb-1"><StampBadge tone="warn">{n.type.replace(/_/g, " ")}</StampBadge><span className="text-[10px] text-[#8C8272]">{fmt(n.createdAt)}</span></div>
                    {n.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "audit" && (
            <div>
              <h2 className="text-lg font-bold mb-1" style={{ fontFamily: "Georgia, serif" }}>Audit Trail</h2>
              <div className="text-xs text-[#8C8272] mb-4">Immutable, append-only. Nominal role = who the workflow addressed; actual role = who's logged in.</div>
              <div className="space-y-1">
                {data.auditLog.slice(0, 200).map((a) => (
                  <div key={a.id} className="bg-white border border-[#E4DCC6] rounded px-3 py-2 text-xs">
                    <span className="font-mono text-[#8C8272]">{fmt(a.timestamp)}</span> — <span className="font-semibold">{a.actor}</span> ({ROLES[a.actualRole] || a.actualRole}{a.actualRole !== a.nominalRole ? `, acting as ${ROLES[a.nominalRole] || a.nominalRole}` : ""}) {a.action.replace(/_/g, " ").toLowerCase()} on {a.workflowType}/{a.stage}{a.remark ? ` — "${a.remark}"` : ""}
                  </div>
                ))}
                {data.auditLog.length === 0 && <div className="text-sm text-[#8C8272]">No actions yet.</div>}
              </div>
            </div>
          )}

          {tab === "setup" && (<div><h2 className="text-lg font-bold mb-4" style={{ fontFamily: "Georgia, serif" }}>Masters, Users &amp; Delegation</h2><SetupPanel meta={meta} setMeta={setMeta} onBumpVersion={bumpWorkflowVersion} /></div>)}
        </div>
      </div>
      {showNew && <NewAllocationModal meta={meta} currentUser={currentUser} onClose={() => setShowNew(false)} onCreate={createAllocation} />}
    </div>
  );
}

function FinRow({ c, rec, currentUser, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(rec.financials[c.key]);
  const [reason, setReason] = useState("");
  return (
    <tr className="border-t border-[#F0EAD9]">
      <td className="py-1.5 pr-2 text-[#5B5340]">{c.label}</td>
      <td className="py-1.5 text-right font-medium">
        {editing ? (
          <div className="flex items-center gap-1 justify-end flex-wrap">
            <input value={val} onChange={(e) => setVal(e.target.value)} className="w-20 border border-[#CBBE9C] rounded px-1 py-0.5 text-xs" />
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="reason" className="w-24 border border-[#CBBE9C] rounded px-1 py-0.5 text-xs" />
            <button onClick={() => { if (!reason.trim()) return; onEdit(val, reason); setEditing(false); }} className="text-[10px] text-[#2E6B4F]">Save</button>
          </div>
        ) : (
          <span>₹{rec.financials[c.key]} {rec.financials.locked && currentUser.role === "SUPERADMIN" && <button onClick={() => setEditing(true)} className="text-[10px] text-[#A87C3F] ml-2">edit</button>}</span>
        )}
      </td>
    </tr>
  );
}

function ChangesPanel({ rec, txKey, currentUser, meta, onRequestCancellation, onActOnCancellation, onRequestCustomerChange, onApproveCustomerChange, onRequestUnitChange, onApproveUnitChange }) {
  const [reason, setReason] = useState(""); const [date, setDate] = useState(today()); const [finImp, setFinImp] = useState(false);
  const [proposedName, setProposedName] = useState(""); const [ccReason, setCcReason] = useState("");
  const [ucUnitId, setUcUnitId] = useState(""); const [ucReason, setUcReason] = useState("");

  const project = meta.projects.find(p => p.id === rec.projectId);
  const otherAvailableUnits = (project?.units || []).filter((u) => u.id !== rec.unitId && !unitHasActiveTxn(meta.records, u.id));
  const pendingCC = rec.customerChangeRequests.find(r => r.status === "PENDING");

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="bg-white border border-[#E4DCC6] rounded-lg p-4">
        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><Ban size={14} /> Cancellation</h4>
        {rec.lifecycleStatus === "CANCELLED" ? <StampBadge tone="idle">Cancelled</StampBadge> : rec.cancellation ? (
          <div className="text-sm space-y-2">
            <div>Reason: {rec.cancellation.reason} ({rec.cancellation.date})</div>
            <div className="text-xs text-[#8C8272]">Requested by: {rec.cancellation.requestedBy}</div>
            <div className="flex gap-2 text-xs flex-wrap">
              <StampBadge tone={rec.cancellation.cfoApproved ? "done" : "pending"}>CFO {rec.cancellation.cfoApproved ? "OK" : "pending"}</StampBadge>
              <StampBadge tone={rec.cancellation.mgmtApproved ? "done" : "pending"}>Mgmt {rec.cancellation.mgmtApproved ? "OK" : "pending"}</StampBadge>
            </div>
            {currentUser.role === "CFO" && !rec.cancellation.cfoApproved && rec.cancellation.financialImplications && <button onClick={() => onActOnCancellation(txKey, true)} className="text-xs bg-[#1F2A3D] text-white px-2 py-1 rounded">CFO Approve</button>}
            {currentUser.role === "MANAGEMENT" && rec.cancellation.cfoApproved && !rec.cancellation.mgmtApproved && <button onClick={() => onActOnCancellation(txKey, true)} className="text-xs bg-[#1F2A3D] text-white px-2 py-1 rounded">Management Approve</button>}
          </div>
        ) : currentUser.role === "CRM" ? (
          <div className="space-y-2">
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" className="w-full border border-[#CBBE9C] rounded px-2 py-1.5 text-sm" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border border-[#CBBE9C] rounded px-2 py-1.5 text-sm" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={finImp} onChange={(e) => setFinImp(e.target.checked)} /> Has financial/refund implications</label>
            <button onClick={() => reason.trim() && onRequestCancellation(txKey, { reason, date, financialImplications: finImp })} className="text-xs bg-[#A93226] text-white px-3 py-1.5 rounded">Request Cancellation</button>
          </div>
        ) : <div className="text-xs text-[#8C8272]">No cancellation requested.</div>}
        {rec.lifecycleStatus === "CANCELLED" && <div className="text-[11px] text-[#8C8272] mt-2">Unit is now available for a new transaction. This one remains permanently as history.</div>}
      </div>

      <div className="bg-white border border-[#E4DCC6] rounded-lg p-4">
        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><ArrowRightLeft size={14} /> Unit Change</h4>
        {rec.lifecycleStatus === "SUPERSEDED" ? (
          <div className="text-sm"><StampBadge tone="idle">Superseded</StampBadge><div className="text-xs text-[#8C8272] mt-2">This transaction's unit was changed. New transaction: {rec.unitChangeRequest?.newTransactionId}.</div></div>
        ) : rec.unitChangeRequest ? (
          <div className="text-sm space-y-2">
            <div>Reason: {rec.unitChangeRequest.reason}</div>
            <div className="text-xs text-[#8C8272]">Requested by: {rec.unitChangeRequest.requestedBy} on {rec.unitChangeRequest.requestDate}</div>
            <StampBadge tone={rec.unitChangeRequest.status === "PENDING" ? "pending" : "done"}>{rec.unitChangeRequest.status}</StampBadge>
            {currentUser.role === "MANAGEMENT" && rec.unitChangeRequest.status === "PENDING" && <button onClick={() => onApproveUnitChange(txKey)} className="text-xs bg-[#1F2A3D] text-white px-2 py-1 rounded block mt-1">Management Approve → create new transaction</button>}
          </div>
        ) : currentUser.role === "CRM" ? (
          <div className="space-y-2">
            <select value={ucUnitId} onChange={(e) => setUcUnitId(e.target.value)} className="w-full border border-[#CBBE9C] rounded px-2 py-1.5 text-sm">
              <option value="">New unit&hellip;</option>{otherAvailableUnits.map(u => <option key={u.id} value={u.id}>{u.number}</option>)}
            </select>
            <input value={ucReason} onChange={(e) => setUcReason(e.target.value)} placeholder="Reason" className="w-full border border-[#CBBE9C] rounded px-2 py-1.5 text-sm" />
            <button onClick={() => ucUnitId && ucReason.trim() && onRequestUnitChange(txKey, ucUnitId, ucReason)} className="text-xs bg-[#A87C3F] text-white px-3 py-1.5 rounded">Request Unit Change</button>
          </div>
        ) : <div className="text-xs text-[#8C8272]">No unit change requested.</div>}
      </div>

      <div className="bg-white border border-[#E4DCC6] rounded-lg p-4">
        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><UsersIcon size={14} /> Customer Change</h4>
        <div className="text-xs text-[#8C8272] mb-2">Every request row is permanent history — never overwritten.</div>
        {rec.customerChangeRequests.length > 0 && (
          <div className="text-xs mb-2 space-y-1">
            {rec.customerChangeRequests.map((r) => (
              <div key={r.id}>{r.existingCustomerName} → {r.proposedCustomerName} <StampBadge tone={r.status === "APPROVED" ? "done" : "pending"}>{r.status}</StampBadge>
                <div className="text-[#8C8272]">Requested by: {r.requestedBy} — {r.reason}</div>
                {currentUser.role === "MANAGEMENT" && r.status === "PENDING" && <button onClick={() => onApproveCustomerChange(txKey, r.id)} className="ml-2 text-[#1F2A3D] underline">Approve</button>}
              </div>
            ))}
          </div>
        )}
        {currentUser.role === "CRM" && !pendingCC && (
          <div className="space-y-2">
            <input value={proposedName} onChange={(e) => setProposedName(e.target.value)} placeholder="Proposed new customer name" className="w-full border border-[#CBBE9C] rounded px-2 py-1.5 text-sm" />
            <input value={ccReason} onChange={(e) => setCcReason(e.target.value)} placeholder="Reason" className="w-full border border-[#CBBE9C] rounded px-2 py-1.5 text-sm" />
            <button onClick={() => proposedName.trim() && onRequestCustomerChange(txKey, proposedName, ccReason)} className="text-xs bg-[#A87C3F] text-white px-3 py-1.5 rounded">Request Customer Change</button>
          </div>
        )}
      </div>
    </div>
  );
}
