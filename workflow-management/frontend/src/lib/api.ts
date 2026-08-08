import { auth, db } from "./firebase"
import { doc, getDoc, getDocs, addDoc, updateDoc, setDoc, query, collection, where, orderBy, Timestamp } from "firebase/firestore"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth"

export interface UserData {
  id: string
  name: string
  email: string
  role: string
}

export interface BookingData {
  id?: string
  client_confirmation_date?: string
  onboarding_date?: string
  project_name?: string
  unit_no: string
  client_name: string
  sd_value?: number
  payment_plan?: string
  source_of_booking?: string
  remarks?: string
  cso_sign?: string
  kyc_upload?: string
  crm_team_sign?: string
  management_sign?: string
  ats_approval?: string
  sale_deed_approval?: string
  management_approval?: string
  email_sent?: boolean
  client_confirmation?: string
  application_no_ats?: string
  application_no_sale_deed?: string
  basic_amount?: number
  gst?: number
  running_maintenance?: number
  maintenance_deposit?: number
  stamp_duty?: number
  legal_charges?: number
  png_charges?: number
  tds?: number
  loan_cheque_dd_date?: string
  bank_name?: string
  cheque_no?: string
  amount?: number
  loan_cheque_available?: string
  client_signature_date?: string
  execution_date?: string
  index_ii?: boolean
  certified_copy?: boolean
  account_checked?: boolean
  provided_to_crm?: boolean
  provided_to_legal?: boolean
  final_verification?: boolean
  document_to_admin?: boolean
  scan_check?: boolean
  document_scan?: boolean
  sales_close?: boolean
  final_remarks?: string
  status: string
  sales_exec_id: string
  sales_exec_name?: string
  created_at?: Timestamp
  updated_at?: Timestamp
  is_deleted?: boolean
}

export interface ApprovalData {
  id?: string
  action: string
  user_id: string
  user_name: string
  stage: string
  comment: string
  created_at?: Timestamp
}

export interface StageDef {
  status: string
  role: string
}

export interface BookingFieldDef {
  key: string
  label: string
  type: "text" | "number" | "date" | "select" | "textarea" | "checkbox"
  required?: boolean
  options?: string[]
  section?: string
}

export const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "select", label: "Dropdown" },
  { value: "textarea", label: "Paragraph" },
  { value: "checkbox", label: "Checkbox" },
]

const BOOKINGS = "bookings"
const USERS = "users"

const SIGN_FIELDS: Record<string, string> = {
  cso_approved: "cso_sign",
  kyc_pending: "kyc_upload",
  crm_approved: "crm_team_sign",
  management_approved: "management_sign",
}
const SUPER_ADMIN_EMAIL = "patelhet.0507@gmail.com"

const DEFAULT_FLOW: StageDef[] = [
  { status: "booking_completed", role: "sales" },
  { status: "unit_allocated", role: "sales" },
  { status: "cso_approved", role: "cso" },
  { status: "kyc_pending", role: "crm" },
  { status: "crm_approved", role: "crm" },
  { status: "management_approved", role: "management" },
  { status: "ats_approved", role: "documentation" },
  { status: "sale_deed_approved", role: "documentation" },
  { status: "print_requested", role: "crm_documentation" },
  { status: "documents_printed", role: "legal" },
  { status: "legal_verification_pending", role: "legal" },
  { status: "accounts_verification_pending", role: "accounts" },
  { status: "client_signature_pending", role: "crm_documentation" },
  { status: "executed", role: "legal_execution" },
  { status: "registration_completed", role: "legal_execution" },
  { status: "index_ii_received", role: "legal_execution" },
  { status: "document_scanned", role: "scan_verification" },
  { status: "sales_closed", role: "sales_closing" },
  { status: "archived", role: "admin" },
]

async function getFlowConfig(): Promise<StageDef[]> {
  const snap = await getDoc(doc(db, "config", "approval_flow"))
  if (snap.exists()) return (snap.data().stages as StageDef[]) || DEFAULT_FLOW
  return DEFAULT_FLOW
}

export async function verifyPassword(password: string) {
  const user = auth.currentUser
  if (!user || !user.email) throw new Error("Not authenticated")
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password))
}

async function getUser(uid: string) {
  const snap = await getDoc(doc(db, USERS, uid))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as UserData) : null
}

export const api = {
  async getApprovalFlow() {
    return getFlowConfig()
  },

  async updateApprovalFlow(stages: StageDef[]) {
    await setDoc(doc(db, "config", "approval_flow"), { stages })
  },

  async login(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    let user = await getUser(cred.user.uid)
    if (!user) {
      user = { id: cred.user.uid, name: cred.user.displayName || email.split("@")[0], email, role: "sales" }
      await setDoc(doc(db, USERS, cred.user.uid), user)
    }
    const token = await cred.user.getIdToken()
    return { token, user }
  },

  async register(email: string, password: string, name: string, role: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    const finalRole = email.toLowerCase() === SUPER_ADMIN_EMAIL ? "super_admin" : role
    const user = { id: cred.user.uid, name, email, role: finalRole }
    await setDoc(doc(db, USERS, cred.user.uid), user)
    return { token: await cred.user.getIdToken(), user }
  },

  async updateUserRole(uid: string, role: string) {
    await updateDoc(doc(db, USERS, uid), { role })
  },

  async getBookings(uid?: string, role?: string) {
    const constraints: any[] = [where("is_deleted", "==", false)]
    if (role === "sales" && uid) constraints.push(where("sales_exec_id", "==", uid))
    const snap = await getDocs(query(collection(db, BOOKINGS), ...constraints))
    const bookings = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as BookingData[]
    bookings.sort((a, b) => ((b.created_at?.toMillis() ?? 0) - (a.created_at?.toMillis() ?? 0)))
    return bookings
  },

  async getBooking(id: string) {
    const snap = await getDoc(doc(db, BOOKINGS, id))
    if (!snap.exists()) throw new Error("Booking not found")
    return { id: snap.id, ...snap.data() } as BookingData
  },

  async createBooking(data: Partial<BookingData>, uid: string, name: string, role: string) {
    if (role !== "sales" && role !== "admin" && role !== "super_admin") throw new Error("Only Sales users can create bookings")
    const ref = await addDoc(collection(db, BOOKINGS), {
      ...data, sales_exec_id: uid, sales_exec_name: name,
      status: "booking_completed", is_deleted: false,
      created_at: Timestamp.now(), updated_at: Timestamp.now(),
    })
    const snap = await getDoc(ref)
    return { id: snap.id, ...snap.data() } as BookingData
  },

  async updateBooking(id: string, updates: Partial<BookingData>) {
    await updateDoc(doc(db, BOOKINGS, id), { ...updates, updated_at: Timestamp.now() })
  },

  async approveBooking(bookingId: string, action: string, comment: string | undefined, userId: string, userName: string, userRole: string) {
    const [flow, bookingSnap] = await Promise.all([getFlowConfig(), getDoc(doc(db, BOOKINGS, bookingId))])
    if (!bookingSnap.exists()) throw new Error("Booking not found")

    const currentStatus = bookingSnap.data().status as string
    if (currentStatus === "completed" || currentStatus === "rejected") throw new Error("Booking already finalized")

    if (action === "approve") {
      const stage = flow.find((s) => s.status === currentStatus)
      if (!stage) throw new Error("Cannot approve at this stage")
      if (userRole !== stage.role && userRole !== "super_admin") throw new Error(`Only ${stage.role} can approve at this stage`)
    }

    const statuses = ["booking_completed", ...flow.map((s) => s.status), "completed"]
    const idx = statuses.indexOf(currentStatus)
    const newStatus = action === "approve" ? (idx < statuses.length - 1 ? statuses[idx + 1] : currentStatus) : "rejected"

    const signUpdates: Partial<BookingData> = action === "approve" && SIGN_FIELDS[currentStatus]
      ? { [SIGN_FIELDS[currentStatus]]: userName } as Partial<BookingData>
      : {}

    await updateDoc(doc(db, BOOKINGS, bookingId), { status: newStatus, updated_at: Timestamp.now(), ...signUpdates })
    await addDoc(collection(db, BOOKINGS, bookingId, "approvals"), {
      action, user_id: userId, user_name: userName, stage: currentStatus, comment: comment || "",
      created_at: Timestamp.now(),
    })
    return { ...bookingSnap.data(), id: bookingSnap.id, status: newStatus } as BookingData
  },

  async getBookingHistory(bookingId: string) {
    const snap = await getDocs(query(collection(db, BOOKINGS, bookingId, "approvals"), orderBy("created_at", "asc")))
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ApprovalData[]
  },

  async getDashboardStats(uid?: string, role?: string) {
    const constraints: any[] = [where("is_deleted", "==", false)]
    if (role === "sales" && uid) constraints.push(where("sales_exec_id", "==", uid))
    const snap = await getDocs(query(collection(db, BOOKINGS), ...constraints))
    const bookings = snap.docs.map((d) => d.data())
    return {
      total_bookings: bookings.length,
      pending_approvals: bookings.filter((b) => b.status !== "completed" && b.status !== "rejected").length,
      completed: bookings.filter((b) => b.status === "completed").length,
      rejected: bookings.filter((b) => b.status === "rejected").length,
    }
  },

  async getUsers() {
    const snap = await getDocs(collection(db, USERS))
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as UserData[]
  },

  async getBookingForm(): Promise<BookingFieldDef[]> {
    const snap = await getDoc(doc(db, "config", "booking_form"))
    if (snap.exists()) return (snap.data().fields as BookingFieldDef[]) || DEFAULT_BOOKING_FIELDS
    return DEFAULT_BOOKING_FIELDS
  },

  async updateBookingForm(fields: BookingFieldDef[]) {
    await setDoc(doc(db, "config", "booking_form"), { fields })
  },
}

export const SECTION_NAMES: Record<string, string> = {
  unit_allocation: "Unit Allocation & Approval",
  ats_sale_deed: "ATS & Sale Deed Approval",
  print_request: "Print Request (CRM)",
  registration: "Document Registration Process",
  closing: "Scan & Sales Close",
}

const DEFAULT_BOOKING_FIELDS: BookingFieldDef[] = [
  { key: "client_confirmation_date", label: "Client Confirmation Date", type: "date", required: true, section: "unit_allocation" },
  { key: "onboarding_date", label: "Onboarding Date", type: "date", required: true, section: "unit_allocation" },
  { key: "project_name", label: "Project Name", type: "text", required: true, section: "unit_allocation" },
  { key: "unit_no", label: "Unit Number", type: "text", required: true, section: "unit_allocation" },
  { key: "client_name", label: "Client Name", type: "text", required: true, section: "unit_allocation" },
  { key: "sd_value", label: "SD Value", type: "number", required: true, section: "unit_allocation" },
  { key: "payment_plan", label: "Payment Plan", type: "select", required: true, options: ["Full Payment", "Installment (6 months)", "Installment (12 months)", "Installment (24 months)", "Construction Linked"], section: "unit_allocation" },
  { key: "source_of_booking", label: "Source of Booking", type: "select", required: true, options: ["Walk-in", "Agent", "Referral", "Online", "Phone Inquiry", "Other"], section: "unit_allocation" },
  { key: "remarks", label: "Remark", type: "textarea", section: "unit_allocation" },

  { key: "ats_approval", label: "ATS (Bharti Ma'am)", type: "checkbox", section: "ats_sale_deed" },
  { key: "sale_deed_approval", label: "Sale Deed (Bharti Ma'am)", type: "checkbox", section: "ats_sale_deed" },
  { key: "management_approval", label: "Management Approval", type: "checkbox", section: "ats_sale_deed" },

  { key: "email_sent", label: "Email", type: "text", section: "print_request" },
  { key: "client_confirmation", label: "Client Confirmation", type: "text", section: "print_request" },

  { key: "application_no_ats", label: "Apl No (ATS)", type: "text", section: "registration" },
  { key: "application_no_sale_deed", label: "Apl No (Sale Deed)", type: "text", section: "registration" },
  { key: "basic_amount", label: "Basic Amount", type: "number", section: "registration" },
  { key: "gst", label: "GST", type: "number", section: "registration" },
  { key: "running_maintenance", label: "Running Maintenance", type: "number", section: "registration" },
  { key: "maintenance_deposit", label: "Maintenance Deposit", type: "number", section: "registration" },
  { key: "stamp_duty", label: "Stamp Duty", type: "number", section: "registration" },
  { key: "legal_charges", label: "Legal Charges", type: "number", section: "registration" },
  { key: "png_charges", label: "PNG Charges", type: "number", section: "registration" },
  { key: "tds", label: "TDS", type: "number", section: "registration" },
  { key: "loan_cheque_available", label: "Loan Cheque/DD (N/A)", type: "text", section: "registration" },
  { key: "loan_cheque_dd_date", label: "DD Date", type: "date", section: "registration" },
  { key: "bank_name", label: "Bank Name", type: "text", section: "registration" },
  { key: "cheque_no", label: "Cheque No.", type: "text", section: "registration" },
  { key: "amount", label: "Amount", type: "number", section: "registration" },

  { key: "index_ii", label: "Index II", type: "checkbox", section: "registration" },
  { key: "certified_copy", label: "Certified Copy", type: "checkbox", section: "registration" },
]
