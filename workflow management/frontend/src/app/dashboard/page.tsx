"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { api } from "@/lib/api"
import AppLayout from "@/components/app-layout"

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({ total_bookings: 0, pending_approvals: 0, completed: 0, rejected: 0 })

  useEffect(() => {
    if (!isLoading && !user) return void router.push("/login")
    if (user) api.getDashboardStats().then(setStats).catch(console.error)
  }, [user, isLoading, router])

  if (isLoading || !user) return null

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"><p className="text-sm text-gray-500">Total Bookings</p><p className="text-3xl font-bold">{stats.total_bookings}</p></div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"><p className="text-sm text-gray-500">Pending Approvals</p><p className="text-3xl font-bold">{stats.pending_approvals}</p></div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"><p className="text-sm text-gray-500">Completed</p><p className="text-3xl font-bold">{stats.completed}</p></div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"><p className="text-sm text-gray-500">Rejected</p><p className="text-3xl font-bold">{stats.rejected}</p></div>
      </div>
    </AppLayout>
  )
}
