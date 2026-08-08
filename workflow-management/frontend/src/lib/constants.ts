export interface RoleOption {
  value: string
  label: string
}

export const ROLES: RoleOption[] = [
  { value: "sales", label: "Sales" },
  { value: "crm", label: "CRM" },
  { value: "management", label: "Management" },
  { value: "documentation", label: "Documentation (Bharti)" },
  { value: "crm_documentation", label: "CRM Documentation (Ruchika)" },
  { value: "legal", label: "Legal (Pranav)" },
  { value: "accounts", label: "Accounts (Vaibhav)" },
  { value: "legal_execution", label: "Legal Execution (Nidhi)" },
  { value: "scan_verification", label: "Scan Verification (Dipak)" },
  { value: "sales_closing", label: "Sales Closing (Gautam)" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
]

export const ROLE_LABELS: Record<string, string> = Object.fromEntries(ROLES.map((r) => [r.value, r.label]))

export const FLOW_LABELS: Record<string, string> = {
  booking_completed: "Booking Completed",
  unit_allocated: "Unit Allocated",
  kyc_pending: "KYC Pending",
  kyc_completed: "KYC Completed",
  crm_approved: "CRM Approved",
  management_approval_pending: "Management Approval Pending",
  ats_approved: "ATS Approved",
  sale_deed_approved: "Sale Deed Approved",
  print_requested: "Print Requested",
  documents_printed: "Documents Printed",
  legal_verification_pending: "Legal Verification Pending",
  accounts_verification_pending: "Accounts Verification Pending",
  client_signature_pending: "Client Signature Pending",
  executed: "Executed",
  registration_completed: "Registration Completed",
  index_ii_received: "Index-II Received",
  document_scanned: "Document Scanned",
  sales_closed: "Sales Closed",
  archived: "Archived",
  completed: "Completed",
  rejected: "Rejected",
}

export function statusLabel(s: string): string {
  return FLOW_LABELS[s] || s.replace(/_/g, " ")
}

export function roleLabel(role: string): string {
  return ROLE_LABELS[role] || role.replace(/_/g, " ")
}

export interface FieldDef {
  key: string
  label: string
  type?: "text" | "number" | "date" | "textarea" | "checkbox"
}

export interface FieldGroup {
  key: string
  label: string
  owners: string[]
  fields: FieldDef[]
}

export const FIELD_GROUPS: FieldGroup[] = [
  {
    key: "ats_sale_deed",
    label: "ATS & Sale Deed",
    owners: ["documentation", "management", "admin", "super_admin"],
    fields: [
      { key: "ats_approval", label: "ATS Approval" },
      { key: "sale_deed_approval", label: "Sale Deed Approval" },
      { key: "management_approval", label: "Management Approval" },
    ],
  },
  {
    key: "print_request",
    label: "Print Request",
    owners: ["crm_documentation", "admin", "super_admin"],
    fields: [
      { key: "email_sent", label: "Email Sent", type: "checkbox" },
      { key: "client_confirmation", label: "Client Confirmation" },
    ],
  },
  {
    key: "registration",
    label: "Registration",
    owners: ["legal_execution", "admin", "super_admin"],
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
    owners: ["scan_verification", "sales_closing", "admin", "super_admin"],
    fields: [
      { key: "document_scan", label: "Document Scan", type: "checkbox" },
      { key: "sales_close", label: "Sales Close", type: "checkbox" },
      { key: "final_remarks", label: "Final Remarks", type: "textarea" },
    ],
  },
]