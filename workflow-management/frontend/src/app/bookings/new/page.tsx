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

function SelectField({ options, value, onChange, label }: { options: string[]; value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="flex h-9 w-full rounded-md border border-input bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-1 text-sm shadow-sm">
        <option value="">Select...</option>
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  )
}

export default function NewBookingPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    client_confirmation_date: "", onboarding_date: "", project_name: "",
    unit_no: "", client_name: "", sd_value: "", payment_plan: "", source_of_booking: "",
  })

  useEffect(() => { if (!isLoading && !user) router.push("/login") }, [user, isLoading, router])

  const handleChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
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
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span className="w-1 h-6 bg-blue-600 rounded-full inline-block" />
          New Booking
        </h1>
        <Card className="shadow-md border-0 ring-1 ring-gray-200 dark:ring-gray-800">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-t-lg">
            <CardTitle className="text-lg">Booking Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2"><Label>Client Confirmation Date</Label>
                  <Input type="date" value={form.client_confirmation_date} onChange={handleChange("client_confirmation_date")} required className="focus:ring-2 focus:ring-blue-500" /></div>
                <div className="space-y-2"><Label>Onboarding Date</Label>
                  <Input type="date" value={form.onboarding_date} onChange={handleChange("onboarding_date")} required className="focus:ring-2 focus:ring-blue-500" /></div>
                <div className="space-y-2"><Label>Project Name</Label>
                  <Input value={form.project_name} onChange={handleChange("project_name")} required placeholder="e.g. Emerald Towers" className="focus:ring-2 focus:ring-blue-500" /></div>
                <div className="space-y-2"><Label>Unit No</Label>
                  <Input value={form.unit_no} onChange={handleChange("unit_no")} required placeholder="e.g. 12A" className="focus:ring-2 focus:ring-blue-500" /></div>
                <div className="space-y-2"><Label>Client Name</Label>
                  <Input value={form.client_name} onChange={handleChange("client_name")} required placeholder="Full name" className="focus:ring-2 focus:ring-blue-500" /></div>
                <div className="space-y-2"><Label>SD Value (?)</Label>
                  <Input type="number" value={form.sd_value} onChange={handleChange("sd_value")} placeholder="0" className="focus:ring-2 focus:ring-blue-500" /></div>
              </div>
              <SelectField options={paymentPlans} value={form.payment_plan} onChange={(v) => setForm({ ...form, payment_plan: v })} label="Payment Plan" />
              <SelectField options={bookingSources} value={form.source_of_booking} onChange={(v) => setForm({ ...form, source_of_booking: v })} label="Source of Booking" />
              {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/50 px-3 py-2 rounded-md">{error}</p>}
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Create Booking</Button>
                <Button type="button" variant="outline" onClick={() => router.push("/bookings")}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
