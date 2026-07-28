"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { api } from "@/lib/api"
import AppLayout from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const paymentPlans = ["Full Payment", "Installment (6 months)", "Installment (12 months)", "Installment (24 months)", "Construction Linked"]
const bookingSources = ["Walk-in", "Agent", "Referral", "Online", "Phone Inquiry", "Other"]

export default function NewBookingPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    client_confirmation_date: "", onboarding_date: "", project_name: "",
    unit_no: "", client_name: "", sd_value: "", payment_plan: "", source_of_booking: "",
  })

  useEffect(() => { if (!isLoading && !user) router.push("/login") }, [user, isLoading, router])

  const handleChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: e.target.value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!user) return
    try {
      await api.createBooking({
        ...form,
        sd_value: form.sd_value ? parseFloat(form.sd_value) : undefined,
      }, user.id, user.name, user.role)
      router.push("/bookings")
    } catch (err: any) { setError(err.message) }
  }

  if (isLoading || !user) return null

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold mb-6">New Booking</h1>
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Booking Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Client Confirmation Date</Label><Input type="date" value={form.client_confirmation_date} onChange={handleChange("client_confirmation_date")} required /></div>
              <div className="space-y-2"><Label>Onboarding Date</Label><Input type="date" value={form.onboarding_date} onChange={handleChange("onboarding_date")} required /></div>
              <div className="space-y-2"><Label>Project Name</Label><Input value={form.project_name} onChange={handleChange("project_name")} required /></div>
              <div className="space-y-2"><Label>Unit No</Label><Input value={form.unit_no} onChange={handleChange("unit_no")} required /></div>
              <div className="space-y-2"><Label>Client Name</Label><Input value={form.client_name} onChange={handleChange("client_name")} required /></div>
              <div className="space-y-2"><Label>SD Value</Label><Input type="number" value={form.sd_value} onChange={handleChange("sd_value")} /></div>
              <div className="space-y-2"><Label>Payment Plan</Label>
                <select value={form.payment_plan} onChange={handleChange("payment_plan")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                  <option value="">Select...</option>
                  {paymentPlans.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-2"><Label>Source of Booking</Label>
                <select value={form.source_of_booking} onChange={handleChange("source_of_booking")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                  <option value="">Select...</option>
                  {bookingSources.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit">Create Booking</Button>
          </form>
        </CardContent>
      </Card>
    </AppLayout>
  )
}
