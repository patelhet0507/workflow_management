"use client"

import { motion } from "framer-motion"
import { StatsCards } from "@/components/dashboard/StatsCards"
import { SystemHealthSection } from "@/components/dashboard/SystemHealthSection"
import { AgentExecutionsChart } from "@/components/dashboard/AgentExecutionsChart"
import { TokenConsumptionChart } from "@/components/dashboard/TokenConsumptionChart"
import { CostPerDayChart } from "@/components/dashboard/CostPerDayChart"
import { AgentSuccessRateChart } from "@/components/dashboard/AgentSuccessRateChart"
import { RecentActivityTable } from "@/components/dashboard/RecentActivityTable"
import { AgentOverviewCards } from "@/components/dashboard/AgentOverviewCards"
import { RecentAlerts } from "@/components/dashboard/RecentAlerts"
import { SystemHealthWidget } from "@/components/dashboard/SystemHealthWidget"
import { useDashboardStats, useActivity, useAlerts, useAgents, useTokenAnalytics, useCostAnalytics } from "@/hooks/use-api"
import { useTelemetry } from "@/components/monitor/use-telemetry"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Radio } from "lucide-react"

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.3 } }),
}

export default function DashboardPage() {
  const { data: dashData, isLoading: dashLoading } = useDashboardStats()
  const { data: activity } = useActivity(25)
  const { data: alerts } = useAlerts()
  const { data: agents } = useAgents()
  const { data: tokens } = useTokenAnalytics()
  const { data: cost } = useCostAnalytics()
  const { timeline: liveEvents, connected } = useTelemetry()

  const stats = dashData?.stats || []
  const executions = dashData?.executions || []
  const successRate = dashData?.successRate || { successful: 94, failed: 4, warning: 2 }
  const health = dashData?.systemHealth || { status: "healthy", successRate: 98, errorRate: 2, responseTime: 247, uptime: 99.97 }

  const mergedActivity = [
    ...liveEvents.map(ev => ({
      id: ev.eventId,
      time: ev.timestamp,
      agent: ev.metadata?.agent || ev.metadata?.runtime || "collector",
      action: ev.eventType,
      status: ev.severity === "critical" ? "failed" : "success",
      duration: ev.duration || 0,
      cost: ev.metadata?.cost || 0,
    })),
    ...(activity || []).filter((a: any) => !liveEvents.some(l => l.eventId === a.id)),
  ].slice(0, 25)

  return (
    <div className="min-h-full space-y-6 p-4 lg:p-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-50">Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Monitor your AI agents in real-time</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900/50 px-2.5 py-1.5">
          <span className={cn("h-1.5 w-1.5 rounded-full", connected ? "bg-emerald-400" : "bg-red-400")} />
          <span className="text-[11px] text-neutral-400">{connected ? "Live" : "Disconnected"}</span>
        </div>
      </motion.div>

      {dashLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl border border-neutral-800 bg-neutral-900/50 animate-pulse" />
          ))}
        </div>
      ) : (
        <StatsCards stats={stats} />
      )}

      <motion.div custom={1} variants={fadeIn} initial="hidden" animate="visible">
        <SystemHealthSection health={health} />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div custom={2} variants={fadeIn} initial="hidden" animate="visible" className="md:col-span-2">
          <AgentExecutionsChart data={executions} />
        </motion.div>
        <motion.div custom={3} variants={fadeIn} initial="hidden" animate="visible">
          <AgentSuccessRateChart data={successRate} />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div custom={4} variants={fadeIn} initial="hidden" animate="visible">
          <TokenConsumptionChart data={tokens || []} />
        </motion.div>
        <motion.div custom={5} variants={fadeIn} initial="hidden" animate="visible">
          <CostPerDayChart data={cost || []} />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <motion.div custom={6} variants={fadeIn} initial="hidden" animate="visible" className="xl:col-span-2">
          <RecentActivityTable data={mergedActivity} />
        </motion.div>
        <motion.div custom={7} variants={fadeIn} initial="hidden" animate="visible" className="space-y-4">
          <RecentAlerts data={alerts || []} />
          <SystemHealthWidget health={health} />
        </motion.div>
      </div>

      <motion.div custom={8} variants={fadeIn} initial="hidden" animate="visible">
        <AgentOverviewCards agents={agents || []} />
      </motion.div>
    </div>
  )
}
