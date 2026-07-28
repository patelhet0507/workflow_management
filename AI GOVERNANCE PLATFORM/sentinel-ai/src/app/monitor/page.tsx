"use client"

import { useTelemetry } from "@/components/monitor/use-telemetry"
import { LiveTimeline } from "@/components/monitor/LiveTimeline"
import { LiveMetrics } from "@/components/monitor/LiveMetrics"
import { LiveActivity } from "@/components/monitor/LiveActivity"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Activity, Radio } from "lucide-react"

export default function MonitorPage() {
  const { timeline, metrics, connected, session, totalEvents } = useTelemetry()

  const eventRate = timeline.length > 0
    ? timeline.slice(0, Math.min(10, timeline.length)).reduce((sum, ev, i, arr) => {
        if (i === 0) return 0
        const ms = new Date(arr[0].timestamp).getTime() - new Date(ev.timestamp).getTime()
        return ms > 0 ? (i / (ms / 1000)) : 0
      }, 0)
    : 0

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-800">
            <Radio className="h-4 w-4 text-neutral-300" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-neutral-50">Runtime Monitor</h1>
            <p className="text-xs text-neutral-500">Real-time AI agent telemetry</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-[10px] px-2", connected ? "border-emerald-800/30 text-emerald-400" : "border-red-800/30 text-red-400")}>
            <span className={cn("h-1.5 w-1.5 rounded-full mr-1.5", connected ? "bg-emerald-400" : "bg-red-400")} />
            {connected ? "Live" : "Disconnected"}
          </Badge>
          <Badge variant="outline" className="text-[10px] px-2 text-neutral-400 border-neutral-800">
            {totalEvents} events
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-neutral-400">Current Activity</CardTitle></CardHeader>
            <CardContent><LiveActivity events={timeline} /></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-neutral-400">System Metrics</CardTitle></CardHeader>
            <CardContent><LiveMetrics metrics={metrics} eventRate={eventRate} /></CardContent>
          </Card>
          {session && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-neutral-400">Session</CardTitle></CardHeader>
              <CardContent className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-neutral-500">Branch</span><span className="text-neutral-300">{session.gitBranch}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Dir</span><span className="text-neutral-300 truncate max-w-[140px]">{session.cwd?.split("\\").pop()}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">OS</span><span className="text-neutral-300">{session.os}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Node</span><span className="text-neutral-300">{session.nodeVersion}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">CPU</span><span className="text-neutral-300">{session.cpu}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">RAM</span><span className="text-neutral-300">{session.totalMemory}</span></div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-neutral-400">Event Timeline</CardTitle>
                <Badge variant="outline" className="text-[10px] px-2 text-neutral-500 border-neutral-800">
                  <Activity className="h-3 w-3 mr-1" /> {(eventRate || 0).toFixed(1)}/s
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <LiveTimeline events={timeline} />
              {timeline.length === 0 && (
                <div className="text-center py-12 text-sm text-neutral-600">
                  {connected ? "Waiting for telemetry... Start sentinel monitor in your terminal." : "Not connected. Start the collector with:\n  $env:SENTINEL_API_KEY=\"sk-...\"\n  npm run sentinel monitor"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
