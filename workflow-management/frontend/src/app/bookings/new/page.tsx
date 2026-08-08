"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { api, type BookingFieldDef } from "@/lib/api"
import AppLayout from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NewBookingPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [error, setError] = useState("")
  const [fields, setFields] = useState<BookingFieldDef[]>([])
  const [values, setValues] = useState<Record<string, string>>({})

  useEffect(() => { if (!isLoading && !user) router.push("/login") }, [user, isLoading, router])
  useEffect(() => {
    api.getBookingForm().then((f) => {
      setFields(f)
      setValues(Object.fromEntries(f.map((x) => [x.key, ""])))
    }).catch(console.error)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!user) return
    for (const f of fields) {
      if (f.required && !String(values[f.key] || "").trim()) return setError(`"${f.label}" is required`)
    }
    const data: Record<string, any> = {}
    fields.forEach((f) => {
      if (f.type === "checkbox") { data[f.key] = values[f.key] === "true"; return }
      data[f.key] = String(values[f.key] || "").trim()
    })
    try {
      await api.createBooking(data, user.id, user.name, user.role)
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
                <div className="space-y-2">
                  <Label>Booked By</Label>
                  <Input value={user.name} disabled className="bg-gray-50 dark:bg-gray-800" />
                </div>
                {fields.map((f) => (
                  <div key={f.key} className={f.type === "textarea" || f.type === "checkbox" ? "md:col-span-2 space-y-2" : "space-y-2"}>
                    <Label>{f.label}{f.required && <span className="text-red-500"> *</span>}</Label>
                    {f.type === "checkbox" ? (
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={values[f.key] === "true"} onChange={(e) => setValues({ ...values, [f.key]: e.target.checked ? "true" : "" })} />
                        {f.label}
                      </label>
                    ) : f.type === "textarea" ? (
                      <textarea value={values[f.key]} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                        placeholder={f.label}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                    ) : f.type === "select" ? (
                      <select value={values[f.key]} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                        className="flex h-9 w-full rounded-md border border-input bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-1 text-sm shadow-sm focus:ring-2 focus:ring-blue-500">
                        <option value="">Select...</option>
                        {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <Input type={f.type} value={values[f.key]} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                        placeholder={f.label} className="focus:ring-2 focus:ring-blue-500" />
                    )}
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Sign-offs (done by respective teams after creation)</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "CSO Sign", by: "CSO" },
                    { key: "KYC Upload", by: "CRM" },
                    { key: "CRM Team Sign", by: "CRM" },
                    { key: "Management Sign", by: "Management" },
                  ].map((s) => (
                    <span key={s.key} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                      {s.key} · {s.by}
                    </span>
                  ))}
                </div>
              </div>
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