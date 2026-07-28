"use client"

import { motion } from "framer-motion"
import { AlertTriangle, ShieldAlert, Info, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { timeAgo } from "@/lib/utils"
import { cn } from "@/lib/utils"

const alertConfig: Record<string, { icon: any; color: string; bg: string; border: string; badge: "destructive" | "warning" | "secondary" }> = {
  critical: { icon: ShieldAlert, color: "text-red-400", bg: "bg-red-900/10", border: "border-red-900/30", badge: "destructive" },
  warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-900/10", border: "border-amber-900/30", badge: "warning" },
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-900/10", border: "border-blue-900/30", badge: "secondary" },
}

interface RecentAlertsProps {
  data: { id: string; type: string; message: string; agent: string; time: string | Date }[]
}

export function RecentAlerts({ data }: RecentAlertsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-neutral-200">Recent Alerts</CardTitle>
          <Badge variant="secondary" className="text-[10px]">{data.length} active</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[280px]">
          <div className="px-4 pb-4 space-y-2">
            {data.length === 0 ? (
              <p className="text-sm text-neutral-500 py-4 text-center">No alerts</p>
            ) : (
              data.map((alert, i) => {
                const config = alertConfig[alert.type] || alertConfig.info
                const Icon = config.icon
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn("group relative flex items-start gap-3 rounded-lg border p-3 transition-colors hover:border-neutral-700", config.bg, config.border)}
                  >
                    <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", config.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-neutral-200">{alert.agent}</span>
                        <Badge variant={config.badge} className="text-[9px] px-1 py-0">{alert.type}</Badge>
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">{alert.message}</p>
                      <p className="text-[10px] text-neutral-600 mt-1">{timeAgo(alert.time)}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-neutral-300 absolute top-2 right-2">
                      <X className="h-3 w-3" />
                    </Button>
                  </motion.div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
