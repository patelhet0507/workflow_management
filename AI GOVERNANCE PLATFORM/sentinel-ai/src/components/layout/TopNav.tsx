"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { motion } from "framer-motion"
import {
  Search, Bell, ChevronDown, Menu,
  Settings, Link, HelpCircle, LogOut,
  Check, Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface TopNavProps {
  onMenuClick: () => void
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [workspace, setWorkspace] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [notifOpen, setNotifOpen] = useState(false)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    fetch("/api/workspace").then(r => r.ok && r.json()).then(setWorkspace)
    fetch("/api/alerts").then(r => r.ok && r.json()).then(d => setAlerts(Array.isArray(d) ? d : []))
  }, [])

  const initials = user?.email?.substring(0, 2).toUpperCase() || "SA"
  const email = user?.email || "admin@sentinel.ai"
  const plan = workspace?.plan ? `${workspace.plan} Plan` : "Enterprise Plan"
  const unreadCount = alerts.filter(a => a.status === "open" || a.status === "investigating").length

  async function signOut() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-xl px-4 lg:px-6">
      <button onClick={onMenuClick} className="lg:hidden -ml-2 flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800">
        <Menu className="h-4 w-4" />
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 gap-2 px-2 text-sm font-medium text-neutral-200 hover:bg-neutral-800">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-900/30">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            {workspace?.name || "Workspace"}
            <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Current Workspace</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {workspace && (
            <DropdownMenuItem className="gap-2 cursor-default">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-900/30">
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{workspace.name}</p>
                <p className="text-[11px] text-neutral-500">{workspace.plan} · {workspace.region}</p>
              </div>
              <Check className="h-4 w-4 text-emerald-400" />
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2 text-neutral-400">
            <Plus className="h-4 w-4" />
            Create Workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex-1" />

      <div className={cn(
        "relative transition-all duration-200",
        searchOpen ? "w-72" : "w-60"
      )}>
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
        <Input
          placeholder="Search agents, activities..."
          className="h-8 pl-8 pr-3 text-sm bg-neutral-900/50 border-neutral-800 focus-visible:ring-neutral-700"
          onFocus={() => setSearchOpen(true)}
          onBlur={() => setSearchOpen(false)}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex">
          <kbd className="inline-flex items-center rounded border border-neutral-800 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 bg-neutral-900">
            ⌘K
          </kbd>
        </div>
      </div>

      <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-8 w-8 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-medium text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Notifications</span>
            <Button variant="ghost" size="sm" className="h-6 text-[11px] text-neutral-400" onClick={() => setNotifOpen(false)}>Mark all read</Button>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="max-h-72 overflow-y-auto">
            {alerts.length === 0 && (
              <div className="px-3 py-6 text-center text-xs text-neutral-500">No notifications</div>
            )}
            {alerts.slice(0, 10).map((a) => (
              <DropdownMenuItem key={a.id} className={cn(
                "flex flex-col items-start gap-1 px-3 py-2.5 cursor-pointer",
                (a.status === "open" || a.status === "investigating") && "bg-neutral-800/30"
              )}>
                <div className="flex w-full items-center gap-2">
                  <div className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    a.severity === "critical" || a.type === "critical" ? "bg-red-400"
                      : a.severity === "high" || a.type === "warning" ? "bg-amber-400"
                      : "bg-blue-400"
                  )} />
                  <span className="text-sm font-medium flex-1">{a.agent || "Alert"}</span>
                  <span className="text-[10px] text-neutral-500">{a.time ? new Date(a.time + "Z").toLocaleDateString() : ""}</span>
                </div>
                <p className="text-xs text-neutral-400 pl-4">{a.message || a.type}</p>
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 gap-2 px-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px] bg-gradient-to-br from-blue-500 to-purple-600 text-white">{initials}</AvatarFallback>
            </Avatar>
            <ChevronDown className="h-3.5 w-3.5 hidden sm:block" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{email}</span>
              <span className="text-[11px] font-normal text-neutral-500">{plan}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2" onClick={() => router.push("/settings")}><Settings className="h-4 w-4" /> Settings</DropdownMenuItem>
          <DropdownMenuItem className="gap-2" onClick={() => router.push("/settings?tab=api-keys")}><Link className="h-4 w-4" /> API Keys</DropdownMenuItem>
          <DropdownMenuItem className="gap-2"><HelpCircle className="h-4 w-4" /> Documentation</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2 text-red-400" onClick={signOut}><LogOut className="h-4 w-4" /> Sign Out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
