"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { api } from "@/lib/api"
import AppLayout from "@/components/app-layout"
import { ClipboardList, Clock, CheckCircle2, XCircle } from "lucide-react"

const cards = [
  { key: "total_bookings", label: "Total Bookings", icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/50" },
  { key: "pending_approvals", label: "Pending Approvals", icon: Clock, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/50" },
  { key: "completed", label: "Completed", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/50" },
  { key: "rejected", label: "Rejected", icon: XCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/50" },
]

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({ total_bookings: 0, pending_approvals: 0, completed: 0, rejected: 0 })

  useEffect(() => {
    if (!isLoading && !user) return void router.push("/login")
    if (user) api.getDashboardStats(user.id, user.role).then(setStats).catch(console.error)
  }, [user, isLoading, router])

  if (isLoading || !user) return null

  return (
    <AppLayout>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span className="w-1 h-6 bg-blue-600 rounded-full inline-block" />
          Dashboard
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(({ key, label, icon: Icon, color, bg }) => (
            <div key={key} className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm ring-1 ring-gray-200 dark:ring-gray-800">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
              </div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
              <p className="text-2xl font-bold mt-1">{(stats as any)[key]}</p>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
