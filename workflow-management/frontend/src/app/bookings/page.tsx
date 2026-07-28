"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { api } from "@/lib/api"
import AppLayout from "@/components/app-layout"
import { Badge } from "@/components/ui/badge"
import { Search, Plus } from "lucide-react"

const statusColors: Record<string, "default" | "secondary" | "success" | "destructive" | "outline"> = {
  booking_created: "secondary", kyc_approved: "default", crm_approved: "outline", cso_approved: "default", completed: "success", rejected: "destructive",
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
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span className="w-1 h-6 bg-blue-600 rounded-full inline-block" />
          Bookings
        </h1>
        {(user.role === "data_entry" || user.role === "super_admin") && (
          <Link href="/bookings/new" className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-sm font-medium bg-blue-600 text-white shadow hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" /> New Booking
          </Link>
        )}
      </div>
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search by customer or project..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="pl-9 flex h-9 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-1 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50"><tr>
            <th className="text-left p-3 font-medium text-gray-500">Customer</th>
            <th className="text-left p-3 font-medium text-gray-500">Project</th>
            <th className="text-left p-3 font-medium text-gray-500">Status</th>
            <th className="text-left p-3 font-medium text-gray-500">Plan</th>
            <th className="text-left p-3 font-medium text-gray-500"></th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map((b) => {
              const stageIdx = ["booking_created", "kyc_approved", "crm_approved", "cso_approved", "completed"].indexOf(b.status)
              const stageLabel = stageIdx >= 0 ? ["Created", "KYC", "CRM", "CSO", "Done"][stageIdx] : b.status
              return (
                <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="p-3 font-medium">{b.client_name}</td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">{b.project_name}</td>
                  <td className="p-3"><Badge variant={statusColors[b.status] || "outline"}>{stageLabel}</Badge></td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">{b.payment_plan || "-"}</td>
                  <td className="p-3"><Link href={`/bookings/${b.id}`} className="text-blue-600 hover:text-blue-700 text-xs font-medium">View →</Link></td>
                </tr>
              )
            })}
            {filtered.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">No bookings found</td></tr>}
          </tbody>
        </table>
      </div>
    </AppLayout>
  )
}
