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

export default function NewBookingPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [error, setError] = useState("")
  const [form, setForm] = useState({ client_name: "", client_phone: "", client_email: "", project_name: "", unit_no: "", booking_amount: "", notes: "" })

  useEffect(() => { if (!isLoading && !user) router.push("/login") }, [user, isLoading, router])

  const handleChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [key]: e.target.value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!user) return
    try { await api.createBooking({ ...form, booking_amount: parseFloat(form.booking_amount) }, user.id, user.name); router.push("/bookings") }
    catch (err: any) { setError(err.message) }
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
              <div className="space-y-2"><Label>Client Name</Label><Input value={form.client_name} onChange={handleChange("client_name")} required /></div>
              <div className="space-y-2"><Label>Client Phone</Label><Input value={form.client_phone} onChange={handleChange("client_phone")} required /></div>
              <div className="space-y-2"><Label>Client Email</Label><Input type="email" value={form.client_email} onChange={handleChange("client_email")} /></div>
              <div className="space-y-2"><Label>Project</Label><Input value={form.project_name} onChange={handleChange("project_name")} required /></div>
              <div className="space-y-2"><Label>Unit No</Label><Input value={form.unit_no} onChange={handleChange("unit_no")} required /></div>
              <div className="space-y-2"><Label>Booking Amount</Label><Input type="number" value={form.booking_amount} onChange={handleChange("booking_amount")} /></div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><textarea value={form.notes} onChange={handleChange("notes")} className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" /></div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit">Create Booking</Button>
          </form>
        </CardContent>
      </Card>
    </AppLayout>
  )
}
