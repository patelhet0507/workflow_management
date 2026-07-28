"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3 shadow-xl backdrop-blur-sm">
      <p className="text-xs font-medium text-neutral-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-neutral-50">${payload[0]?.value?.toFixed(2)}</p>
    </div>
  )
}

interface CostPerDayChartProps {
  data: { date: string; cost: number }[]
}

export function CostPerDayChart({ data }: CostPerDayChartProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-neutral-200">Cost Per Day</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.length > 0 ? data : [{ date: "No data", cost: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="cost" fill="#a3a3a3" radius={[3, 3, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
