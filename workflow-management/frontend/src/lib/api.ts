import { auth, db } from "./firebase"
import { doc, getDoc, getDocs, addDoc, updateDoc, setDoc, query, collection, where, orderBy, Timestamp } from "firebase/firestore"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"

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
  sd_value?: number
  payment_plan?: string
  source_of_booking?: string
  status: string
  sales_exec_id: string
  sales_exec_name?: string
  remarks?: string
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

const BOOKINGS = "bookings"
const USERS = "users"
const SUPER_ADMIN_EMAIL = "patelhet.0507@gmail.com"

async function getUser(uid: string) {
  const snap = await getDoc(doc(db, USERS, uid))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as UserData) : null
}

export const api = {
  async login(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    let user = await getUser(cred.user.uid)
    if (!user) {
      user = { id: cred.user.uid, name: cred.user.displayName || email.split("@")[0], email, role: "data_entry" }
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
    const constraints: any[] = [where("is_deleted", "==", false), orderBy("created_at", "desc")]
    if ((role === "data_entry" || role === "sales_exec") && uid) constraints.unshift(where("sales_exec_id", "==", uid))
    const snap = await getDocs(query(collection(db, BOOKINGS), ...constraints))
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as BookingData[]
  },

  async getBooking(id: string) {
    const snap = await getDoc(doc(db, BOOKINGS, id))
    if (!snap.exists()) throw new Error("Booking not found")
    return { id: snap.id, ...snap.data() } as BookingData
  },

  async createBooking(data: Partial<BookingData>, uid: string, name: string, role: string) {
    if (role !== "data_entry" && role !== "super_admin") throw new Error("Only data entry users can create bookings")
    const ref = await addDoc(collection(db, BOOKINGS), {
      ...data, sales_exec_id: uid, sales_exec_name: name,
      status: "booking_created", is_deleted: false,
      created_at: Timestamp.now(), updated_at: Timestamp.now(),
    })
    const snap = await getDoc(ref)
    return { id: snap.id, ...snap.data() } as BookingData
  },

  async approveBooking(bookingId: string, action: string, comment: string | undefined, userId: string, userName: string) {
    const bookingRef = doc(db, BOOKINGS, bookingId)
    const booking = await getDoc(bookingRef)
    if (!booking.exists()) throw new Error("Booking not found")

    const currentStatus = booking.data().status as string
    const stages = ["booking_created", "kyc_verification", "crm_approval", "completed"]
    const idx = stages.indexOf(currentStatus)
    const newStatus = action === "approve" ? (idx < stages.length - 1 ? stages[idx + 1] : currentStatus) : "rejected"

    await updateDoc(bookingRef, { status: newStatus, updated_at: Timestamp.now() })
    await addDoc(collection(db, BOOKINGS, bookingId, "approvals"), {
      action, user_id: userId, user_name: userName, stage: currentStatus, comment: comment || "",
      created_at: Timestamp.now(),
    })
    return { ...booking.data(), id: booking.id, status: newStatus } as BookingData
  },

  async getBookingHistory(bookingId: string) {
    const snap = await getDocs(query(collection(db, BOOKINGS, bookingId, "approvals"), orderBy("created_at", "asc")))
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ApprovalData[]
  },

  async getDashboardStats(uid?: string, role?: string) {
    const constraints: any[] = [where("is_deleted", "==", false)]
    if ((role === "data_entry" || role === "sales_exec") && uid) constraints.push(where("sales_exec_id", "==", uid))
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
}
