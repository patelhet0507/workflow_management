"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "./Sidebar"
import { TopNav } from "./TopNav"
import { Footer } from "./Footer"
import { Providers } from "@/app/providers"
import { cn } from "@/lib/utils"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isAuth = pathname?.startsWith("/auth/")
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    const val = localStorage.getItem("sidebar-collapsed")
    if (val === "true") setSidebarCollapsed(true)
    const handler = () => {
      const v = localStorage.getItem("sidebar-collapsed")
      setSidebarCollapsed(v === "true")
    }
    window.addEventListener("sidebar-collapse", handler)
    return () => window.removeEventListener("sidebar-collapse", handler)
  }, [])
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(sidebarCollapsed))
  }, [sidebarCollapsed])

  if (!mounted || isAuth) return <Providers><div className="min-h-screen bg-[#0a0a0a]">{children}</div></Providers>

  return (
    <Providers>
      <div className="flex h-screen overflow-hidden bg-neutral-950">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <div className={cn(
          "flex flex-1 flex-col transition-all duration-300",
          sidebarCollapsed ? "lg:ml-[60px]" : "lg:ml-[240px]"
        )}>
          <TopNav onMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
          <Footer collapsed={sidebarCollapsed} />
        </div>
      </div>
    </Providers>
  )
}
