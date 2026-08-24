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
    project: "",
    unit: "",
    customer: "",
    crm: "",
    bookedBy: "",
    sourceOfBooking: "",
    paymentPlan: "",
    documentType: "",
    sro: "",
    registrationNumber: "",
    currentStage: "",
    registrationDate: "",
  });
  const [results, setResults] = useState([
    { project: "Trident Experia", unit: "B-901", customer: "Ojesh Agrawal", crm: "Kevin Patel", currentStage: "CFO Receipt Check", registrationNo: "—" },
  ]);

  const handleSearch = async () => {
    try{ const r = await api.searchBookings(searchParams as any); setResults(r.map(b=>({ project: b.project_name||"-", unit: b.unit_no, customer: b.client_name, crm: b.sales_exec_name||"-", currentStage: b.status, registrationNo: b.application_no_sale_deed||b.application_no_ats||"—", id: b.id } as any))) }catch(e){ console.error(e)}
  };

  const handleClear = () => {
    setSearchParams({
      project: "",
      unit: "",
      customer: "",
      crm: "",
      bookedBy: "",
      sourceOfBooking: "",
      paymentPlan: "",
      documentType: "",
      sro: "",
      registrationNumber: "",
      currentStage: "",
      registrationDate: "",
    });
  };

  return (
    <div className="min-h-screen bg-[#F4EEE0] text-[#1F2A3D]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <AppLayout>
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-[#1F2A3D] rounded-full inline-block" />
              <span>Global Search</span>
            </h1>

            <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
                  <Search size={14} />
                </div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Search fields (§88) — simple filter bar, not a new reporting module</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
                <input
                  type="text"
                  placeholder="Project ▾"
                  value={searchParams.project}
                  onChange={(e) => setSearchParams({ ...searchParams, project: e.target.value })}
                  className="border border-[#CBBE9C] rounded px-2 py-1.5 text-sm bg-white"
                />
                <input
                  type="text"
                  placeholder="Unit"
                  value={searchParams.unit}
                  onChange={(e) => setSearchParams({ ...searchParams, unit: e.target.value })}
                  className="border border-[#CBBE9C] rounded px-2 py-1.5 text-sm bg-white"
                />
                <input
                  type="text"
                  placeholder="Customer"
                  value={searchParams.customer}
                  onChange={(e) => setSearchParams({ ...searchParams, customer: e.target.value })}
                  className="border border-[#CBBE9C] rounded px-2 py-1.5 text-sm bg-white"
                />
                <input
                  type="text"
                  placeholder="CRM ▾"
                  value={searchParams.crm}
                  onChange={(e) => setSearchParams({ ...searchParams, crm: e.target.value })}
                  className="border border-[#CBBE9C] rounded px-2 py-1.5 text-sm bg-white"
                />
                <input
                  type="text"
                  placeholder="Booked By ▾"
                  value={searchParams.bookedBy}
                  onChange={(e) => setSearchParams({ ...searchParams, bookedBy: e.target.value })}
                  className="border border-[#CBBE9C] rounded px-2 py-1.5 text-sm bg-white"
                />
                <input
                  type="text"
                  placeholder="Source of Booking ▾"
                  value={searchParams.sourceOfBooking}
                  onChange={(e) => setSearchParams({ ...searchParams, sourceOfBooking: e.target.value })}
                  className="border border-[#CBBE9C] rounded px-2 py-1.5 text-sm bg-white"
                />
                <input
                  type="text"
                  placeholder="Payment Plan ▾"
                  value={searchParams.paymentPlan}
                  onChange={(e) => setSearchParams({ ...searchParams, paymentPlan: e.target.value })}
                  className="border border-[#CBBE9C] rounded px-2 py-1.5 text-sm bg-white"
                />
                <input
                  type="text"
                  placeholder="Document Type ▾"
                  value={searchParams.documentType}
                  onChange={(e) => setSearchParams({ ...searchParams, documentType: e.target.value })}
                  className="border border-[#CBBE9C] rounded px-2 py-1.5 text-sm bg-white"
                />
                <input
                  type="text"
                  placeholder="SRO"
                  value={searchParams.sro}
                  onChange={(e) => setSearchParams({ ...searchParams, sro: e.target.value })}
                  className="border border-[#CBBE9C] rounded px-2 py-1.5 text-sm bg-white"
                />
                <input
                  type="text"
                  placeholder="Registration Number"
                  value={searchParams.registrationNumber}
                  onChange={(e) => setSearchParams({ ...searchParams, registrationNumber: e.target.value })}
                  className="border border-[#CBBE9C] rounded px-2 py-1.5 text-sm bg-white"
                />
                <input
                  type="text"
                  placeholder="Current Stage ▾"
                  value={searchParams.currentStage}
                  onChange={(e) => setSearchParams({ ...searchParams, currentStage: e.target.value })}
                  className="border border-[#CBBE9C] rounded px-2 py-1.5 text-sm bg-white"
                />
                <input
                  type="date"
                  placeholder="Registration Date"
                  value={searchParams.registrationDate}
                  onChange={(e) => setSearchParams({ ...searchParams, registrationDate: e.target.value })}
                  className="border border-[#CBBE9C] rounded px-2 py-1.5 text-sm bg-white"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSearch}
                  className="inline-flex items-center gap-1.5 bg-[#1F2A3D] text-[#F4EEE0] text-sm font-medium px-4 py-1.5 rounded hover:bg-[#2c3b56]"
                >
                  <Search size={14} /> Search
                </button>
                <button
                  onClick={handleClear}
                  className="inline-flex items-center gap-1.5 border-2 border-[#CBBE9C] text-[#A87C3F] text-sm font-medium px-4 py-1.5 rounded hover:bg-[#FBF8F0]"
                >
                  <Filter size={14} /> Clear
                </button>
              </div>

              <div className="text-xs text-[#5B5340] mt-2">
                Every field is optional and combinable — a CRM typing just a customer surname, or Legal Executive pasting a registration number, both work. This reuses the same filter/table visual language as the Dashboard and Reports screens, not a new component.
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm ring-1 ring-gray-200 dark:ring-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
                  <Search size={14} />
                </div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Results — same shape as the Dashboard's unit-wise table, opens the Control Sheet on click</p>
              </div>

              <table className="w-full text-sm text-[#1F2A3D]">
                <thead>
                  <tr>
                    <th className="p-2">Project</th>
                    <th className="p-2">Unit</th>
                    <th className="p-2">Customer</th>
                    <th className="p-2">CRM</th>
                    <th className="p-2">Current Stage</th>
                    <th className="p-2">Registration No.</th>
                  </tr>
                </thead>
                <tbody className="border-t border-[#E4DCC6]">
                  {results.map((result:any, index) => (
                      <tr key={index} className="border-t border-[#F0EAD9] cursor-pointer hover:bg-[#FBF8F0]" onClick={()=> result.id && router.push(`/bookings/${result.id}`)}>
                        <td className="p-2">{result.project}</td>
                        <td className="p-2">{result.unit}</td>
                        <td className="p-2">{result.customer}</td>
                        <td className="p-2">{result.crm}</td>
                        <td className="p-2">{result.currentStage}</td>
                        <td className="p-2">{result.registrationNo}</td>
                      </tr>
                    ))}
                </tbody>
              </table>

              <div className="text-xs text-[#5B5340] mt-2">
                This is deliberately a thin screen — one filter bar, one results table, click-through to the Control Sheet (Sheet 02). It is not the Reports screen (Sheet 09) and doesn't duplicate it: Search finds a specific transaction fast; Reports produces a filtered/exportable list for analysis.
              </div>
            </div>

            <div className="legend mt-6">
              <h3 className="text-sm font-semibold text-[#8C7A4D] mb-1">Notes</h3>
              <ol className="list-disc pl-4 text-sm text-[#5B5340]">
                <li>This is deliberately a thin screen — one filter bar, one results table, click-through to the Control Sheet (Sheet 02). It is not the Reports screen (Sheet 09) and doesn't duplicate it: Search finds a specific transaction fast; Reports produces a filtered/exportable list for analysis.</li>
              </ol>
            </div>
          </div>
        </AppLayout>
      </div>
    </div>
  );
};

export default GlobalSearch;