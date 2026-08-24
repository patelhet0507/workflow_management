export interface RoleOption { value: string; label: string }

// v1.3.2 spec — 9 canonical roles (§1.1 role_code). Legacy aliases kept for compat.
export const ROLES: RoleOption[] = [
  { value: "super_admin", label: "Super Admin" },
  { value: "crm", label: "CRM" },
  { value: "crm_executive", label: "CRM Executive" },
  { value: "cso", label: "CSO" },
  { value: "management", label: "Management" },
  { value: "legal_execution", label: "Legal Executive" },
  { value: "legal", label: "Legal Manager" },
  { value: "accounts", label: "CFO" },
  { value: "admin", label: "Admin Executive" },
]

// Legacy aliases → canonical (so old Firestore role values still resolve)
const ROLE_ALIAS: Record<string,string> = {
  sales: "crm", crm_documentation: "crm_executive", documentation: "crm_documentation",
  legal_execution: "legal_execution", scan_verification: "crm_executive", sales_closing: "admin",
  crm_executive: "crm_executive",
}
export function canonicalRole(r: string): string { return ROLE_ALIAS[r] || r }

export const ROLE_LABELS: Record<string, string> = Object.fromEntries(ROLES.map((r) => [r.value, r.label]))

export const FLOW_LABELS: Record<string, string> = {
  booking_completed: "Booking Completed",
  unit_allocated: "Unit Allocated",
  cso_approved: "CSO Sign",
  kyc_pending: "KYC Upload",
  crm_approved: "CRM Team Sign",
  management_approved: "Management Sign",
  ats_approved: "ATS Approval",
  sale_deed_approved: "Sale Deed Approval",
  print_requested: "Print Requested",
  documents_printed: "Documents Printed",
  legal_verification_pending: "Legal Verification",
  accounts_verification_pending: "Accounts Verification",
  client_signature_pending: "Client Signature",
  executed: "Executed",
  registration_completed: "Registration Completed",
  index_ii_received: "Index-II Received",
  document_scanned: "Document Scanned",
  sales_closed: "Sales Closed",
  archived: "Archived",
  completed: "Completed",
  rejected: "Rejected",
}

export function statusLabel(s: string): string { return FLOW_LABELS[s] || s.replace(/_/g, " ") }
export function roleLabel(role: string): string { return ROLE_LABELS[canonicalRole(role)] || role.replace(/_/g, " ") }

// ── v1.3.2 unit status model (§1.3a) — 12 derived values, single source of truth
export const UNIT_STATUSES = [
  "AVAILABLE","ALLOCATION_PENDING","ALLOCATION_APPROVED","ATS_IN_PROCESS","ATS_REGISTERED",
  "SALE_DEED_IN_PROCESS","SALE_DEED_REGISTERED","COMPLETED","FINANCIAL_EXCEPTION","CANCELLED","UNIT_CHANGED","SUPERSEDED",
] as const
export type UnitStatus = typeof UNIT_STATUSES[number]

// v1.3.2: transaction lifecycle vs progress are separate dimensions
export type LifecycleStatus = "ACTIVE" | "CANCELLED" | "SUPERSEDED"

// ponytail: single recompute function — mirrors §1.3b recompute_unit_status(unit_id)
// Inputs: transaction + workflow progress + exceptions + registration. Pure, testable.
export function recomputeUnitStatus(input: {
  activeTransaction: { lifecycle_status: string; workflow_status?: string } | null
  mostRecentHistoric?: { lifecycle_status: string } | null
  atsRegistered?: boolean
  saleDeedRegistered?: boolean
  saleDeedCompleted?: boolean
  hasOpenFinancialExceptions?: boolean
  allocationCompleted?: boolean
  atsWorkflowExists?: boolean
  atsCompleted?: boolean
  saleDeedInProgress?: boolean
}): UnitStatus {
  const t = input.activeTransaction
  if (t) {
    // Financial exception / completion takes precedence over SALE_DEED_REGISTERED
    if (t.workflow_status === "FINANCIAL_EXCEPTION") return "FINANCIAL_EXCEPTION"
    if (t.workflow_status === "COMPLETED" || input.saleDeedCompleted) {
      return input.hasOpenFinancialExceptions ? "FINANCIAL_EXCEPTION" : "COMPLETED"
    }
    if (input.saleDeedRegistered) return "SALE_DEED_REGISTERED"
    if (input.saleDeedInProgress) return "SALE_DEED_IN_PROCESS"
    if (input.atsRegistered) return "ATS_REGISTERED"
    if (input.atsWorkflowExists) return "ATS_IN_PROCESS"
    if (input.allocationCompleted) return "ALLOCATION_APPROVED"
    return "ALLOCATION_PENDING"
  }
  if (input.mostRecentHistoric) {
    if (input.mostRecentHistoric.lifecycle_status === "CANCELLED") return "CANCELLED"
    if (input.mostRecentHistoric.lifecycle_status === "SUPERSEDED") return "UNIT_CHANGED"
  }
  return "AVAILABLE"
}

// Physical document types (§1.4 v1.3.2) — identity from print, before scan
export const PHYSICAL_DOC_TYPES = ["ATS_PRINT","SALE_DEED_PRINT"] as const
export const DIGITAL_DOC_TYPES = ["ATS_SCAN","SALE_DEED_SCAN","CLIENT_CONFIRMATION_FORM","CUSTOMER_RECEIVING_COPY","LOAN_CHEQUE_PHOTO"] as const

// Financial components (§1.5) — TDS included, never blocks registration
export const FIN_COMPONENTS = ["BASIC","GST","RUNNING_MAINTENANCE","MAINTENANCE_DEPOSIT","STAMP_DUTY","LEGAL_FEES","PNG","TDS"] as const

export interface FieldDef { key: string; label: string; type?: "text" | "number" | "date" | "textarea" | "checkbox" }
export interface FieldGroup { key: string; label: string; owners: string[]; fields: FieldDef[] }

export const FIELD_GROUPS: FieldGroup[] = [
  {
    key: "ats_sale_deed",
    label: "ATS & Sale Deed",
    owners: ["management", "admin", "super_admin", "legal", "legal_execution", "accounts"],
    fields: [
      { key: "ats_approval", label: "ATS Approval" },
      { key: "sale_deed_approval", label: "Sale Deed Approval" },
      { key: "management_approval", label: "Management Approval" },
    ],
  },
  {
    key: "print_request",
    label: "Print Request",
    owners: ["crm_executive", "admin", "super_admin", "crm"],
    fields: [
      { key: "email_sent", label: "Email Sent", type: "checkbox" },
      { key: "client_confirmation", label: "Client Confirmation" },
    ],
  },
  {
    key: "registration",
    label: "Registration",
    owners: ["legal_execution", "admin", "super_admin", "accounts"],
    fields: [
      { key: "application_no_ats", label: "Application No. (ATS)" },
      { key: "application_no_sale_deed", label: "Application No. (Sale Deed)" },
      { key: "basic_amount", label: "Basic Amount", type: "number" },
      { key: "gst", label: "GST", type: "number" },
      { key: "running_maintenance", label: "Running Maintenance", type: "number" },
      { key: "maintenance_deposit", label: "Maintenance Deposit", type: "number" },
      { key: "stamp_duty", label: "Stamp Duty", type: "number" },
      { key: "legal_charges", label: "Legal Charges", type: "number" },
      { key: "png_charges", label: "PNG Charges", type: "number" },
      { key: "tds", label: "TDS", type: "number" },
      { key: "loan_cheque_dd_date", label: "Loan Cheque/DD Date", type: "date" },
      { key: "bank_name", label: "Bank Name" },
      { key: "cheque_no", label: "Cheque No." },
      { key: "amount", label: "Amount", type: "number" },
    ],
  },
  {
    key: "execution",
    label: "Execution",
    owners: ["legal_execution", "admin", "super_admin"],
    fields: [
      { key: "client_signature_date", label: "Client Signature Date", type: "date" },
      { key: "execution_date", label: "Execution Date", type: "date" },
      { key: "index_ii", label: "Index-II", type: "checkbox" },
      { key: "certified_copy", label: "Certified Copy", type: "checkbox" },
    ],
  },
  {
    key: "closing",
    label: "Closing",
    owners: ["crm_executive", "admin", "super_admin"],
    fields: [
      { key: "document_scan", label: "Document Scan", type: "checkbox" },
      { key: "sales_close", label: "Sales Close", type: "checkbox" },
      { key: "final_remarks", label: "Final Remarks", type: "textarea" },
    ],
  },
]

// Workflow stage defs with acting roles + required docs (§1.6) — config-driven, not hardcoded per screen
export const ALLOCATION_STAGES = [
  { id: "crm_fill", requiredRole: "crm", acting: ["crm"], label: "CRM submits (CCF + KYC required)", docs: ["CLIENT_CONFIRMATION_FORM"] },
  { id: "cso_approve", requiredRole: "cso", acting: ["cso"], label: "CSO Approval" },
  { id: "mgmt_approve", requiredRole: "management", acting: ["management"], label: "Management Approval (1/3)" },
]
export const ATS_STAGES = [
  { id: "crm_request", requiredRole: "crm", label: "CRM requests ATS Approval" },
  { id: "mgmt_approve", requiredRole: "management", label: "Management Approval (2/3)" },
  { id: "customer_email", requiredRole: "crm", label: "Customer ATS draft approval" },
  { id: "legal_exec_print", requiredRole: "legal_execution", label: "Legal Exec: print ATS & Garvi" },
  { id: "legal_mgr_check", requiredRole: "legal", acting: ["legal","crm","accounts"], label: "Legal Manager: ATS verification" },
  { id: "cfo_ledger", requiredRole: "accounts", label: "CFO: ATS ledger check" },
  { id: "customer_signature", requiredRole: "crm", label: "Customer ATS signature" },
  { id: "legal_final", requiredRole: "legal", acting: ["legal","crm","accounts"], label: "Legal final verification" },
  { id: "registration", requiredRole: "legal_execution", label: "ATS registration (SRO)" },
  { id: "admin_scan", requiredRole: "admin", label: "Admin: scan, Accounts copy, Sales Close" },
  { id: "scan_check", requiredRole: "crm_executive", label: "CRM Exec: scan check" },
  { id: "handover", requiredRole: "crm_executive", label: "Customer handover" },
]
export const SALE_DEED_STAGES = [
  { id: "crm_request", requiredRole: "crm", label: "CRM requests Sale Deed Approval" },
  { id: "mgmt_approve", requiredRole: "management", label: "Management (3/3)" },
  { id: "legal_exec_print", requiredRole: "legal_execution", label: "Legal Exec: print & Garvi" },
  { id: "legal_mgr_check", requiredRole: "legal", acting: ["legal","crm","accounts"], label: "Legal Manager: verification" },
  { id: "cfo_receipt_check", requiredRole: "accounts", label: "CFO: receipt checklist (may approve with pending)" },
  { id: "customer_signature", requiredRole: "crm", label: "Customer Sale Deed signature" },
  { id: "legal_final", requiredRole: "legal", acting: ["legal","crm","accounts"], label: "Legal final verification" },
  { id: "registration", requiredRole: "legal_execution", label: "Sale Deed registration (SRO)" },
  { id: "garvi_downloads", requiredRole: "legal_execution", label: "Index II / Certified Copy" },
  { id: "admin_scan", requiredRole: "admin", label: "Admin: scan, Accounts copy, Sales Close" },
  { id: "scan_check", requiredRole: "crm_executive", label: "CRM Exec: scan check" },
  { id: "handover", requiredRole: "crm_executive", label: "Customer handover" },
]
