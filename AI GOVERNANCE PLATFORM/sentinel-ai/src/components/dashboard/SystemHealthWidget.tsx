"use client"

import { motion } from "framer-motion"
import { Cpu, MemoryStick as Memory, Monitor, Wifi, Database, GitBranch } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface SystemHealthWidgetProps {
  health?: { cpu?: number; ram?: number; gpu?: number; apiAvailability?: number; database?: number; queue?: number }
}

const defaultHealth = { cpu: 67, ram: 82, gpu: 45, apiAvailability: 99.97, database: 99.89, queue: 98.5 }

export function SystemHealthWidget({ health = defaultHealth }: SystemHealthWidgetProps) {
  const h = { ...defaultHealth, ...health }

  const metrics = [
    { label: "CPU", value: h.cpu, icon: Cpu, color: h.cpu > 80 ? "text-red-400" : h.cpu > 60 ? "text-amber-400" : "text-emerald-400" },
    { label: "RAM", value: h.ram, icon: Memory, color: h.ram > 80 ? "text-red-400" : h.ram > 60 ? "text-amber-400" : "text-emerald-400" },
    { label: "GPU", value: h.gpu, icon: Monitor, color: h.gpu > 80 ? "text-red-400" : h.gpu > 60 ? "text-amber-400" : "text-emerald-400" },
    { label: "API", value: h.apiAvailability, icon: Wifi, suffix: "%", color: "text-emerald-400" },
    { label: "Database", value: h.database, icon: Database, suffix: "%", color: "text-emerald-400" },
    { label: "Queue", value: h.queue, icon: GitBranch, suffix: "%", color: h.queue < 95 ? "text-amber-400" : "text-emerald-400" },
  ]

  const progressColor = (value: number) => {
    if (value > 80) return "[&>div]:bg-red-400"
    if (value > 60) return "[&>div]:bg-amber-400"
    return "[&>div]:bg-emerald-400"
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-neutral-200">Infrastructure</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((m, i) => {
            const Icon = m.icon
            const displayValue = m.suffix ? `${m.value}${m.suffix}` : `${m.value}%`
            return (
              <motion.div key={m.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon className={cn("h-3.5 w-3.5", m.color)} />
                    <span className="text-[11px] text-neutral-500">{m.label}</span>
                  </div>
                  <span className={cn("text-[11px] font-medium tabular-nums", m.color)}>{displayValue}</span>
                </div>
                <Progress value={m.suffix ? m.value : m.value} className={cn("h-1", progressColor(m.suffix ? 100 - m.value : m.value))} />
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
