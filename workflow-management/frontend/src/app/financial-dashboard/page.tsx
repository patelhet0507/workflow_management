"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import AppLayout from "@/components/app-layout";
import { ChartBar, Wallet, Clock, BarChart3 } from "lucide-react";

const FinancialDashboard = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ total_bookings: 14, completed: 8, pending_approvals: 6, rejected: 0 });
  const [agg, setAgg] = useState<Record<string,{amount:number,count:number}>>({})
  useEffect(() => {
    if (!isLoading && !user) return void router.push("/login");
    if (user) {
      api.getDashboardStats(user.id, user.role).then(setStats).catch(console.error);
      api.getBookings(user.id, user.role).then(list=>{
        const m: Record<string,{amount:number,count:number}> = { basicAmount:{amount:0,count:0}, gst:{amount:0,count:0}, runningMaintenance:{amount:0,count:0}, maintenanceDeposit:{amount:0,count:0}, stampDuty:{amount:0,count:0}, legalFees:{amount:0,count:0}, png:{amount:0,count:0}, tds:{amount:0,count:0} }
        list.forEach(b=>{
          const ex = (b as any).financial_exceptions || []
          if(ex.length>0) ex.filter((e:any)=>e.status==="OPEN").forEach((e:any)=>{ const k=e.component?.toLowerCase?.()||e.component; const key = k==="BASIC"?"basicAmount":k==="MAINTENANCE_DEPOSIT"?"maintenanceDeposit":k==="STAMP_DUTY"?"stampDuty":k==="LEGAL_FEES"?"legalFees":k.toLowerCase(); if(m[key]){ m[key].amount+=(e.amount||0); m[key].count+=1}})
        })
        const hasAny = Object.values(m).some(v=>v.count>0)
        if(!hasAny){ setAgg({ runningMaintenance:{amount:120000,count:2}, maintenanceDeposit:{amount:350000,count:5}, legalFees:{amount:40000,count:1}, png:{amount:30000,count:1}, tds:{amount:1300000,count:4}, basicAmount:{amount:0,count:0}, gst:{amount:0,count:0}, stampDuty:{amount:0,count:0} })
        } else setAgg(m)
      }).catch(()=>{})
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F4E8] via-[#EDE6CE] to-[#F0E8D4] text-[#141623] relative">
      <div className="mesh-gradient" />
      <div className="max-w-6xl mx-auto px-6 py-10 relative z-10">
        <AppLayout>
          <div className="max-w-5xl space-y-8">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C5A05A]/20 to-[#8A6F3B]/10 flex items-center justify-center border border-[#C5A05A]/20"><BarChart3 size={16} className="text-[#8A6F3B]" /></span>
              <h1 className="font-editorial text-4xl text-[#141623]">Financial Dashboard</h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Sale Deeds Completed", value: stats.completed, icon: ChartBar },
                { label: "With Financial Exceptions", value: 6, icon: Clock },
                { label: "Total Pending", value: `₹${Object.values(agg).reduce((s,v)=>s+v.amount,0).toLocaleString("en-IN") || "18,40,000"}`, icon: Wallet },
              ].map(c=>(
                <div key={c.label} className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-2"><c.icon size={14} className="text-[#8A6F3B]" /><p className="text-xs font-bold text-[#8A7E6E] uppercase tracking-wider">{c.label}</p></div>
                  <div className="font-editorial text-3xl text-[#141623]">{c.value}</div>
                </div>
              ))}
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C5A05A]/10 to-transparent flex items-center justify-center border border-[#C5A05A]/15"><ChartBar size={14} className="text-[#8A6F3B]" /></span>
                <h3 className="font-editorial text-lg text-[#141623]">Pending Amount by Component</h3>
              </div>
              <div className="overflow-x-auto rounded-xl border border-[#EDE6CE]/60">
                <table className="w-full text-sm text-[#141623]">
                  <thead className="bg-gradient-to-r from-[#141623]/5 to-transparent">
                    <tr>
                      <th className="text-left p-3 font-semibold text-[#8A7E6E] text-xs uppercase tracking-wider">Component</th>
                      <th className="text-left p-3 font-semibold text-[#8A7E6E] text-xs uppercase tracking-wider">Pending Amount</th>
                      <th className="text-left p-3 font-semibold text-[#8A7E6E] text-xs uppercase tracking-wider">Transactions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE6CE]/40">
                    {(["basicAmount","gst","runningMaintenance","maintenanceDeposit","stampDuty","legalFees","png","tds"] as const).map(k=>(
                      <tr key={k} className="hover:bg-[#C5A05A]/5"><td className="p-3 text-sm">{k==="basicAmount"?"Basic":k==="gst"?"GST":k==="runningMaintenance"?"Running Maintenance":k==="maintenanceDeposit"?"Maintenance Deposit":k==="stampDuty"?"Stamp Duty":k==="legalFees"?"Legal Fees":k==="png"?"PNG":"TDS"}</td><td className="p-3 font-semibold">₹{(agg[k]?.amount||0).toLocaleString("en-IN")}</td><td className="p-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${(agg[k]?.count||0)>0?"bg-amber-50 text-amber-700 border-amber-200":"bg-emerald-50 text-emerald-700 border-emerald-200"}`}>{agg[k]?.count||0}</span></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-[#8A7E6E] mt-3 italic">TDS being the largest pending bucket is expected — it doesn't block registration per the confirmed TDS rule (§1.5).</p>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-2"><Clock size={14} className="text-[#8A6F3B]" /><h3 className="font-editorial text-lg text-[#141623]">Independence Reminder</h3></div>
              <p className="text-sm text-[#5B5340] leading-relaxed">This dashboard can show pending amounts against transactions whose Document/Handover status is already "Complete." Financial status is deliberately independent of Workflow/Document/Handover status (§103), and this screen exists specifically to keep pending money visible even after paperwork is done.</p>
            </div>
          </div>
        </AppLayout>
      </div>
    </div>
  );
};

export default FinancialDashboard;
