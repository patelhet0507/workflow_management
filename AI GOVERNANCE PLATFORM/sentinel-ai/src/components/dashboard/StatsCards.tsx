"use client"

import { motion } from "framer-motion"
import {
  Bot, AlertTriangle, Activity, FileText,
  Clock, DollarSign, TrendingUp, TrendingDown,
  type LucideIcon,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const iconMap: Record<string, LucideIcon> = {
  Bot, AlertTriangle, Activity, FileText, Clock, DollarSign,
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

interface StatsCardsProps {
  stats: { label: string; value: string; change: number; changeLabel: string; icon: string }[]
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {stats.map((stat) => {
        const Icon = iconMap[stat.icon] || Activity
        const isPositive = stat.change >= 0
        return (
          <motion.div key={stat.label} variants={item}>
            <Card className="group hover:border-neutral-700 transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">{stat.label}</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-800/50 group-hover:bg-neutral-800 transition-colors">
                    <Icon className="h-3.5 w-3.5 text-neutral-400" />
                  </div>
                </div>
                <div className="text-xl font-semibold text-neutral-50 mb-1.5">{stat.value}</div>
                <div className="flex items-center gap-1">
                  {isPositive ? <TrendingUp className="h-3 w-3 text-emerald-400" /> : <TrendingDown className="h-3 w-3 text-red-400" />}
                  <span className={cn("text-[11px] font-medium", isPositive ? "text-emerald-400" : "text-red-400")}>
                    {isPositive ? "+" : ""}{stat.change}%
                  </span>
                  <span className="text-[11px] text-neutral-600 ml-1">{stat.changeLabel}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
