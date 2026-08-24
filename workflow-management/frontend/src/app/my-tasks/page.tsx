"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import AppLayout from "@/components/app-layout";
import { LayoutDashboard, Users } from "lucide-react";

const MyTasks = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [myTasks, setMyTasks] = useState([
    { project: "Trident Experia", unit: "B-901", customer: "Ojesh Agrawal", document: "Sale Deed", stage: "CFO Receipt Check", dateReceived: "26 Jul", daysPending: 2, physicalHolder: "CFO", action: "Open →" },
    { project: "Trident Experia", unit: "B-904", customer: "M. Rao", document: "ATS", stage: "Ledger Check", dateReceived: "27 Jul", daysPending: 1, physicalHolder: "CFO", action: "Open →" }
  ]);
  const [pendingWithOthers, setPendingWithOthers] = useState(false);
  const [others, setOthers] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading && !user) return void router.push("/login");
    if (user) Promise.all([api.getBookings(), api.getApprovalFlow().catch(()=>[] as any)]).then(([bookings, flow])=>{
      const map: Record<string,string> = {}; (flow as any[]).forEach((s:any)=> map[s.status]=s.role)
      const alias: Record<string,string[]> = { legal:["crm","accounts"], crm_executive:["crm"] }
      const my = bookings.filter(b=> {
        if (b.status==="completed"||b.status==="rejected"||(b as any).lifecycle_status==="CANCELLED") return false
        const req = map[b.status]; if(!req) return false
        if (user.role===req || user.role==="super_admin") return true
        const acting = alias[req]||[]
        return acting.includes(user.role)
      }).map(b=> ({ project: b.project_name||"-", unit: b.unit_no, customer: b.client_name, document: b.is_direct_sale_deed?"Sale Deed (Direct)": b.status.includes("ats")?"ATS":"Sale Deed", stage: b.status, dateReceived: b.updated_at? new Date(b.updated_at.toMillis()).toLocaleDateString(): "-", daysPending: b.created_at? Math.floor((Date.now()-b.created_at.toMillis())/864e5):0, physicalHolder: (b as any).current_holder||"-", id: b.id, action:"Open →" }))
      if (my.length>0) setMyTasks(my as any)
      const other = bookings.filter(b=> {
        if (b.status==="completed"||b.status==="rejected"||(b as any).lifecycle_status==="CANCELLED") return false
        const req = map[b.status]; if(!req) return false
        if (req===user.role) return false
        const acting = alias[req]||[]
        if (acting.includes(user.role)) return false
        if (user.role==="super_admin") return false
        return true
      }).slice(0,5).map(b=> ({ project: b.project_name||"-", unit: b.unit_no, customer: b.client_name, document: b.is_direct_sale_deed?"Direct":"Sale Deed", stage: b.status, days: b.created_at? Math.floor((Date.now()-b.created_at.toMillis())/864e5):0, holder: map[b.status]||"-" }))
      setOthers(other as any)
    }).catch(()=>{})
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F4E8] via-[#EDE6CE] to-[#F0E8D4] text-[#141623] relative">
      <div className="mesh-gradient" />
      <div className="max-w-6xl mx-auto px-6 py-10 relative z-10">
        <AppLayout>
          <div className="max-w-5xl space-y-8">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C5A05A]/20 to-[#8A6F3B]/10 flex items-center justify-center border border-[#C5A05A]/20"><Users size={16} className="text-[#8A6F3B]" /></span>
              <h1 className="font-editorial text-4xl text-[#141623]">My Tasks</h1>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C5A05A]/10 to-transparent flex items-center justify-center border border-[#C5A05A]/15"><LayoutDashboard size={14} className="text-[#8A6F3B]" /></span>
                <p className="text-xs font-bold text-[#8A7E6E] uppercase tracking-widest">View toggle (§87)</p>
              </div>
              <div className="flex items-center gap-3 mb-6">
                <span className="chip bg-gradient-to-r from-[#C5A05A]/15 to-[#C5A05A]/5 border border-[#C5A05A]/20 text-[#8A6F3B] px-3 py-1.5 rounded-full text-xs font-semibold">My Tasks ({myTasks.length})</span>
                <button type="button" onClick={() => setPendingWithOthers(!pendingWithOthers)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${pendingWithOthers ? 'bg-gradient-to-r from-[#C5A05A]/15 to-[#C5A05A]/5 text-[#8A6F3B] border-[#C5A05A]/20' : 'bg-white/60 text-[#8A7E6E] border-[#C5A05A]/15'}`}>
                  Pending with Others
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[#EDE6CE]/60">
                <table className="w-full text-sm text-[#141623]">
                  <thead className="bg-gradient-to-r from-[#141623]/5 to-transparent">
                    <tr>
                      <th className="text-left p-3 font-semibold text-[#8A7E6E] text-xs uppercase tracking-wider">Project</th>
                      <th className="text-left p-3 font-semibold text-[#8A7E6E] text-xs uppercase tracking-wider">Unit</th>
                      <th className="text-left p-3 font-semibold text-[#8A7E6E] text-xs uppercase tracking-wider">Customer</th>
                      <th className="text-left p-3 font-semibold text-[#8A7E6E] text-xs uppercase tracking-wider">Document</th>
                      <th className="text-left p-3 font-semibold text-[#8A7E6E] text-xs uppercase tracking-wider">Stage</th>
                      <th className="text-left p-3 font-semibold text-[#8A7E6E] text-xs uppercase tracking-wider">Date Received</th>
                      <th className="text-left p-3 font-semibold text-[#8A7E6E] text-xs uppercase tracking-wider">Days</th>
                      <th className="text-left p-3 font-semibold text-[#8A7E6E] text-xs uppercase tracking-wider">Physical Holder</th>
                      <th className="text-left p-3 font-semibold text-[#8A7E6E] text-xs uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE6CE]/40">
                    {myTasks.map((task:any, index) => (
                      <tr key={index} className="hover:bg-[#C5A05A]/5 transition cursor-pointer" onClick={()=> task.id && router.push(`/bookings/${task.id}`)}>
                        <td className="p-3 text-xs">{task.project}</td>
                        <td className="p-3 font-semibold">{task.unit}</td>
                        <td className="p-3 text-sm">{task.customer}</td>
                        <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full bg-[#C5A05A]/10 border border-[#C5A05A]/20 text-[#8A6F3B]">{task.document}</span></td>
                        <td className="p-3 text-xs">{task.stage}</td>
                        <td className="p-3 text-xs text-[#8A7E6E]">{task.dateReceived}</td>
                        <td className="p-3 text-xs font-bold">{task.daysPending}</td>
                        <td className="p-3 text-xs">{task.physicalHolder}</td>
                        <td className="p-3"><span className="text-[#8A6F3B] text-xs font-medium border border-[#C5A05A]/20 px-2.5 py-1 rounded-full">Open →</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pendingWithOthers && (
                <div className="mt-4 p-4 rounded-xl bg-amber-50/60 border border-amber-200/60">
                  <p className="text-xs font-bold text-[#8A7E6E] uppercase tracking-wider mb-2">"Pending with Others" (§87)</p>
                  <div className="flex flex-wrap gap-2">{others.length===0? <span className="chip bg-white/60 text-[#8A7E6E] border px-3 py-1 rounded-full text-xs">No pending with others</span> : others.map((o:any,i:number)=>(<span key={i} className="chip bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-xs font-medium">{o.unit} — {o.document} — Pending with {o.holder} — {o.days} days</span>))}</div>
                </div>
              )}
              <p className="text-xs text-[#8A7E6E] mt-3 italic">My Tasks is scoped to stages this user's role (or an active delegation) can act on — same eligibility rule as the workflow action screen's role gate. Clicking any row opens the Workflow Action screen directly at that stage.</p>
            </div>
          </div>
        </AppLayout>
      </div>
    </div>
  );
};

export default MyTasks;
