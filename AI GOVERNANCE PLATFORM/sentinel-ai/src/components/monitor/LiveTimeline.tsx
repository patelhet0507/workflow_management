"use client"

import { useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Terminal, FileEdit, Search, Cpu, CheckCircle, XCircle, AlertTriangle, RefreshCw, GitBranch, FileText, FilePlus, FileX, Play, Loader2 } from "lucide-react"
import type { TelemetryEvent } from "./use-telemetry"

const iconMap: Record<string, any> = {
  SessionStarted: Terminal,
  SessionFinished: XCircle,
  FileModified: FileEdit,
  FileChanged: FileText,
  LLMRequest: Cpu,
  LLMResponse: CheckCircle,
  Error: XCircle,
  Warning: AlertTriangle,
  Retry: RefreshCw,
  GitCommand: GitBranch,
  BuildStarted: Play,
  BuildFinished: CheckCircle,
  Search: Search,
  ShellCommand: Terminal,
}

const colorMap: Record<string, string> = {
  SessionStarted: "text-blue-400",
  SessionFinished: "text-neutral-500",
  FileModified: "text-emerald-400",
  FileChanged: "text-amber-400",
  LLMRequest: "text-purple-400",
  LLMResponse: "text-green-400",
  Error: "text-red-400",
  Warning: "text-amber-400",
  Retry: "text-cyan-400",
  GitCommand: "text-indigo-400",
  BuildStarted: "text-yellow-400",
  BuildFinished: "text-green-400",
  Search: "text-sky-400",
  ShellCommand: "text-neutral-400",
}

export function LiveTimeline({ events }: { events: TelemetryEvent[] }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  return (
    <div className="space-y-1">
      <AnimatePresence mode="popLayout">
        {events.map((ev, i) => {
          const Icon = iconMap[ev.eventType] || Terminal
          const color = colorMap[ev.eventType] || "text-neutral-400"
          const time = new Date(ev.timestamp).toLocaleTimeString("en-US", { hour12: false })
          return (
            <motion.div
              key={ev.eventId}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2 text-xs py-0.5"
            >
              <span className="text-neutral-600 w-16 shrink-0 font-mono">{time}</span>
              <Icon className={`h-3 w-3 shrink-0 ${color}`} />
              <span className="text-neutral-300 truncate">{ev.eventType}</span>
              {ev.metadata?.file && <span className="text-neutral-500 truncate">{ev.metadata.file}</span>}
            </motion.div>
          )
        })}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  )
}
