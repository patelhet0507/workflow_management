"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

const COLORS = ["#22c55e", "#ef4444", "#eab308"]

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload) return null
  return <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3 shadow-xl backdrop-blur-sm">
    <p className="text-sm font-medium text-neutral-50">{payload[0].name}: {payload[0].value}%</p>
  </div>
}

interface AgentSuccessRateChartProps {
  data: { successful: number; failed: number; warning: number }
}

export function AgentSuccessRateChart({ data }: AgentSuccessRateChartProps) {
  const chartData = [
    { name: "Successful", value: data.successful },
    { name: "Failed", value: data.failed },
    { name: "Warning", value: data.warning },
  ].filter((d) => d.value > 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-neutral-200">Agent Success Rate</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[240px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-bold text-neutral-50">{data.successful}%</span>
            <span className="text-[10px] text-neutral-500">Success</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-4 mt-2">
          {chartData.map((entry, i) => (
            <div key={entry.name} className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
              <span className="text-[11px] text-neutral-400">{entry.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
