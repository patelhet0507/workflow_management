"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { api } from "@/lib/api"
import AppLayout from "@/components/app-layout"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const steps = ["booking_created", "kyc_verification", "crm_approval", "completed"]
const statusColors: Record<string, "default" | "secondary" | "success" | "destructive" | "outline"> = {
  booking_created: "secondary", kyc_verification: "default", crm_approval: "outline", completed: "success", rejected: "destructive",
}

export default function BookingDetailPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [booking, setBooking] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [comment, setComment] = useState("")
  const [error, setError] = useState("")

  const load = () => {
    if (!id || !user) return
    api.getBooking(id).then(setBooking).catch(console.error)
    api.getBookingHistory(id).then(setHistory).catch(console.error)
  }

  useEffect(() => { if (!isLoading && !user) router.push("/login"); else load() }, [user, isLoading, router, id])

  const handleApprove = async (action: string) => {
    setError("")
    if (!user) return
    try { await api.approveBooking(id, action, comment, user.id, user.name); load() }
    catch (err: any) { setError(err.message) }
  }

  if (isLoading || !user || !booking) return null

  const stepIndex = steps.indexOf(booking.status)
  const progress = booking.status === "rejected" ? 0 : booking.status === "completed" ? 100 : Math.max(0, stepIndex) * 33

  return (
    <AppLayout>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{booking.client_name}</h1>
          <Badge variant={statusColors[booking.status] || "outline"} className="text-sm">{booking.status}</Badge>
        </div>
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Created</span><span>KYC</span><span>CRM</span><span>Done</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card><CardHeader><CardTitle className="text-sm">Project</CardTitle></CardHeader><CardContent><p>{booking.project_name}</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Unit No</CardTitle></CardHeader><CardContent><p>{booking.unit_no || "-"}</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Client Confirmation</CardTitle></CardHeader><CardContent><p>{booking.client_confirmation_date || "-"}</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Onboarding</CardTitle></CardHeader><CardContent><p>{booking.onboarding_date || "-"}</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">SD Value</CardTitle></CardHeader><CardContent><p>{Number(booking.sd_value || 0).toLocaleString()}</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Payment Plan</CardTitle></CardHeader><CardContent><p>{booking.payment_plan || "-"}</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Source</CardTitle></CardHeader><CardContent><p>{booking.source_of_booking || "-"}</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Created By</CardTitle></CardHeader><CardContent><p>{booking.sales_exec_name || booking.sales_exec_id}</p></CardContent></Card>
        </div>
        {booking.remarks && <Card className="mb-6"><CardHeader><CardTitle className="text-sm">Remarks</CardTitle></CardHeader><CardContent><p>{booking.remarks}</p></CardContent></Card>}
        {booking.status !== "completed" && booking.status !== "rejected" && (
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-sm">Approval Action</CardTitle></CardHeader>
            <CardContent>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comment (optional)" className="mb-3 flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" />
              {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
              <div className="flex gap-2">
                <Button onClick={() => handleApprove("approve")}>Approve</Button>
                <Button variant="destructive" onClick={() => handleApprove("reject")}>Reject</Button>
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader><CardTitle className="text-sm">Approval History</CardTitle></CardHeader>
          <CardContent>
            {history.length === 0 ? <p className="text-sm text-gray-500">No history yet</p> : (
              <div className="space-y-3">
                {history.map((h: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 text-sm pb-3 border-b last:border-0 dark:border-gray-800">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-600 shrink-0" />
                    <div>
                      <p className="font-medium">{h.action} by {h.user_name || h.user_id}</p>
                      <p className="text-gray-500 text-xs">{h.created_at ? new Date(h.created_at).toLocaleString() : ""}</p>
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
