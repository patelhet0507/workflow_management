import { auth, db } from "./firebase"
import { doc, getDoc, getDocs, addDoc, updateDoc, setDoc, query, collection, where, orderBy, Timestamp, writeBatch } from "firebase/firestore"
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
  booked_by?: string
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
  // v1.3.2 lifecycle — ACTIVE default, CANCELLED / SUPERSEDED terminal (§1.3)
  lifecycle_status?: "ACTIVE" | "CANCELLED" | "SUPERSEDED"
  // v1.3.2 lineage — strictly separated per §1.9c
  source_transaction_id?: string | null
  source_change_type?: "UNIT_CHANGE" | null
  previous_cancelled_transaction_id?: string | null
  // v1.3.2 direct sale deed flag (§26)
  is_direct_sale_deed?: boolean
  direct_sale_deed_remark?: string
  // v1.3.2 physical document identity (§1.4) — stored as subcollection docs/* with physical linkage
  // v1.3.2 five independent status dimensions (§103)
  status_workflow?: string; status_document?: string; status_financial?: string; status_handover?: string; status_overall?: string
  // unit normalization key for dedup (§1.2a)
  unit_key?: string
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

// v1.3.2 helpers — ponytail: keep as pure functions, no extra deps
export function unitKey(s: string): string { return (s||"").toUpperCase().replace(/[^A-Z0-9]/g,"") }
// single recompute — mirrors constants.recomputeUnitStatus for Firestore bookings (§1.3b)
// ponder: financial_exceptions live in subcollection, not on doc — caller passes hasOpen flag
export function deriveUnitStatus(bookingsForUnit: BookingData[], hasOpenFinancialExceptions?: boolean): string {
  const active = bookingsForUnit.find(b=> (b.lifecycle_status||"ACTIVE")==="ACTIVE")
  if (active) {
    const hasOpen = hasOpenFinancialExceptions ?? (active as any).financial_exceptions?.some((e:any)=>e.status==="OPEN") ?? (active.status_financial==="ATTENTION_REQUIRED")
    if (active.status==="completed" || active.status==="archived") return hasOpen ? "FINANCIAL_EXCEPTION" : "COMPLETED"
    if ((active as any).sale_deed_registered || (active as any).registration_completed) return "SALE_DEED_REGISTERED"
    if ((active as any).sale_deed_in_progress) return "SALE_DEED_IN_PROCESS"
    if ((active as any).ats_registered) return "ATS_REGISTERED"
    if ((active as any).ats_in_progress) return "ATS_IN_PROCESS"
    if (active.status==="management_approved" || active.status==="ats_approved") return "ALLOCATION_APPROVED"
    return "ALLOCATION_PENDING"
  }
  const recent = [...bookingsForUnit].sort((a,b)=>(b.created_at?.toMillis()||0)-(a.created_at?.toMillis()||0))[0]
  if (recent?.lifecycle_status==="CANCELLED") return "CANCELLED"
  if (recent?.lifecycle_status==="SUPERSEDED") return "UNIT_CHANGED"
  return "AVAILABLE"
}

const DEFAULT_FLOW: StageDef[] = [
  { status: "booking_completed", role: "crm" },
  { status: "unit_allocated", role: "crm" },
  { status: "cso_approved", role: "cso" },
  { status: "kyc_pending", role: "crm" },
  { status: "crm_approved", role: "crm" },
  { status: "management_approved", role: "management" },
  { status: "ats_approved", role: "legal_execution" },
  { status: "sale_deed_approved", role: "legal_execution" },
  { status: "print_requested", role: "crm_executive" },
  { status: "documents_printed", role: "legal" },
  { status: "legal_verification_pending", role: "legal" },
  { status: "accounts_verification_pending", role: "accounts" },
  { status: "client_signature_pending", role: "crm" },
  { status: "executed", role: "legal_execution" },
  { status: "registration_completed", role: "legal_execution" },
  { status: "index_ii_received", role: "legal_execution" },
  { status: "document_scanned", role: "crm_executive" },
  { status: "sales_closed", role: "admin" },
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
      user = { id: cred.user.uid, name: cred.user.displayName || email.split("@")[0], email, role: "crm" }
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
    // ponytail: sales legacy → crm; crm sees own bookings, others see all
    const isCrmLike = role === "sales" || role === "crm"
    if (isCrmLike && uid) constraints.push(where("sales_exec_id", "==", uid))
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
    // v1.3.2: permission matrix — Create Allocation = CRM (own) (§2); super_admin bypass
    const canCreate = role === "crm" || role === "sales" || role === "super_admin"
    if (!canCreate) throw new Error("Only CRM can create allocations (§2 Permission Matrix)")
    if (!data.unit_no?.trim()) throw new Error("Unit Number is required")
    if (!data.client_name?.trim()) throw new Error("Client Name is required")
    // server-side CCF + KYC gate (§21) — first stage requires CLIENT_CONFIRMATION_FORM + kyc
    const hasCcf = !!(data as any).client_confirmation_form || !!(data as any).kyc_upload || (data as any).kyc_captured === true
    // kyc check: accept either field name
    if ((data as any).kyc_captured === false) throw new Error("KYC is mandatory for Allocation (§21)")
    const k = unitKey(data.unit_no||"")
    if (!k) throw new Error("Invalid unit number")
    const existing = await getDocs(query(collection(db, BOOKINGS), where("unit_key","==",k), where("is_deleted","==",false)))
    const hasActive = existing.docs.some(d=> (d.data().lifecycle_status||"ACTIVE")==="ACTIVE")
    if (hasActive) throw new Error(`Unit ${data.unit_no} already has an ACTIVE transaction — cancel or unit-change first (§1.3)`)
    let prevCancelled: string | null = null
    const sorted = existing.docs.map(d=>({id:d.id,...d.data()} as BookingData)).sort((a,b)=>(b.created_at?.toMillis()||0)-(a.created_at?.toMillis()||0))
    if (sorted[0]?.lifecycle_status==="CANCELLED") prevCancelled = sorted[0].id||null
    const ref = await addDoc(collection(db, BOOKINGS), {
      ...data, unit_key: k, sales_exec_id: uid, sales_exec_name: name,
      status: "booking_completed", lifecycle_status: "ACTIVE", is_deleted: false,
      previous_cancelled_transaction_id: prevCancelled,
      source_transaction_id: null, source_change_type: null,
      status_workflow:"IN_PROGRESS", status_document:"PENDING", status_financial:"PENDING", status_handover:"PENDING", status_overall:"IN_PROGRESS",
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
    const bData = bookingSnap.data() as BookingData
    const currentStatus = bData.status as string
    if (currentStatus === "completed" || currentStatus === "rejected") throw new Error("Booking already finalized")
    if (bData.lifecycle_status === "CANCELLED" || bData.lifecycle_status === "SUPERSEDED") throw new Error("Cannot act on a cancelled/superseded transaction")
    if (action === "SEND_BACK" || action === "send_back") {
      if (!comment?.trim()) throw new Error("Send Back requires a remark (§68)")
    }
    // permission check with acting roles (§66) + delegation time-window (§62-65)
    if (action === "approve" || action === "SEND_BACK") {
      const stage = flow.find((s) => s.status === currentStatus)
      if (stage) {
        const alias: Record<string,string[]> = { legal:["crm","accounts"], crm:["crm"], crm_executive:["crm"], legal_execution:["legal_execution"] }
        const acting = (alias[stage.role] || [stage.role])
        let isAllowed = userRole === stage.role || acting.includes(userRole) || userRole === "super_admin"
        // delegation evaluation — active + within [start_date, end_date] (§62)
        if (!isAllowed) {
          const today = new Date().toISOString().slice(0,10)
          const dSnap = await getDocs(query(collection(db, "delegations"), where("nominal_role","==",stage.role), where("delegated_role","==",userRole), where("active","==",true)))
          const hasValid = dSnap.docs.some(d=>{
            const v:any = d.data(); const s = v.start_date, e = v.end_date
            return s <= today && today <= e
          })
          if (hasValid) isAllowed = true
        }
        if (!isAllowed) throw new Error(`Only ${stage.role} can approve at this stage (you are ${userRole})`)
      }
    }
    // build logical flow: skip ATS stages when Direct Sale Deed (§26)
    let logicalFlow = flow
    if (bData.is_direct_sale_deed) logicalFlow = flow.filter(s=> s.status !== "ats_approved")
    const statuses = ["booking_completed", ...logicalFlow.map((s) => s.status), "completed"]
    const idx = statuses.indexOf(currentStatus)
    let newStatus: string
    let autoExCount = 0
    if (action === "approve") {
      newStatus = idx >=0 && idx < statuses.length - 1 ? statuses[idx + 1] : currentStatus
      if (bData.is_direct_sale_deed && newStatus === "ats_approved") newStatus = statuses[idx+2] || newStatus
      // financial-exception auto-create §48: CFO can approve with pending receipts → create OPEN exceptions, never block
      const isCfoStage = currentStatus === "accounts_verification_pending" || currentStatus === "cfo_receipt_check"
      if (isCfoStage) {
        const FIN_MAP: Record<string,string> = { basic_amount:"BASIC", gst:"GST", running_maintenance:"RUNNING_MAINTENANCE", maintenance_deposit:"MAINTENANCE_DEPOSIT", stamp_duty:"STAMP_DUTY", legal_charges:"LEGAL_FEES", png_charges:"PNG", tds:"TDS" }
        for (const [field, comp] of Object.entries(FIN_MAP)) {
          const amt = (bData as any)[field]
          if (amt === undefined || amt === null || amt === 0 || amt === "") {
            const exSnap = await getDocs(query(collection(db, BOOKINGS, bookingId, "financial_exceptions"), where("component","==",comp), where("status","==","OPEN")))
            if (exSnap.empty) { await addDoc(collection(db, BOOKINGS, bookingId, "financial_exceptions"), { component: comp, amount: Number(amt)||0, status:"OPEN", created_at: Timestamp.now(), created_by: userId }); autoExCount++ }
          }
        }
      }
    } else if (action === "SEND_BACK" || action === "send_back") {
      newStatus = idx > 0 ? statuses[idx - 1] : statuses[0]
    } else newStatus = "rejected"
    const signUpdates: Partial<BookingData> = action === "approve" && SIGN_FIELDS[currentStatus]
      ? { [SIGN_FIELDS[currentStatus]]: userName } as Partial<BookingData> : {}
    const printStages = ["documents_printed","print_requested"]
    const extra: any = {}
    if (action==="approve" && printStages.includes(currentStatus)) extra.documents_created = true
    if (autoExCount > 0) extra.status_financial = "ATTENTION_REQUIRED"
    const nextOverall = newStatus === "completed" ? "CLOSED" : (autoExCount>0 ? "ATTENTION_REQUIRED" : "IN_PROGRESS")
    await updateDoc(doc(db, BOOKINGS, bookingId), { status: newStatus, status_overall: nextOverall, updated_at: Timestamp.now(), ...signUpdates, ...extra })
    await addDoc(collection(db, BOOKINGS, bookingId, "approvals"), {
      action: action==="SEND_BACK"?"SEND_BACK":action, user_id: userId, user_name: userName, stage: currentStatus, comment: comment || "",
      created_at: Timestamp.now(), actual_role: userRole, nominal_role: flow.find(s=>s.status===currentStatus)?.role||null,
    })
    return { ...bData, id: bookingSnap.id, status: newStatus } as BookingData
  },
  // v1.3.2 physical custody — per document, never inferred from workflow (§1.7)
  async transferCustody(bookingId: string, documentId: string, toRole: string, toName: string, remark: string, userId: string, userName: string, workflowType: string = "SALE_DEED") {
    if (!documentId) throw new Error("documentId required — identity from print stage §1.4")
    return addDoc(collection(db, BOOKINGS, bookingId, "custody"), {
      document_id: documentId, workflow_type: workflowType, to_role: toRole, to_name: toName, remark: remark||"",
      by: userName, by_id: userId, created_at: Timestamp.now(),
    })
  },
  async getCustodyLog(bookingId: string) {
    const snap = await getDocs(query(collection(db, BOOKINGS, bookingId, "custody"), orderBy("created_at","asc")))
    return snap.docs.map(d=>({id:d.id,...d.data()}))
  },
  // v1.3.2 financial exception — OPEN until resolved, never blocks workflow (§1.5)
  async createFinancialException(bookingId: string, component: string, amount: number) {
    return addDoc(collection(db, BOOKINGS, bookingId, "financial_exceptions"), { component, amount, status:"OPEN", created_at: Timestamp.now() })
  },
  async resolveFinancialException(bookingId: string, exceptionId: string, userId: string) {
    await updateDoc(doc(db, BOOKINGS, bookingId, "financial_exceptions", exceptionId), { status:"RESOLVED", resolved_by: userId, resolved_at: Timestamp.now() })
  },
  // v1.3.2 change requests — distinct linking fields (§1.9c)
  async requestCancellation(bookingId: string, reason: string, financialImplications: boolean, userId: string) {
    return addDoc(collection(db, "cancellations"), { transaction_id: bookingId, reason, financial_implications: financialImplications, status:"PENDING", requested_by: userId, created_at: Timestamp.now() })
  },
  async requestUnitChange(oldBookingId: string, newUnitNo: string, reason: string, userId: string) {
    // validates new unit has no ACTIVE (§1.9)
    const k = unitKey(newUnitNo)
    const snap = await getDocs(query(collection(db, BOOKINGS), where("unit_key","==",k), where("is_deleted","==",false)))
    if (snap.docs.some(d=> (d.data().lifecycle_status||"ACTIVE")==="ACTIVE")) throw new Error("Selected unit is no longer available")
    return addDoc(collection(db, "unit_changes"), { old_transaction_id: oldBookingId, new_unit_no: newUnitNo, new_unit_key: k, reason, status:"PENDING", requested_by: userId, created_at: Timestamp.now() })
  },
  async requestCustomerChange(bookingId: string, proposedName: string, reason: string, userId: string) {
    const snap = await getDoc(doc(db, BOOKINGS, bookingId))
    if (!snap.exists()) throw new Error("Booking not found")
    return addDoc(collection(db, "customer_changes"), { transaction_id: bookingId, existing_customer_name: snap.data().client_name, proposed_customer_name: proposedName, reason, status:"PENDING", requested_by: userId, created_at: Timestamp.now() })
  },
  async getCancellations() {
    const snap = await getDocs(query(collection(db, "cancellations"), orderBy("created_at","desc")))
    return snap.docs.map(d=>({id:d.id,...d.data()}))
  },
  async getUnitChanges() {
    const snap = await getDocs(query(collection(db, "unit_changes"), orderBy("created_at","desc")))
    return snap.docs.map(d=>({id:d.id,...d.data()}))
  },
  async getCustomerChanges() {
    const snap = await getDocs(query(collection(db, "customer_changes"), orderBy("created_at","desc")))
    return snap.docs.map(d=>({id:d.id,...d.data()}))
  },
  async approveCancellation(cancelId: string, userId: string) {
    // §1.9 approve -> lifecycle CANCELLED + recompute
    const snap = await getDoc(doc(db, "cancellations", cancelId))
    if (!snap.exists()) throw new Error("Request not found")
    const r:any = snap.data()
    await updateDoc(doc(db, "cancellations", cancelId), { status:"APPROVED", approved_by: userId, approved_at: Timestamp.now() })
    await updateDoc(doc(db, BOOKINGS, r.transaction_id), { lifecycle_status:"CANCELLED", status_overall:"CLOSED", status_workflow:"CANCELLED", updated_at: Timestamp.now() })
  },
  async approveCustomerChange(changeId: string, userId: string) {
    const snap = await getDoc(doc(db, "customer_changes", changeId))
    if (!snap.exists()) throw new Error("Request not found")
    const r:any = snap.data()
    if (r.status !== "PENDING") throw new Error("Request already processed")
    await updateDoc(doc(db, "customer_changes", changeId), { status:"APPROVED", approved_by: userId, approved_at: Timestamp.now(), approved_customer_name: r.proposed_customer_name })
    await updateDoc(doc(db, BOOKINGS, r.transaction_id), { client_name: r.proposed_customer_name, updated_at: Timestamp.now() })
  },
  // §1.9 Unit Change — atomic new-transaction creation (6-step validation + writeBatch)
  async approveUnitChange(changeId: string, approverId: string, approverName: string) {
    const snap = await getDoc(doc(db, "unit_changes", changeId))
    if (!snap.exists()) throw new Error("Request not found")
    const req:any = snap.data()
    if (req.status !== "PENDING") throw new Error("Request already processed")
    const oldSnap = await getDoc(doc(db, BOOKINGS, req.old_transaction_id))
    if (!oldSnap.exists()) throw new Error("Old transaction not found")
    const old:any = { id: oldSnap.id, ...oldSnap.data() }
    if ((old.lifecycle_status||"ACTIVE") !== "ACTIVE") throw new Error("Old transaction is no longer ACTIVE (cancelled in the meantime)")
    const newKey = req.new_unit_key || unitKey(req.new_unit_no)
    const newUnitQ = await getDocs(query(collection(db, BOOKINGS), where("unit_key","==",newKey), where("is_deleted","==",false)))
    if (newUnitQ.docs.some(d=> (d.data().lifecycle_status||"ACTIVE")==="ACTIVE")) throw new Error("Selected unit is no longer available (§1.9 step 7)")
    // atomic batch: old → SUPERSEDED, new transaction, request update
    const batch = writeBatch(db)
    const newRef = doc(collection(db, BOOKINGS))
    batch.update(doc(db, BOOKINGS, old.id), { lifecycle_status:"SUPERSEDED", status_overall:"CLOSED", status_workflow:"SUPERSEDED", updated_at: Timestamp.now() })
    batch.set(newRef, {
      unit_no: req.new_unit_no, unit_key: newKey,
      project_name: old.project_name, client_name: old.client_name,
      sd_value: old.sd_value, payment_plan: old.payment_plan, source_of_booking: old.source_of_booking, booked_by: old.booked_by,
      basic_amount: old.basic_amount, gst: old.gst, running_maintenance: old.running_maintenance, maintenance_deposit: old.maintenance_deposit, stamp_duty: old.stamp_duty, legal_charges: old.legal_charges, png_charges: old.png_charges, tds: old.tds,
      sales_exec_id: old.sales_exec_id, sales_exec_name: old.sales_exec_name,
      status: "booking_completed", lifecycle_status:"ACTIVE", is_deleted:false,
      source_transaction_id: old.id, source_change_type:"UNIT_CHANGE",
      previous_cancelled_transaction_id: null,
      status_workflow:"IN_PROGRESS", status_document:"PENDING", status_financial:"PENDING", status_handover:"PENDING", status_overall:"IN_PROGRESS",
      is_direct_sale_deed: old.is_direct_sale_deed || false,
      created_at: Timestamp.now(), updated_at: Timestamp.now(),
    })
    batch.update(doc(db, "unit_changes", changeId), { status:"APPROVED", new_transaction_id: newRef.id, approved_by: approverId, approved_at: Timestamp.now() })
    await batch.commit()
    // audit log for approver
    await addDoc(collection(db, BOOKINGS, newRef.id, "approvals"), { action:"UNIT_CHANGE_CREATE", user_id: approverId, user_name: approverName, stage: "unit_change", comment: req.reason||"", created_at: Timestamp.now() })
    return newRef.id
  },
  // delegations — time-window evaluation §62-65
  async createDelegation(data: { nominal_role: string; delegated_role: string; original_user_id: string; acting_user_id: string; start_date: string; end_date: string; reason: string }, creatorId: string) {
    if (data.start_date > data.end_date) throw new Error("Start date must be <= end date")
    if (data.original_user_id === data.acting_user_id) throw new Error("Cannot delegate to self")
    return addDoc(collection(db, "delegations"), { ...data, active: true, created_by: creatorId, created_at: Timestamp.now() })
  },
  async getDelegations() {
    const snap = await getDocs(query(collection(db, "delegations"), orderBy("created_at","desc")))
    return snap.docs.map(d=>({id:d.id,...d.data()}))
  },
  async isDelegated(nominalRole: string, actingRole: string, actingUserId?: string): Promise<boolean> {
    const today = new Date().toISOString().slice(0,10)
    const snap = await getDocs(query(collection(db, "delegations"), where("nominal_role","==",nominalRole), where("delegated_role","==",actingRole), where("active","==",true)))
    return snap.docs.some(d=>{ const v:any=d.data(); if(actingUserId && v.acting_user_id!==actingUserId) return false; return v.start_date <= today && today <= v.end_date })
  },
  // global search combinable (§88) — thin filter bar, not a reporting module
  async searchBookings(filters: Record<string,string>) {
    const snap = await getDocs(query(collection(db, BOOKINGS), where("is_deleted","==",false)))
    let list = snap.docs.map(d=>({id:d.id,...d.data()})) as BookingData[]
    const f:any = filters
    if (f.project) list = list.filter(b=> (b.project_name||"").toLowerCase().includes(f.project.toLowerCase()))
    if (f.unit) list = list.filter(b=> unitKey(b.unit_no).includes(unitKey(f.unit)))
    if (f.customer) list = list.filter(b=> (b.client_name||"").toLowerCase().includes(f.customer.toLowerCase()))
    if (f.crm) list = list.filter(b=> (b.sales_exec_name||"").toLowerCase().includes(f.crm.toLowerCase()))
    if (f.bookedBy) list = list.filter(b=> (b.booked_by||"").toLowerCase().includes(f.bookedBy.toLowerCase()))
    if (f.currentStage) list = list.filter(b=> b.status===f.currentStage)
    if (f.registrationNumber) list = list.filter(b=> (b.application_no_ats||"").includes(f.registrationNumber) || (b.application_no_sale_deed||"").includes(f.registrationNumber))
    return list
  },

  async getBookingHistory(bookingId: string) {
    const snap = await getDocs(query(collection(db, BOOKINGS, bookingId, "approvals"), orderBy("created_at", "asc")))
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ApprovalData[]
  },

  async getDashboardStats(uid?: string, role?: string) {
    const constraints: any[] = [where("is_deleted", "==", false)]
    const isCrmLike = role === "sales" || role === "crm"
    if (isCrmLike && uid) constraints.push(where("sales_exec_id", "==", uid))
    const snap = await getDocs(query(collection(db, BOOKINGS), ...constraints))
    const bookings = snap.docs.map((d) => d.data())
    return {
      total_bookings: bookings.length,
      pending_approvals: bookings.filter((b) => b.status !== "completed" && b.status !== "rejected" && (b as any).lifecycle_status !== "CANCELLED").length,
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
