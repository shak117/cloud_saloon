import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, CheckCircle, PlusCircle, AlertCircle, Calendar } from "lucide-react";
import { apiClient } from "../../api/client";

export const TrialManagementPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: trials = [], isLoading } = useQuery({
    queryKey: ["superAdminTrials"],
    queryFn: async () => (await apiClient.get("/super-admin/trials")).data,
  });

  // Convert to Active Paid Mutation
  const convertMutation = useMutation({
    mutationFn: async ({ salonId, planId }: { salonId: string; planId: string }) => {
      const res = await apiClient.post("/super-admin/subscriptions/payment", {
        salon_id: salonId,
        plan_id: planId,
        amount: 999.0,
        billing_cycle: "MONTHLY",
        duration_months: 1,
        payment_reference: "TRIAL-CONVERT-MANUAL",
        notes: "Trial converted to active paid subscription",
      });
      return res.data;
    },
    onSuccess: () => {
      alert("Trial successfully converted to paid active plan!");
      queryClient.invalidateQueries({ queryKey: ["superAdminTrials"] });
      queryClient.invalidateQueries({ queryKey: ["superAdminSalons"] });
      queryClient.invalidateQueries({ queryKey: ["superAdminMetrics"] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide">
          14-Day Free Trial Management
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Monitor salons currently evaluating Cloud Salon. Convert prospective salons to paid plans.
        </p>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/70 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Salon / Workspace</th>
              <th className="py-3 px-3">Owner Contact</th>
              <th className="py-3 px-3">Trial Plan</th>
              <th className="py-3 px-3">Days Remaining</th>
              <th className="py-3 px-3">Expiry Date</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">Loading trial accounts...</td>
              </tr>
            ) : trials.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No active 14-day trials right now.
                </td>
              </tr>
            ) : (
              trials.map((t: any) => (
                <tr key={t.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-white">{t.name}</p>
                    <p className="text-[10px] text-amber-400 font-mono">{t.id}</p>
                    <p className="text-[10px] text-slate-400">{t.city}</p>
                  </td>
                  <td className="py-3.5 px-3">
                    <p className="font-semibold text-slate-200">{t.owner_name}</p>
                    <p className="text-[10px] text-slate-400">{t.email}</p>
                    <p className="text-[10px] text-slate-400">{t.phone}</p>
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-amber-300">{t.plan_name}</td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        t.days_remaining <= 3
                          ? "bg-rose-950/60 text-rose-300 border border-rose-700/60"
                          : "bg-blue-950/60 text-blue-300 border border-blue-700/60"
                      }`}
                    >
                      {t.days_remaining} days left
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-300 font-mono text-[11px]">
                    {new Date(t.end_date).toLocaleDateString("en-IN")}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() =>
                        convertMutation.mutate({
                          salonId: t.id,
                          planId: t.plan_name === "Business" ? "plan-business" : "plan-professional",
                        })
                      }
                      className="px-3 py-1 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900 border border-emerald-700/60 rounded-lg text-[10px] font-bold transition"
                    >
                      Convert to Paid
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
