"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { api, type StageDef } from "@/lib/api"
import AppLayout from "@/components/app-layout"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const statusColors: Record<string, "default" | "secondary" | "success" | "destructive" | "outline"> = {
  booking_created: "secondary", completed: "success", rejected: "destructive",
}

const fieldLabels: Record<string, string> = {
  client_name: "Client Name", project_name: "Project", unit_no: "Unit No",
  client_confirmation_date: "Confirmation Date", onboarding_date: "Onboarding Date",
  sd_value: "SD Value", payment_plan: "Payment Plan", source_of_booking: "Source",
  sales_exec_name: "Created By",
}

export default function BookingDetailPage() {
  const { user, isLoading, verifyPassword } = useAuth()
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [booking, setBooking] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [flow, setFlow] = useState<StageDef[]>([])
  const [comment, setComment] = useState("")
  const [error, setError] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState("")
  const [password, setPassword] = useState("")
  const [confirmError, setConfirmError] = useState("")

  const load = () => {
    if (!id || !user) return
    Promise.all([
      api.getBooking(id),
      api.getBookingHistory(id),
      api.getApprovalFlow(),
    ]).then(([b, h, f]) => { setBooking(b); setHistory(h); setFlow(f) }).catch(console.error)
  }

  useEffect(() => { if (!isLoading && !user) router.push("/login"); else load() }, [user, isLoading, router, id])

  const confirmAndApprove = async (action: string) => {
    setConfirmError("")
    try {
      await verifyPassword(password)
      if (!user) return
      await api.approveBooking(id, action, comment, user.id, user.name, user.role)
      setConfirmOpen(false)
      setPassword("")
      setComment("")
      load()
    } catch (err: any) {
      if (err.code === "auth/wrong-password" || err.message?.includes("wrong-password") || err.message?.includes("invalid-credential")) {
        setConfirmError("Incorrect password")
      } else {
        setConfirmError(err.message || "Verification failed")
      }
    }
  }

  const canApprove = (): { allowed: boolean; reason?: string } => {
    if (!user || !booking) return { allowed: false }
    if (booking.status === "completed" || booking.status === "rejected") return { allowed: false, reason: "Booking already finalized" }
    const stage = flow.find((s) => s.status === booking.status)
    if (!stage) return { allowed: false, reason: "Cannot approve at this stage" }
    if (user.role === "super_admin") return { allowed: true }
    if (user.role !== stage.role) return { allowed: false, reason: `Only ${stage.role} can approve at this stage` }
    return { allowed: true }
  }

  if (isLoading || !user || !booking) return null

  const stages = [{ status: "booking_created", role: "Created" }, ...flow, { status: "completed", role: "Completed" }]
  const currentIdx = stages.findIndex((s) => s.status === booking.status)
  const progress = booking.status === "rejected" ? 0 : booking.status === "completed" ? 100 : Math.max(0, currentIdx) * (100 / (stages.length - 1))
  const approval = canApprove()

  const fields = [
    { key: "client_name", span: true },
    { key: "project_name" }, { key: "unit_no" },
    { key: "client_confirmation_date" }, { key: "onboarding_date" },
    { key: "sd_value" }, { key: "payment_plan" },
    { key: "source_of_booking" }, { key: "sales_exec_name" },
  ]

  return (
    <AppLayout>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-600 rounded-full inline-block" />
            {booking.client_name}
          </h1>
          <Badge variant={statusColors[booking.status] || "outline"} className="text-sm capitalize">{booking.status.replace(/_/g, " ")}</Badge>
        </div>

        <div className="mb-6 bg-white dark:bg-gray-900 rounded-lg p-4 ring-1 ring-gray-200 dark:ring-gray-800">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-gray-400 mt-1.5">
            {stages.map((s, i) => (
              <span key={s.status} className={i <= currentIdx && booking.status !== "rejected" ? "text-blue-600 font-medium" : ""}>
                {s.role}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {fields.map(({ key, span }) => {
            const val = booking[key]
            return (
              <Card key={key} className={span ? "col-span-2 ring-1 ring-gray-100 dark:ring-gray-800 shadow-sm" : "ring-1 ring-gray-100 dark:ring-gray-800 shadow-sm"}>
                <CardHeader className="py-2.5 px-4"><CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wider">{fieldLabels[key] || key}</CardTitle></CardHeader>
                <CardContent className="px-4 pb-3"><p className="text-sm font-medium">{key === "sd_value" && val ? Number(val).toLocaleString() : (val || "-")}</p></CardContent>
              </Card>
            )
          })}
        </div>

        {booking.remarks && (
          <Card className="mb-6 ring-1 ring-gray-100 dark:ring-gray-800 shadow-sm">
            <CardHeader className="py-2.5 px-4"><CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</CardTitle></CardHeader>
            <CardContent className="px-4 pb-3"><p className="text-sm">{booking.remarks}</p></CardContent>
          </Card>
        )}

        {booking.status !== "completed" && booking.status !== "rejected" && (
          <Card className="mb-6 ring-1 ring-gray-100 dark:ring-gray-800 shadow-sm">
            <CardHeader className="py-2.5 px-4"><CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wider">Approval Action</CardTitle></CardHeader>
            <CardContent className="px-4 pb-4">
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment (optional)..."
                className="mb-3 flex min-h-[60px] w-full rounded-md border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
              {!approval.allowed && approval.reason && (
                <p className="text-sm text-gray-500 mb-2 italic">{approval.reason}</p>
              )}
              {approval.allowed && (
                <div className="flex gap-2">
                  <Button onClick={() => { setPendingAction("approve"); setConfirmOpen(true) }} className="bg-blue-600 hover:bg-blue-700">Approve</Button>
                  <Button variant="destructive" onClick={() => { setPendingAction("reject"); setConfirmOpen(true) }}>Reject</Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {confirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
              <h3 className="text-lg font-semibold mb-1 capitalize">{pendingAction} Booking</h3>
              <p className="text-sm text-gray-500 mb-4">Enter your password to confirm</p>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password" className="mb-3 focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => { if (e.key === "Enter") confirmAndApprove(pendingAction) }} autoFocus />
              {confirmError && <p className="text-sm text-red-500 mb-3">{confirmError}</p>}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => { setConfirmOpen(false); setPassword(""); setConfirmError("") }}>Cancel</Button>
                <Button onClick={() => confirmAndApprove(pendingAction)} className="bg-blue-600 hover:bg-blue-700">Confirm</Button>
              </div>
            </div>
          </div>
        )}

        <Card className="ring-1 ring-gray-100 dark:ring-gray-800 shadow-sm">
          <CardHeader className="py-2.5 px-4"><CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wider">Approval History</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4">
            {history.length === 0 ? <p className="text-sm text-gray-400">No history yet</p> : (
              <div className="space-y-3">
                {history.map((h: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 text-sm pb-3 border-b last:border-0 dark:border-gray-800">
                    <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${h.action === "reject" ? "bg-red-500" : "bg-blue-600"}`} />
                    <div>
                      <p className="font-medium capitalize">{h.action} by {h.user_name || h.user_id}</p>
                      <p className="text-gray-400 text-xs">{h.created_at ? new Date(h.created_at.toMillis()).toLocaleString() : ""}</p>
                      {h.comment && <p className="text-gray-500 mt-1">{h.comment}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
