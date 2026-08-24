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
    { href: "/bookings", label: "Bookings", icon: ClipboardList },
    ...(user?.role === "sales" || user?.role === "crm" || user?.role === "admin" || user?.role === "super_admin" ? [{ href: "/bookings/new", label: "New Allocation", icon: Plus }] : []),
    { href: "/workflow-action", label: "Sale Deed Action", icon: Shield },
    { href: "/change-requests", label: "Change Requests", icon: FileEdit },
    { href: "/my-tasks", label: "My Tasks", icon: Users },
    { href: "/global-search", label: "Global Search", icon: Search },
    { href: "/audit-trail", label: "Audit Trail", icon: History },
    { href: "/workflow-page", label: "Spec v1.3.2", icon: BarChart3 },
    ...(user?.role === "admin" || user?.role === "super_admin" ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
  ]

  return (
    <div className="min-h-screen flex">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white/80 backdrop-blur-xl border-r border-[#C5A05A]/15 shadow-[4px_0_24px_rgba(197,160,90,0.08)] transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-2.5 p-5 border-b border-[#C5A05A]/10">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#141623] to-[#1a1c2e] flex items-center justify-center border border-[#C5A05A]/20">
            <Building2 className="h-4 w-4 text-[#C5A05A]" />
          </div>
          <span className="font-editorial font-semibold text-base text-[#141623]">Real Estate CRM</span>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-[#C5A05A]/15 to-[#C5A05A]/5 text-[#141623] font-medium border border-[#C5A05A]/20 shadow-sm"
                    : "text-[#8A7E6E] hover:bg-[#C5A05A]/5 hover:text-[#141623]"
                }`}>
                <item.icon className={`h-4 w-4 ${isActive ? "text-[#8A6F3B]" : ""}`} /> {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#C5A05A]/10 bg-gradient-to-t from-white/60 to-transparent">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C5A05A]/20 to-[#8A6F3B]/10 flex items-center justify-center border border-[#C5A05A]/20">
              <span className="text-xs font-bold text-[#8A6F3B]">{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-[#141623]">{user?.name || user?.email}</p>
              <p className="text-[#8A7E6E] text-xs capitalize truncate">{user?.role?.replace(/_/g, " ")}</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-sm text-[#8A7E6E] hover:text-red-600 transition-colors w-full px-1 py-1.5 rounded-lg hover:bg-red-50">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="lg:hidden bg-white/80 backdrop-blur-xl border-b border-[#C5A05A]/10 p-4 flex items-center">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-[#C5A05A]/10">
            {sidebarOpen ? <X className="h-5 w-5 text-[#8A6F3B]" /> : <Menu className="h-5 w-5 text-[#8A6F3B]" />}
          </button>
          <span className="ml-2 font-editorial font-semibold text-sm text-[#141623]">Real Estate CRM</span>
        </header>
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
