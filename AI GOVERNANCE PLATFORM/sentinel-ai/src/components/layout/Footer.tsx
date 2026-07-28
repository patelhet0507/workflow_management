"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface FooterProps {
  collapsed: boolean
}

export function Footer({ collapsed }: FooterProps) {
  const [workspace, setWorkspace] = useState<any>(null)

  useEffect(() => {
    fetch("/api/workspace").then(r => r.ok && r.json()).then(setWorkspace)
  }, [])

  if (collapsed) return null

  return (
    <footer className="border-t border-neutral-800 bg-neutral-950/50">
      <div className="flex h-10 items-center justify-between px-6">
        <div className="flex items-center gap-4 text-[11px] text-neutral-500">
          <span>Sentinel AI v2.4.1</span>
          <span className="h-3 w-px bg-neutral-800" />
          <span>{workspace?.name || "Workspace"}</span>
          <span className="h-3 w-px bg-neutral-800" />
          <span>{workspace?.region || "us-east-1"}</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-neutral-500">
          <span>Build 2847</span>
          <span className="h-3 w-px bg-neutral-800" />
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            All Systems Operational
          </span>
        </div>
      </div>
    </footer>
  )
}
