"use client"

import { motion } from "framer-motion"
import { Activity, Bot, FileEdit, Cpu, Search, Terminal, GitBranch, Loader2 } from "lucide-react"
import type { TelemetryEvent } from "./use-telemetry"

export function LiveActivity({ events }: { events: TelemetryEvent[] }) {
  const lastEvent = events[0]
  const recentTypes = events.slice(0, 10).map(e => e.eventType)
  const current = lastEvent?.eventType || "Idle"

  const activityIcon: Record<string, any> = {
    FileModified: FileEdit,
    FileChanged: FileEdit,
    LLMRequest: Cpu,
    LLMResponse: Bot,
    Search: Search,
    ShellCommand: Terminal,
    GitCommand: GitBranch,
    SessionStarted: Activity,
    BuildStarted: Loader2,
  }

  const Icon = activityIcon[current] || Activity

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <motion.div
          key={current}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-800"
        >
          <Icon className="h-5 w-5 text-neutral-300" />
        </motion.div>
        <div>
          <motion.p key={current} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-medium text-neutral-200">
            {current}
          </motion.p>
          <p className="text-[11px] text-neutral-500">
            {lastEvent?.metadata?.file ? `File: ${lastEvent.metadata.file}` : lastEvent?.eventType ? `Recent: ${current}` : "Waiting for activity..."}
          </p>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-[10px] text-neutral-600 uppercase tracking-wider">Recent Activity</p>
        {recentTypes.map((type, i) => (
          <div key={`${type}-${i}`} className="flex items-center gap-2 text-[11px] text-neutral-400">
            <div className="h-1 w-1 rounded-full bg-neutral-700" />
            {type}
          </div>
        ))}
      </div>
    </div>
  )
}
