"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { BarChart3, TrendingUp, DollarSign, FileText, Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDashboardStats, useTokenAnalytics, useCostAnalytics } from "@/hooks/use-api"
import { formatNumber } from "@/lib/utils"
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, Legend,
} from "recharts"

const modelUsage = [
  { name: "gpt-4o", value: 45 },
  { name: "gpt-4o-mini", value: 30 },
  { name: "gpt-3.5-turbo", value: 15 },
  { name: "claude-3", value: 10 },
]

const costByCategory = [
  { name: "Development", cost: 4520 },
  { name: "Data", cost: 3890 },
  { name: "Security", cost: 2150 },
  { name: "Support", cost: 1890 },
  { name: "DevOps", cost: 1280 },
  { name: "Content", cost: 980 },
  { name: "Observability", cost: 750 },
  { name: "Communication", cost: 387 },
]

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("7d")
  const { data: dashData } = useDashboardStats()
  const { data: tokenData } = useTokenAnalytics()
  const { data: costData } = useCostAnalytics()
  const tokenConsumption = tokenData?.daily || []
  const costPerDay = costData?.daily || []
  const agentExecutions = dashData?.executionsByDay || []
  const totalExecs = agentExecutions.reduce((s: number, d: any) => s + d.executions, 0)
  const totalTokens = tokenConsumption.reduce((s: number, d: any) => s + d.input + d.output, 0)
  const totalCost = costPerDay.reduce((s: number, d: any) => s + d.cost, 0)

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-50">Analytics</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Deep dive into usage and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList className="h-8">
              <TabsTrigger value="7d" className="text-[11px]">7D</TabsTrigger>
              <TabsTrigger value="30d" className="text-[11px]">30D</TabsTrigger>
              <TabsTrigger value="90d" className="text-[11px]">90D</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs"><Download className="h-3.5 w-3.5" /> Export</Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Executions", value: formatNumber(totalExecs), icon: BarChart3 },
          { label: "Total Tokens", value: formatNumber(totalTokens), icon: FileText },
          { label: "Total Cost", value: `$${totalCost.toLocaleString()}`, icon: DollarSign },
          { label: "Avg Daily Growth", value: "+12.4%", icon: TrendingUp },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider">{stat.label}</span>
                <stat.icon className="h-4 w-4 text-neutral-400" />
              </div>
              <p className="text-lg font-semibold text-neutral-50">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-200">Model Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelUsage} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#a3a3a3', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip
                    contentStyle={{ background: "#171717", border: "1px solid #262626", borderRadius: "8px" }}
                    labelStyle={{ color: "#a3a3a3" }}
                    formatter={(value) => [`${value}%`, "Usage"]}
                  />
                  <Bar dataKey="value" fill="#a3a3a3" radius={[0, 3, 3, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-200">Cost by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costByCategory} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#a3a3a3', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip
                    contentStyle={{ background: "#171717", border: "1px solid #262626", borderRadius: "8px" }}
                    labelStyle={{ color: "#a3a3a3" }}
                    formatter={(value) => [`$${(value as number).toLocaleString()}`, "Cost"]}
                  />
                  <Bar dataKey="cost" fill="#3b82f6" radius={[0, 3, 3, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-neutral-200">Token Consumption Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tokenConsumption}>
                <defs>
                  <linearGradient id="inputGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a3a3a3" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a3a3a3" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="outputGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatNumber(v)} />
                <Tooltip
                  contentStyle={{ background: "#171717", border: "1px solid #262626", borderRadius: "8px" }}
                  labelStyle={{ color: "#a3a3a3" }}
                />
                <Area type="monotone" dataKey="input" stroke="#a3a3a3" strokeWidth={2} fill="url(#inputGrad2)" name="Input" />
                <Area type="monotone" dataKey="output" stroke="#3b82f6" strokeWidth={2} fill="url(#outputGrad2)" name="Output" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
