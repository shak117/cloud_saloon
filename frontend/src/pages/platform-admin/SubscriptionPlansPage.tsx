import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  Sparkles,
  Check,
  Edit2,
  ShieldCheck,
  Layers,
  Save,
} from "lucide-react";
import { apiClient } from "../../api/client";

export const SubscriptionPlansPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [editingPlan, setEditingPlan] = useState<any | null>(null);

  // 1. Fetch Plans
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["superAdminPlans"],
    queryFn: async () => (await apiClient.get("/super-admin/plans")).data,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const res = await apiClient.put(`/super-admin/plans/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      alert("Plan updated successfully!");
      setEditingPlan(null);
      queryClient.invalidateQueries({ queryKey: ["superAdminPlans"] });
    },
    onError: (err: any) => {
      alert("Failed to update plan: " + (err.response?.data?.detail || err.message));
    },
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide">
          Official Subscription Plans & Pricing
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Cloud Technologies standard commercial tiers for the Cloud Salon SaaS platform.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((p: any) => (
          <div
            key={p.id}
            className={`bg-slate-900 rounded-2xl border p-6 space-y-5 shadow-xl ${
              p.code === "BUSINESS" ? "border-purple-500/40" : "border-amber-500/40"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    p.code === "BUSINESS" ? "text-purple-400" : "text-amber-400"
                  }`}
                >
                  Official SaaS Tier
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">{p.plan_name}</h3>
                <p className="text-xs text-slate-400 mt-1">{p.description}</p>
              </div>
              <button
                onClick={() => setEditingPlan(p)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                title="Edit Plan Pricing"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>

            {/* Price Box */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-baseline">
              <div>
                <span className="text-xs text-slate-400 block">Monthly Rate</span>
                <span className="text-2xl font-bold text-white font-sans">
                  ₹ {Number(p.monthly_price).toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-slate-400"> / month</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Annual Rate</span>
                <span className="text-lg font-semibold text-slate-200 font-sans">
                  ₹ {Number(p.annual_price).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Limits */}
            <div className="text-xs space-y-2 border-t border-slate-800 pt-3">
              <p className="font-semibold text-slate-300">Limits & Provisioning Rules:</p>
              <div className="grid grid-cols-2 gap-2 text-slate-400">
                <p>
                  Branch Limit:{" "}
                  <span className="font-bold text-white">{p.branch_limit} location(s)</span>
                </p>
                <p>
                  Staff Limit:{" "}
                  <span className="font-bold text-white">
                    {p.staff_limit >= 100 ? "Unlimited" : `${p.staff_limit} accounts`}
                  </span>
                </p>
                <p>
                  Trial Duration:{" "}
                  <span className="font-bold text-white">{p.trial_days || 14} days</span>
                </p>
                <p>
                  Setup Fee:{" "}
                  <span className="font-bold text-white">
                    ₹ {Number(p.setup_fee || 0).toLocaleString("en-IN")}
                  </span>
                </p>
              </div>
            </div>

            {/* Feature Entitlements */}
            <div className="text-xs space-y-2 border-t border-slate-800 pt-3">
              <p className="font-semibold text-slate-300">Feature Entitlements:</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries((p.feature_configuration || {}) as Record<string, boolean>).map(([key, val]) => (
                  <span
                    key={key}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 ${
                      val
                        ? "bg-emerald-950/60 text-emerald-300 border border-emerald-700/60"
                        : "bg-slate-950 text-slate-600 line-through"
                    }`}
                  >
                    {val ? <Check className="w-3 h-3" /> : null}
                    {key.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">
                Edit {editingPlan.plan_name} Tier
              </h3>
              <button onClick={() => setEditingPlan(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate({
                  id: editingPlan.id,
                  monthly_price: parseFloat(editingPlan.monthly_price),
                  setup_fee: parseFloat(editingPlan.setup_fee || 0),
                  annual_price: parseFloat(editingPlan.annual_price || 0),
                  branch_limit: parseInt(editingPlan.branch_limit),
                  staff_limit: parseInt(editingPlan.staff_limit),
                  trial_days: parseInt(editingPlan.trial_days || 14),
                });
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-semibold block mb-1 text-slate-300">Monthly Price (₹) *</label>
                <input
                  type="number"
                  required
                  value={editingPlan.monthly_price}
                  onChange={(e) => setEditingPlan({ ...editingPlan, monthly_price: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-300">Setup Fee (₹)</label>
                  <input
                    type="number"
                    value={editingPlan.setup_fee || 0}
                    onChange={(e) => setEditingPlan({ ...editingPlan, setup_fee: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-300">Annual Price (₹)</label>
                  <input
                    type="number"
                    value={editingPlan.annual_price || 0}
                    onChange={(e) => setEditingPlan({ ...editingPlan, annual_price: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-300">Branch Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={editingPlan.branch_limit}
                    onChange={(e) => setEditingPlan({ ...editingPlan, branch_limit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-300">Staff Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={editingPlan.staff_limit}
                    onChange={(e) => setEditingPlan({ ...editingPlan, staff_limit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex-1 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 transition"
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
