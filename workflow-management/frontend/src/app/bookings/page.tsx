"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { api } from "@/lib/api"
import AppLayout from "@/components/app-layout"
import { Badge } from "@/components/ui/badge"

const statusColors: Record<string, "default" | "secondary" | "success" | "destructive" | "outline"> = {
  booking_created: "secondary", kyc_verification: "default", crm_approval: "outline", completed: "success", rejected: "destructive",
}

export default function BookingsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [bookings, setBookings] = useState<any[]>([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (!isLoading && !user) return void router.push("/login")
    if (user) api.getBookings(user.id, user.role).then(setBookings).catch(console.error)
  }, [user, isLoading, router])

  if (isLoading || !user) return null

  const filtered = bookings.filter((b) =>
    b.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.project_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Bookings</h1>
        {(user.role === "data_entry" || user.role === "super_admin") && (
          <Link href="/bookings/new" className="inline-flex items-center justify-center h-9 px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90">New Booking</Link>
        )}
      </div>
      <input type="text" placeholder="Search by customer or project..." value={search} onChange={(e) => setSearch(e.target.value)}
        className="mb-4 flex h-9 w-full max-w-sm rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" />
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800"><tr>
            <th className="text-left p-3 font-medium">Customer</th>
            <th className="text-left p-3 font-medium">Project</th>
            <th className="text-left p-3 font-medium">Status</th>
            <th className="text-left p-3 font-medium">Plan</th>
            <th className="text-left p-3 font-medium">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {filtered.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="p-3">{b.client_name}</td>
                <td className="p-3">{b.project_name}</td>
                <td className="p-3"><Badge variant={statusColors[b.status] || "outline"}>{b.status}</Badge></td>
                <td className="p-3">{b.payment_plan || "-"}</td>
                <td className="p-3"><Link href={`/bookings/${b.id}`} className="text-blue-600 hover:underline">View</Link></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-500">No bookings found</td></tr>}
          </tbody>
        </table>
      </div>
    </AppLayout>
  )
}
