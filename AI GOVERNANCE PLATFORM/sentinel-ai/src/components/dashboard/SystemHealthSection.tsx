"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface SystemHealthSectionProps {
  health: { status: string; successRate: number; errorRate: number; responseTime: number; uptime: number }
}

export function SystemHealthSection({ health }: SystemHealthSectionProps) {
  const metrics = [
    { label: "Overall Status", value: health.status, color: "bg-emerald-400" },
    { label: "Success Rate", value: `${health.successRate}%`, progress: health.successRate },
    { label: "Error Rate", value: `${health.errorRate}%`, progress: health.errorRate },
    { label: "Response Time", value: `${health.responseTime}ms`, progress: 65 },
    { label: "Uptime", value: `${health.uptime}%`, progress: health.uptime },
  ]

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="text-sm font-medium text-neutral-200">System Health</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {metrics.map((m) => (
            <div key={m.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-neutral-500">{m.label}</span>
                <span className={cn("text-xs font-semibold", m.label === "Error Rate" ? "text-red-400" : "text-emerald-400")}>
                  {m.value}
                </span>
              </div>
              {m.progress !== undefined && (
                <Progress value={m.progress} className={cn("h-1.5", m.label === "Error Rate" && "[&>div]:bg-red-400", m.label === "Response Time" && "[&>div]:bg-blue-400")} />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
