import { auth, db } from "./firebase"
import { doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, setDoc, query, collection, where, orderBy, Timestamp } from "firebase/firestore"
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
  project_name: string
  unit_no: string
  client_name: string
  project_id?: string
  project_details?: Record<string, string>
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
  client_signature_date?: string
  execution_date?: string
  index_ii?: boolean
  certified_copy?: boolean
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

export interface FieldSpec {
  name: string
  required?: boolean
}

export interface ProjectType {
  id: string
  name: string
  fields: FieldSpec[]
}

const BOOKINGS = "bookings"
const USERS = "users"
const PROJECTS = "projects"
const SUPER_ADMIN_EMAIL = "patelhet.0507@gmail.com"

const DEFAULT_FLOW: StageDef[] = [
  { status: "booking_completed", role: "sales" },
  { status: "unit_allocated", role: "sales" },
  { status: "kyc_pending", role: "crm" },
  { status: "kyc_completed", role: "crm" },
  { status: "crm_approved", role: "management" },
  { status: "management_approval_pending", role: "management" },
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

    await updateDoc(doc(db, BOOKINGS, bookingId), { status: newStatus, updated_at: Timestamp.now() })
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

  async getProjects(): Promise<ProjectType[]> {
    const snap = await getDocs(collection(db, PROJECTS))
    const projects = snap.docs.map((d) => ({
      id: d.id,
      name: d.data().name || "Untitled",
      fields: normalizeProjectFields(d.data().fields),
    }) as ProjectType)
    return projects.sort((a, b) => a.name.localeCompare(b.name))
  },

  async createProject(data: { name: string; fields: FieldSpec[] }) {
    const ref = await addDoc(collection(db, PROJECTS), {
      name: data.name,
      fields: normalizeProjectFields(data.fields),
      created_at: Timestamp.now(),
    })
    const snap = await getDoc(ref)
    return { id: snap.id, ...snap.data() } as ProjectType
  },

  async updateProject(id: string, data: { name: string; fields: FieldSpec[] }) {
    await updateDoc(doc(db, PROJECTS, id), {
      name: data.name,
      fields: normalizeProjectFields(data.fields),
      updated_at: Timestamp.now(),
    })
  },

  async deleteProject(id: string) {
    await deleteDoc(doc(db, PROJECTS, id))
  },
}

export function normalizeProjectFields(fields: unknown): FieldSpec[] {
  if (!Array.isArray(fields)) return []
  return fields
    .map((f: any) =>
      typeof f === "string"
        ? { name: f, required: false }
        : { name: f?.name ?? "", required: !!f?.required }
    )
    .filter((f) => f.name.trim())
}
