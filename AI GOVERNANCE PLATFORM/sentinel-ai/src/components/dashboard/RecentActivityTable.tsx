"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { timeAgo, formatDuration, formatCost } from "@/lib/utils"

const statusVariant: Record<string, "success" | "destructive" | "warning" | "secondary"> = {
  success: "success", failed: "destructive", pending: "secondary", warning: "warning",
}

interface RecentActivityTableProps {
  data: { id: string; time: string | Date; agent: string; action: string; status: string; duration: number; cost: number }[]
}

export function RecentActivityTable({ data }: RecentActivityTableProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-neutral-200">Recent Activity</CardTitle>
          <Badge variant="secondary" className="text-[10px]">Live</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[320px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px] font-medium text-neutral-500">Time</TableHead>
                <TableHead className="text-[11px] font-medium text-neutral-500">Agent</TableHead>
                <TableHead className="text-[11px] font-medium text-neutral-500">Action</TableHead>
                <TableHead className="text-[11px] font-medium text-neutral-500">Status</TableHead>
                <TableHead className="text-[11px] font-medium text-neutral-500 text-right">Duration</TableHead>
                <TableHead className="text-[11px] font-medium text-neutral-500 text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-neutral-500 py-8">No activity yet. Click "Simulate Activity" to generate data.</TableCell>
                </TableRow>
              ) : (
                data.map((entry, i) => (
                  <motion.tr
                    key={entry.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-neutral-800/50 hover:bg-neutral-800/20 transition-colors"
                  >
                    <TableCell className="text-[12px] text-neutral-400 py-2.5">{timeAgo(entry.time)}</TableCell>
                    <TableCell className="text-[12px] font-medium text-neutral-200 py-2.5">{entry.agent}</TableCell>
                    <TableCell className="text-[12px] text-neutral-400 py-2.5">{entry.action}</TableCell>
                    <TableCell className="py-2.5">
                      <Badge variant={statusVariant[entry.status] || "secondary"} className="text-[10px] px-1.5 py-0">{entry.status}</Badge>
                    </TableCell>
                    <TableCell className="text-[12px] text-neutral-400 py-2.5 text-right font-mono">{formatDuration(entry.duration)}</TableCell>
                    <TableCell className="text-[12px] text-neutral-400 py-2.5 text-right font-mono">{formatCost(entry.cost)}</TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
