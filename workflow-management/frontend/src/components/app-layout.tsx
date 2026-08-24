"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { Building2, LayoutDashboard, ClipboardList, LogOut, Menu, X, Plus, Shield, Search, Wallet, FileEdit, Users, History, BarChart3 } from "lucide-react"
import { usePathname } from "next/navigation"
import { useState } from "react"

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/financial-dashboard", label: "Financial", icon: Wallet },
    { href: "/bookings", label: "Bookings (Control Sheet)", icon: ClipboardList },
    ...(user?.role === "sales" || user?.role === "crm" || user?.role === "admin" || user?.role === "super_admin" ? [{ href: "/bookings/new", label: "New Allocation", icon: Plus }] : []),
    { href: "/workflow-action", label: "Sale Deed Action", icon: Shield },
    { href: "/change-requests", label: "Change Requests", icon: FileEdit },
    { href: "/my-tasks", label: "My Tasks", icon: Users },
    { href: "/global-search", label: "Global Search (§88)", icon: Search },
    { href: "/audit-trail", label: "Audit Trail", icon: History },
    { href: "/workflow-page", label: "Spec v1.3.2", icon: BarChart3 },
    ...(user?.role === "admin" || user?.role === "super_admin" ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-900 shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-2.5 p-5 border-b dark:border-gray-800">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-base">Real Estate CRM</span>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 font-medium"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                }`}>
                <item.icon className="h-4 w-4" /> {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t dark:border-gray-800">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400">{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || user?.email}</p>
              <p className="text-gray-400 text-xs capitalize truncate">{user?.role?.replace(/_/g, " ")}</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-600 transition-colors w-full px-1 py-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="lg:hidden bg-white dark:bg-gray-900 border-b dark:border-gray-800 p-4 flex items-center">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="ml-2 font-semibold text-sm">Real Estate CRM</span>
        </header>
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
