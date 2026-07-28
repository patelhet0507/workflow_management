"use client"

import { motion } from "framer-motion"
import { Cpu, MemoryStick, HardDrive, Wifi, Activity } from "lucide-react"
import type { MetricsData } from "./use-telemetry"

function bar(value: number, color: string) {
  return (
    <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(value, 100)}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  )
}

export function LiveMetrics({ metrics, eventRate }: { metrics: MetricsData | null; eventRate: number }) {
  if (!metrics) {
    return <div className="text-xs text-neutral-600">Waiting for metrics...</div>
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-neutral-400"><Cpu className="h-3 w-3" /> CPU</div>
          <span className="text-neutral-200 font-mono">{metrics.cpuPercent}%</span>
        </div>
        {bar(metrics.cpuPercent, "bg-blue-500")}
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-neutral-400"><MemoryStick className="h-3 w-3" /> RAM</div>
          <span className="text-neutral-200 font-mono">{metrics.ramPercent}%</span>
        </div>
        {bar(metrics.ramPercent, "bg-emerald-500")}
      </div>
      <div className="col-span-2 flex items-center justify-between text-xs text-neutral-500 pt-1 border-t border-neutral-800/50">
        <span>RAM: {metrics.ramUsed}MB / {metrics.ramTotal}MB</span>
        <span>Uptime: {Math.floor(metrics.uptime / 60)}m</span>
      </div>
      <div className="col-span-2 flex items-center justify-between text-xs text-neutral-500">
        <span><Activity className="h-3 w-3 inline mr-1" />Events/s: {eventRate.toFixed(1)}</span>
      </div>
    </div>
  )
}
