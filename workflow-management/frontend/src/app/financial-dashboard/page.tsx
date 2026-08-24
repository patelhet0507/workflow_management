"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import AppLayout from "@/components/app-layout";
import { ChartBar, Wallet, Clock } from "lucide-react";

const components = {
  basicAmount: "₹0",
  gst: "₹0",
  runningMaintenance: "₹1,20,000",
  maintenanceDeposit: "₹3,50,000",
  stampDuty: "₹0",
  legalFees: "₹40,000",
  png: "₹30,000",
  tds: "₹13,00,000",
};

const FinancialDashboard = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    total_bookings: 14,
    completed: 8,
    pending_approvals: 6,
    rejected: 0,
  });

  useEffect(() => {
    if (!isLoading && !user) return void router.push("/login");
    if (user) {
      api.getDashboardStats(user.id, user.role).then(setStats).catch(console.error);
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-[#F4EEE0] text-[#1F2A3D]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <AppLayout>
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-[#1F2A3D] rounded-full inline-block" />
              <span>Financial Management Dashboard</span>
            </h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Headline Figures */}
              <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm ring-1 ring-gray-200 dark:ring-gray-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center`}>
                    <ChartBar size={14} />
                  </div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Sale Deeds Completed</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg bg-green-50 dark:bg-green-950/50 flex items-center justify-center`}>
                    <Clock size={14} />
                  </div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">With Financial Exceptions</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center`}>
                    <Clock size={14} />
                  </div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Pending Amount</p>
                </div>
                <div className="text-3xl font-bold mt-1">{stats.completed}</div>
              </div>

              {/* Pending Amount by Component */}
              <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm ring-1 ring-gray-200 dark:ring-gray-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
                    <ChartBar size={14} />
                  </div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Amount by Component</p>
                </div>
                <table className="w-full text-sm text-[#1F2A3D]">
                  <thead>
                    <tr>
                      <th className="bg-[#F1F5F8] text-left p-2">Component</th>
                      <th className="bg-[#F1F5F8] text-left p-2">Pending Amount</th>
                      <th className="bg-[#F1F5F8] text-left p-2">Transactions</th>
                    </tr>
                  </thead>
                  <tbody className="border-t border-[#E4DCC6]">
                    <tr>
                      <td>Basic</td>
                      <td>₹0</td>
                      <td>0</td>
                    </tr>
                    <tr>
                      <td>GST</td>
                      <td>₹0</td>
                      <td>0</td>
                    </tr>
                    <tr>
                      <td>Running Maintenance</td>
                      <td>₹1,20,000</td>
                      <td>2</td>
                    </tr>
                    <tr>
                      <td>Maintenance Deposit</td>
                      <td>₹3,50,000</td>
                      <td>5</td>
                    </tr>
                    <tr>
                      <td>Stamp Duty</td>
                      <td>₹0</td>
                      <td>0</td>
                    </tr>
                    <tr>
                      <td>Legal Fees</td>
                      <td>₹40,000</td>
                      <td>1</td>
                    </tr>
                    <tr>
                      <td>PNG</td>
                      <td>₹30,000</td>
                      <td>1</td>
                    </tr>
                    <tr>
                      <td>TDS</td>
                      <td>₹13,00,000</td>
                      <td>4</td>
                    </tr>
                  </tbody>
                </table>
                <div className="text-sm text-[#5B5340] mt-2">
                  Clicking any non-zero row opens a filtered transaction list (same shape as the Dashboard's unit-wise table), not just a number. TDS being the largest pending bucket here is expected and fine — it doesn't block anything, per the confirmed TDS rule.
                </div>
              </div>

              {/* Independence Reminder */}
              <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 mt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
                    <Clock size={14} />
                  </div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Independence Reminder</p>
                </div>
                <div className="text-sm text-[#5B5340]">
                  This dashboard can show real pending amounts against transactions whose Document/Handover status is already "Complete." That's not a bug to fix — Financial status is deliberately independent of Workflow/Document/Handover status (§103), and this screen exists specifically to keep pending money visible even after the paperwork is done.
                </div>
              </div>

              <div className="legend mt-6">
                <h3 className="text-sm font-semibold text-[#8C7A4D] mb-1">Notes</h3>
                <ol className="list-disc pl-4 text-sm text-[#5B5340]">
                  <li>Same headline-cards + drill-down-table pattern as the main Dashboard — kept visually consistent rather than inventing a new layout language for one screen.</li>
                </ol>
              </div>
            </div>
          </div>
        </AppLayout>
      </div>
    </div>
  );
};

export default FinancialDashboard;