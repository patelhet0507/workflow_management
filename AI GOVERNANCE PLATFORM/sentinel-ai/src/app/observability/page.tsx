"use client"

import { motion } from "framer-motion"
import { Activity, Gauge, Zap, Users, Clock, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useObservability } from "@/hooks/use-api"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export default function ObservabilityPage() {
  const { data: obsData } = useObservability()
  const metrics = obsData?.metrics || { avgLatency: 0, p95Latency: 0, throughput: 0, errorRate: 0, retryRate: 0, activeConnections: 0 }
  const latencyData = obsData?.latencyByHour || []
  const throughputData = obsData?.throughputByHour || []
  const slos = obsData?.slo || []
  return (
    <div className="space-y-6 p-4 lg:p-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-50">Observability</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Real-time performance metrics and monitoring</p>
        </div>
        <Tabs defaultValue="1h">
          <TabsList className="h-8">
            <TabsTrigger value="1h" className="text-[11px]">1H</TabsTrigger>
            <TabsTrigger value="6h" className="text-[11px]">6H</TabsTrigger>
            <TabsTrigger value="24h" className="text-[11px]">24H</TabsTrigger>
            <TabsTrigger value="7d" className="text-[11px]">7D</TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: "Avg Latency", value: `${metrics.avgLatency}ms`, icon: Clock, color: "text-blue-400" },
          { label: "P95 Latency", value: `${metrics.p95Latency}ms`, icon: Gauge, color: "text-amber-400" },
          { label: "Throughput", value: `${metrics.throughput}/s`, icon: Zap, color: "text-emerald-400" },
          { label: "Error Rate", value: `${metrics.errorRate}%`, icon: AlertTriangle, color: "text-red-400" },
          { label: "Retry Rate", value: `${metrics.retryRate}%`, icon: Activity, color: "text-purple-400" },
          { label: "Active Connections", value: `${metrics.activeConnections}`, icon: Users, color: "text-cyan-400" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider">{stat.label}</span>
                <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
              </div>
              <p className="text-lg font-semibold text-neutral-50">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-200">Latency (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={latencyData}>
                  <defs>
                    <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis dataKey="time" tick={{ fill: '#737373', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#737373', fontSize: 10 }} axisLine={false} tickLine={false} unit="ms" />
                  <Tooltip
                    contentStyle={{ background: "#171717", border: "1px solid #262626", borderRadius: "8px" }}
                    labelStyle={{ color: "#a3a3a3" }}
                  />
                  <Area type="monotone" dataKey="latency" stroke="#3b82f6" strokeWidth={2} fill="url(#latencyGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-200">Throughput (requests/s)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={throughputData}>
                  <defs>
                    <linearGradient id="throughputGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis dataKey="time" tick={{ fill: '#737373', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#737373', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#171717", border: "1px solid #262626", borderRadius: "8px" }}
                    labelStyle={{ color: "#a3a3a3" }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} fill="url(#throughputGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-neutral-200">SLO Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(slos.length ? slos : [
              { label: "Availability SLO", current: 99.97, target: 99.95 },
              { label: "Latency SLO (P95 < 1s)", current: 99.82, target: 99.00 },
              { label: "Error Rate SLO", current: 97.80, target: 99.00 },
            ]).map((slo: any) => {
              const pct = (slo.current / slo.target) * 100
              const met = slo.current >= slo.target
              return (
                <div key={slo.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-400">{slo.label}</span>
                    <Badge variant={met ? "success" : "warning"} className="text-[9px]">{met ? "Met" : "At Risk"}</Badge>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-neutral-50">{slo.current}%</span>
                    <span className="text-xs text-neutral-600">target {slo.target}%</span>
                  </div>
                  <Progress value={Math.min(pct, 100)} className={cn("h-1.5", met ? "[&>div]:bg-emerald-400" : "[&>div]:bg-amber-400")} />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
