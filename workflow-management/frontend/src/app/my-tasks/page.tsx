"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import AppLayout from "@/components/app-layout";
import { LayoutDashboard, ArrowRight } from "lucide-react";

const MyTasks = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [myTasks, setMyTasks] = useState([
    {
      project: "Trident Experia",
      unit: "B-901",
      customer: "Ojesh Agrawal",
      document: "Sale Deed",
      stage: "CFO Receipt Check",
      dateReceived: "26 Jul",
      daysPending: 2,
      physicalHolder: "CFO",
      action: "Open →"
    },
    {
      project: "Trident Experia",
      unit: "B-904",
      customer: "M. Rao",
      document: "ATS",
      stage: "Ledger Check",
      dateReceived: "27 Jul",
      daysPending: 1,
      physicalHolder: "CFO",
      action: "Open →"
    }
  ]);
  const [pendingWithOthers, setPendingWithOthers] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) return void router.push("/login");
    if (user) {
      api.getMyTasks(user.id, user.role).then(setMyTasks).catch(console.error);
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-[#F4EEE0] text-[#1F2A3D]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <AppLayout>
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-[#1F2A3D] rounded-full inline-block" />
              <span>My Tasks</span>
            </h1>
            <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm ring-1 ring-gray-200 dark:ring-gray-800">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
                  <LayoutDashboard size={14} />
                </div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">View toggle (§87)</p>
              </div>
              <div className="flex items-center gap-4 mb-6">
                <span className="chip bg-blue-50 text-blue-600 px-3 py-1 rounded text-xs font-medium">My Tasks ({myTasks.length})</span>
                <span
                  className={`
                    chip ${pendingWithOthers ? 'bg-blue-50 text-blue-600' : 'bg-gray-300 text-gray-500'}
                    px-3 py-1 rounded text-xs font-medium
                  `
                  onClick={() => setPendingWithOthers(!pendingWithOthers)}
                >
                  Pending with Others
                </span>
              </div>

              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm mb-6">
                <p className="text-sm text-gray-500 mb-2">Task list (§86 columns)</p>
                <table className="w-full text-sm text-[#1F2A3D]">
                  <thead>
                    <tr>
                      <th className="p-2">Project</th>
                      <th className="p-2">Unit</th>
                      <th className="p-2">Customer</th>
                      <th className="p-2">Document</th>
                      <th className="p-2">Stage</th>
                      <th className="p-2">Date Received</th>
                      <th className="p-2">Days Pending</th>
                      <th className="p-2">Physical Holder</th>
                      <th className="p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="border-t border-[#E4DCC6]">
                    {myTasks.map((task, index) => (
                      <tr key={index} className="border-t border-[#F0EAD9]">
                        <td className="p-2">{task.project}</td>
                        <td className="p-2">{task.unit}</td>
                        <td className="p-2">{task.customer}</td>
                        <td className="p-2">{task.document}</td>
                        <td className="p-2">{task.stage}</td>
                        <td className="p-2">{task.dateReceived}</td>
                        <td className="p-2">{task.daysPending}</td>
                        <td className="p-2">{task.physicalHolder}</td>
                        <td className="p-2">{task.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pendingWithOthers && (
                  <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm mt-4">
                    <p className="text-sm text-gray-500 mb-2">"Pending with Others" example (§87)</p>
                    <div className="chip bg-amber-50 text-amber-600 px-3 py-1 rounded text-xs font-medium">
                      A-101 — Sale Deed — Pending with Legal Executive — 3 days
                    </div>
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  v1.3 fix: "Date Received" was missing from this table in the prior wireframe — added per §86's full column set. It's the timestamp this stage became this user's responsibility, distinct from Days Pending (a derived count).
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  My Tasks is scoped to stages this user's role (or an active delegation) can act on right now — same eligibility rule as the workflow action screen's role gate.
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Clicking any row opens the Workflow Action screen (Sheet 03) directly at that stage.
                </div>
              </div>

              <div className="legend mt-4">
                <h3 className="text-sm font-semibold text-[#8C7A4D] mb-1">Notes</h3>
                <ol className="list-disc pl-4 text-sm text-[#5B5340]">
                  <li>My Tasks is scoped to stages this user's role (or an active delegation) can act on right now — same eligibility rule as the workflow action screen's role gate.</li>
                  <li>Clicking any row opens the Workflow Action screen (Sheet 03) directly at that stage.</li>
                </ol>
              </div>
            </div>
          </div>
        </AppLayout>
      </div>
    </div>
  );
};

export default MyTasks;