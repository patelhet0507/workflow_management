"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import AppLayout from "@/components/app-layout";
import { Search, Filter } from "lucide-react";

const GlobalSearch = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [searchParams, setSearchParams] = useState({
    project: "", unit: "", customer: "", crm: "", bookedBy: "", sourceOfBooking: "", paymentPlan: "", documentType: "", sro: "", registrationNumber: "", currentStage: "", registrationDate: "",
  });
  const [results, setResults] = useState([
    { project: "Trident Experia", unit: "B-901", customer: "Ojesh Agrawal", crm: "Kevin Patel", currentStage: "CFO Receipt Check", registrationNo: "—" },
  ]);

  const handleSearch = async () => {
    try{ const r = await api.searchBookings(searchParams as any); setResults(r.map(b=>({ project: b.project_name||"-", unit: b.unit_no, customer: b.client_name, crm: b.sales_exec_name||"-", currentStage: b.status, registrationNo: b.application_no_sale_deed||b.application_no_ats||"—", id: b.id } as any))) }catch(e){ console.error(e)}
  };

  const handleClear = () => {
    setSearchParams({ project: "", unit: "", customer: "", crm: "", bookedBy: "", sourceOfBooking: "", paymentPlan: "", documentType: "", sro: "", registrationNumber: "", currentStage: "", registrationDate: "", });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F4E8] via-[#EDE6CE] to-[#F0E8D4] text-[#141623] relative">
      <div className="mesh-gradient" />
      <div className="max-w-6xl mx-auto px-6 py-10 relative z-10">
        <AppLayout>
          <div className="max-w-5xl space-y-8">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C5A05A]/20 to-[#8A6F3B]/10 flex items-center justify-center border border-[#C5A05A]/20"><Search size={16} className="text-[#8A6F3B]" /></span>
              <h1 className="font-editorial text-4xl text-[#141623]">Global Search</h1>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C5A05A]/10 to-transparent flex items-center justify-center border border-[#C5A05A]/15"><Search size={14} className="text-[#8A6F3B]" /></span>
                <p className="text-xs font-bold text-[#8A7E6E] uppercase tracking-widest">Search fields (§88) — simple filter bar, not a new reporting module</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
                {[
                  ["project","Project"],["unit","Unit"],["customer","Customer"],["crm","CRM"],["bookedBy","Booked By"],["sourceOfBooking","Source"],["paymentPlan","Payment Plan"],["documentType","Document Type"],["sro","SRO"],["registrationNumber","Registration No."],["currentStage","Current Stage"]].map(([k,ph])=>(
                  <input key={k} type="text" placeholder={ph as string} value={(searchParams as any)[k]} onChange={(e) => setSearchParams({ ...searchParams, [k]: e.target.value })} className="rounded-xl border border-[#C5A05A]/20 bg-white/60 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A05A]/20" />
                ))}
                <input type="date" value={searchParams.registrationDate} onChange={(e) => setSearchParams({ ...searchParams, registrationDate: e.target.value })} className="rounded-xl border border-[#C5A05A]/20 bg-white/60 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A05A]/20" />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleSearch} className="btn-luxury text-xs inline-flex items-center gap-1.5"><Search size={14} /> Search</button>
                <button onClick={handleClear} className="border border-[#C5A05A]/20 text-[#8A6F3B] px-4 py-2 rounded-xl text-xs font-medium hover:bg-white/60 inline-flex items-center gap-1.5"><Filter size={14} /> Clear</button>
              </div>
              <p className="text-xs text-[#8A7E6E] mt-3">Every field is optional and combinable — a CRM typing just a customer surname, or Legal Executive pasting a registration number, both work.</p>
            </div>

            <div className="glass-card p-6 overflow-hidden">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C5A05A]/10 to-transparent flex items-center justify-center border border-[#C5A05A]/15"><Search size={14} className="text-[#8A6F3B]" /></span>
                <p className="text-xs font-bold text-[#8A7E6E] uppercase tracking-widest">Results — opens the Control Sheet on click</p>
              </div>
              <div className="overflow-x-auto rounded-xl border border-[#EDE6CE]/60">
                <table className="w-full text-sm text-[#141623]">
                  <thead className="bg-gradient-to-r from-[#141623]/5 to-transparent">
                    <tr>
                      <th className="text-left p-3 font-semibold text-[#8A7E6E] text-xs uppercase tracking-wider">Project</th>
                      <th className="text-left p-3 font-semibold text-[#8A7E6E] text-xs uppercase tracking-wider">Unit</th>
                      <th className="text-left p-3 font-semibold text-[#8A7E6E] text-xs uppercase tracking-wider">Customer</th>
                      <th className="text-left p-3 font-semibold text-[#8A7E6E] text-xs uppercase tracking-wider">CRM</th>
                      <th className="text-left p-3 font-semibold text-[#8A7E6E] text-xs uppercase tracking-wider">Current Stage</th>
                      <th className="text-left p-3 font-semibold text-[#8A7E6E] text-xs uppercase tracking-wider">Registration No.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE6CE]/40">
                    {results.map((result:any, index) => (
                      <tr key={index} className="hover:bg-[#C5A05A]/5 cursor-pointer transition" onClick={()=> result.id && router.push(`/bookings/${result.id}`)}>
                        <td className="p-3 text-sm">{result.project}</td>
                        <td className="p-3 font-semibold">{result.unit}</td>
                        <td className="p-3 text-sm">{result.customer}</td>
                        <td className="p-3 text-xs text-[#8A7E6E]">{result.crm}</td>
                        <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full bg-[#C5A05A]/10 border border-[#C5A05A]/20 text-[#8A6F3B]">{result.currentStage}</span></td>
                        <td className="p-3 text-xs">{result.registrationNo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-[#8A7E6E] mt-3 italic">Thin screen — one filter bar, one results table, click-through to the Control Sheet. Not the Reports screen.</p>
            </div>
          </div>
        </AppLayout>
      </div>
    </div>
  );
};

export default GlobalSearch;
