"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { Building2, LayoutDashboard, ClipboardList, LogOut, Menu, X, Plus, Shield } from "lucide-react"
import { useState } from "react"

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/bookings", label: "Bookings", icon: ClipboardList },
    { href: "/bookings/new", label: "New Booking", icon: Plus },
    ...(user?.role === "super_admin" ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-900 shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-2 p-4 border-b dark:border-gray-800">
          <Building2 className="h-6 w-6 text-blue-600" />
          <span className="font-semibold text-lg">Real Estate CRM</span>
        </div>
        <nav className="p-2 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              <item.icon className="h-4 w-4" /> {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t dark:border-gray-800">
          <div className="text-sm mb-2">
            <p className="font-medium">{user?.name || user?.email}</p>
            <p className="text-gray-500 text-xs capitalize">{user?.role?.replace("_", " ")}</p>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors w-full">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="lg:hidden bg-white dark:bg-gray-900 shadow-sm p-4 flex items-center">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="ml-2 font-semibold">Real Estate CRM</span>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
