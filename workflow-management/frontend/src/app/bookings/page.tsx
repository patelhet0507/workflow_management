"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { api } from "@/lib/api"
import { statusLabel } from "@/lib/constants"
import AppLayout from "@/components/app-layout"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, ClipboardList } from "lucide-react"

const statusColors: Record<string, "default" | "secondary" | "success" | "destructive" | "outline"> = {
  completed: "success", rejected: "destructive", archived: "secondary",
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
    b.project_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.unit_no?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F4E8] via-[#EDE6CE] to-[#F0E8D4] text-[#141623] relative">
      <div className="mesh-gradient" />
      <div className="max-w-6xl mx-auto px-6 py-10 relative z-10">
        <AppLayout>
          <div className="max-w-5xl space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C5A05A]/20 to-[#8A6F3B]/10 flex items-center justify-center border border-[#C5A05A]/20">
                  <ClipboardList size={16} className="text-[#8A6F3B]" />
                </span>
                <h1 className="font-editorial text-4xl text-[#141623]">Bookings</h1>
              </div>
              {(user.role === "sales" || user.role === "crm" || user.role === "admin" || user.role === "super_admin") && (
                <Link href="/bookings/new" className="btn-luxury inline-flex items-center gap-1.5 text-xs uppercase tracking-widest">
                  <Plus className="w-4 h-4" /> New Allocation
                </Link>
              )}
            </div>

            <div className="glass-card p-5">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C5A05A]" />
                <input type="text" placeholder="Search by customer, project or unit..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 flex h-9 w-full rounded-xl border border-[#C5A05A]/20 bg-white/60 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A05A]/20" />
              </div>
            </div>

            <div className="glass-card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-[#141623]/5 to-transparent"><tr>
                    <th className="text-left p-3 font-semibold text-[#8A7E6E] text-xs uppercase tracking-wider">Customer</th>
                    <th className="text-left p-3 font-semibold text-[#8A7E6E] text-xs uppercase tracking-wider">Project · Unit</th>
                    <th className="text-left p-3 font-semibold text-[#8A7E6E] text-xs uppercase tracking-wider">Status</th>
                    <th className="text-left p-3 font-semibold text-[#8A7E6E] text-xs uppercase tracking-wider">Lifecycle</th>
                    <th className="text-left p-3 font-semibold text-[#8A7E6E] text-xs uppercase tracking-wider">Plan</th>
                    <th className="text-left p-3"></th>
                  </tr></thead>
                  <tbody className="divide-y divide-[#EDE6CE]/60">
                    {filtered.map((b) => (
                      <tr key={b.id} className="hover:bg-[#C5A05A]/5 transition-colors">
                        <td className="p-3 font-medium text-[#141623]">{b.client_name} {b.is_direct_sale_deed && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">Direct</span>}{b.previous_cancelled_transaction_id && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Rebooking</span>}</td>
                        <td className="p-3 text-[#5B5340] text-xs">{b.project_name} · <span className="font-semibold text-[#141623]">{b.unit_no}</span></td>
                        <td className="p-3"><Badge variant={statusColors[b.status] || "outline"}>{statusLabel(b.status)}</Badge></td>
                        <td className="p-3"><span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${b.lifecycle_status==="CANCELLED"?"bg-red-50 text-red-700 border-red-200": b.lifecycle_status==="SUPERSEDED"?"bg-amber-50 text-amber-700 border-amber-200":"bg-emerald-50 text-emerald-700 border-emerald-200"}`}>{b.lifecycle_status||"ACTIVE"}</span></td>
                        <td className="p-3 text-[#8A7E6E] text-xs">{b.payment_plan || "-"}</td>
                        <td className="p-3"><Link href={`/bookings/${b.id}`} className="text-[#8A6F3B] hover:text-[#141623] text-xs font-medium border border-[#C5A05A]/20 px-2.5 py-1 rounded-full hover:bg-[#C5A05A]/10 transition">View →</Link></td>
                      </tr>
                    ))}
                    {filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-[#8A7E6E] text-sm">No bookings found — create the first Allocation.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </AppLayout>
      </div>
    </div>
  )
}
