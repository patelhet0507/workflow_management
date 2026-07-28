"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import {
  LayoutDashboard, Bot, Activity, Brain, Shield,
  ShieldCheck, Eye, BarChart3, Users, CreditCard,
  Settings, ChevronLeft, ChevronRight, Radio,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useAgents, useAlerts } from "@/hooks/use-api"

interface NavItem {
  label: string
  icon: LucideIcon
  href: string
}

const mainNav: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Agents", icon: Bot, href: "/agents" },
  { label: "Activity", icon: Activity, href: "/activity" },
  { label: "Memory", icon: Brain, href: "/memory" },
  { label: "Policies", icon: Shield, href: "/policies" },
  { label: "Security", icon: ShieldCheck, href: "/security" },
  { label: "Monitor", icon: Radio, href: "/monitor" },
  { label: "Observability", icon: Eye, href: "/observability" },
  { label: "Analytics", icon: BarChart3, href: "/analytics" },
  { label: "Users", icon: Users, href: "/users" },
  { label: "Billing", icon: CreditCard, href: "/billing" },
  { label: "Settings", icon: Settings, href: "/settings" },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const { data: agents } = useAgents()
  const { data: alerts } = useAlerts()
  const [workspace, setWorkspace] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState("User")

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        supabase.from("users").select("role").eq("auth_id", data.user.id).maybeSingle().then(({ data: u }) => {
          if (u?.role) setRole(u.role)
        })
      }
    })
    fetch("/api/workspace").then(r => r.ok && r.json()).then(setWorkspace)
  }, [])

  const agentCount = Array.isArray(agents) ? agents.length : null
  const alertCount = Array.isArray(alerts) ? alerts.length : null
  const initials = user?.email?.substring(0, 2).toUpperCase() || "SA"
  const email = user?.email || "admin@sentinel.ai"
  const plan = workspace?.plan ? `${workspace.plan} Plan` : "Enterprise Plan"

  function badgeFor(href: string): string | null {
    if (href === "/agents" && agentCount !== null) return String(agentCount)
    if (href === "/security" && alertCount !== null) return String(alertCount)
    return null
  }

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full flex-col border-r border-neutral-800 bg-neutral-950 transition-all duration-300",
          collapsed ? "w-[60px]" : "w-[240px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className={cn("flex h-14 items-center border-b border-neutral-800 px-4", collapsed && "justify-center")}>
          {!collapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-50">
                <ShieldCheck className="h-4 w-4 text-neutral-950" />
              </div>
              <span className="text-sm font-semibold text-neutral-50 whitespace-nowrap">Sentinel AI</span>
            </div>
          )}
          {collapsed && (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-50">
              <ShieldCheck className="h-4 w-4 text-neutral-950" />
            </div>
          )}
          <button
            onClick={onToggle}
            className={cn(
              "hidden lg:flex ml-auto h-6 w-6 items-center justify-center rounded-md text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800",
              collapsed && "ml-0"
            )}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <ScrollArea className="flex-1 px-2 py-3">
          <nav className="flex flex-col gap-1">
            {mainNav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/")
              const badge = badgeFor(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-neutral-800/70 text-neutral-50"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="truncate">{item.label}</span>
                      {badge && (
                        <span className="ml-auto inline-flex items-center justify-center rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] font-medium text-neutral-300">
                          {badge}
                        </span>
                      )}
                    </>
                  )}
                  {collapsed && badge && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-medium text-white">
                      {badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          <Separator className="my-4" />

          {!collapsed && workspace && (
            <div className="px-3 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">Workspace</p>
              <div className="mt-2">
                <div className="flex items-center gap-2 rounded-lg px-3 py-2 bg-emerald-900/20 text-emerald-400">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-xs font-medium">{workspace.name}</span>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        <div className={cn("border-t border-neutral-800 p-3", collapsed && "flex justify-center")}>
          {!collapsed ? (
            <div className="flex items-center gap-3 rounded-lg bg-neutral-800/30 p-2.5">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                {initials}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-medium text-neutral-200 truncate">{email}</p>
                <p className="text-[10px] text-neutral-500 truncate flex items-center gap-1">
                  <span className={cn("inline-block h-1.5 w-1.5 rounded-full", role === "Admin" ? "bg-purple-400" : "bg-blue-400")} />
                  {role}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
              {initials}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
