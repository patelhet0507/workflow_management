"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatNumber } from "@/lib/utils"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3 shadow-xl backdrop-blur-sm">
      <p className="text-xs font-medium text-neutral-400 mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-neutral-300">{entry.name}:</span>
          <span className="font-medium text-neutral-50">{formatNumber(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

interface AgentExecutionsChartProps {
  data: { date: string; executions: number; failed: number }[]
}

export function AgentExecutionsChart({ data }: AgentExecutionsChartProps) {
  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-neutral-200">Agent Executions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.length > 0 ? data : [{ date: "No data", executions: 0, failed: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="executions" stroke="#a3a3a3" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#a3a3a3" }} />
              <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#ef4444" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
