"use client"

import { motion } from "framer-motion"
import { DollarSign, CreditCard, TrendingUp, Calendar, Check, Download, ArrowUpRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useBilling } from "@/hooks/use-api"
import { cn } from "@/lib/utils"

export default function BillingPage() {
  const { data: billingData } = useBilling()
  const billingInfo = billingData || { plan: "Enterprise", status: "Active", monthlySpend: 0, nextBill: new Date().toISOString(), billingEmail: "", projectedCost: 0 }
  const invoices: any[] = (billingInfo?.invoices || []).map((inv: any) => ({ ...inv, date: new Date(inv.date) }))
  return (
    <div className="space-y-6 p-4 lg:p-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-50">Billing</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Manage your subscription and invoices</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-200">Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-neutral-50">{billingInfo.plan}</h2>
                  <Badge variant="success" className="text-[10px]">{billingInfo.status}</Badge>
                </div>
                <p className="text-sm text-neutral-400">Billed monthly · ${billingInfo.monthlySpend.toLocaleString()}/mo</p>
                <div className="flex items-center gap-4 mt-4">
                  <div>
                    <p className="text-[11px] text-neutral-500">Next Bill</p>
                    <p className="text-sm font-medium text-neutral-200">{new Date(billingInfo.nextBill).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-neutral-500">Billing Email</p>
                    <p className="text-sm font-medium text-neutral-200">{billingInfo.billingEmail}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8 text-xs">Change Plan</Button>
                <Button size="sm" className="h-8 text-xs">Update Payment</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-200">Usage Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-400">Current Spend</span>
                <span className="font-semibold text-neutral-50">${billingInfo.monthlySpend.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Projected</span>
                <span className="font-semibold text-amber-400">${billingInfo.projectedCost.toLocaleString()}</span>
              </div>
            </div>
            <div className="relative h-2 rounded-full bg-neutral-800 overflow-hidden">
              <div className="absolute inset-y-0 left-0 rounded-full bg-neutral-50" style={{ width: `${(billingInfo.monthlySpend / billingInfo.projectedCost) * 100}%` }} />
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              <span>Estimated <strong className="text-emerald-400">${(billingInfo.projectedCost - billingInfo.monthlySpend).toLocaleString()}</strong> remaining this period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-neutral-200">Invoice History</CardTitle>
            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1"><Download className="h-3 w-3" /> All Invoices</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px]">Invoice</TableHead>
                <TableHead className="text-[11px]">Date</TableHead>
                <TableHead className="text-[11px]">Description</TableHead>
                <TableHead className="text-[11px]">Amount</TableHead>
                <TableHead className="text-[11px]">Status</TableHead>
                <TableHead className="text-[11px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv, i) => (
                <motion.tr
                  key={inv.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-neutral-800/50 hover:bg-neutral-800/20 transition-colors"
                >
                  <TableCell className="py-3 text-sm font-mono text-neutral-200">{inv.id}</TableCell>
                  <TableCell className="py-3 text-sm text-neutral-400">{inv.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                  <TableCell className="py-3 text-sm text-neutral-400">{inv.description}</TableCell>
                  <TableCell className="py-3 text-sm font-medium text-neutral-200">${inv.amount.toLocaleString()}</TableCell>
                  <TableCell className="py-3">
                    <Badge variant={inv.status === "paid" ? "success" : inv.status === "pending" ? "warning" : "destructive"} className="text-[10px]">
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-500 hover:text-neutral-300">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
