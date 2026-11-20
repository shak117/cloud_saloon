import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Search,
  Plus,
  PlayCircle,
  PauseCircle,
  CreditCard,
  ExternalLink,
  ShieldAlert,
  Calendar,
  CheckCircle,
  Clock,
  Filter,
} from "lucide-react";
import { apiClient } from "../../api/client";

interface SalonSummary {
  id: string;
  name: string;
  slug: string;
  owner_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  business_type: string;
  plan_name: string;
  plan_code: string;
  subscription_status: string;
  subscription_start_date: string;
  subscription_end_date: string;
  suspension_reason: string | null;
  is_active: boolean;
  total_customers_count: number;
  total_appointments_count: number;
  total_staff_count: number;
  created_at: string;
}

export const ManageTenantsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "TRIAL" | "SUSPENDED">("ALL");
  const [showPaymentModal, setShowPaymentModal] = useState<string | null>(null);

  // Payment form state
  const [payForm, setPayForm] = useState({
    plan_id: "plan-professional",
    amount: "999.00",
    billing_cycle: "MONTHLY",
    payment_reference: "",
    duration_months: 1,
    notes: "Verified subscription renewal by Cloud Technologies",
  });

  // 1. Fetch Salons
  const { data: salons = [], isLoading } = useQuery<SalonSummary[]>({
    queryKey: ["superAdminSalons"],
    queryFn: async () => (await apiClient.get("/super-admin/salons")).data,
  });

  // Toggle Salon Status Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ salonId, status, reason }: { salonId: string; status: string; reason?: string }) => {
      const res = await apiClient.post(`/super-admin/salons/${salonId}/status`, { status, reason });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superAdminSalons"] });
      queryClient.invalidateQueries({ queryKey: ["superAdminMetrics"] });
    },
    onError: (err: any) => {
      alert("Failed to update status: " + (err.response?.data?.detail || err.message));
    },
  });

  // Record Payment Mutation
  const paymentMutation = useMutation({
    mutationFn: async ({ salonId, ...payload }: { salonId: string } & typeof payForm) => {
      const res = await apiClient.post("/super-admin/subscriptions/payment", {
        salon_id: salonId,
        ...payload,
        amount: parseFloat(payload.amount),
      });
      return res.data;
    },
    onSuccess: () => {
      alert("Subscription payment recorded and tenant access extended!");
      setShowPaymentModal(null);
      queryClient.invalidateQueries({ queryKey: ["superAdminSalons"] });
      queryClient.invalidateQueries({ queryKey: ["superAdminMetrics"] });
    },
    onError: (err: any) => {
      alert("Failed to record payment: " + (err.response?.data?.detail || err.message));
    },
  });

  const filteredSalons = salons.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.owner_name.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === "ALL") return true;
    return s.subscription_status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">
            Manage Salon Tenants
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Directory of all independent salon workspaces registered on the Cloud Salon SaaS platform.
          </p>
        </div>

        <button
          onClick={() => navigate("/platform-admin/add-salon")}
          className="px-4 py-2.5 bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg hover:bg-amber-300 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add New Salon
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by salon name, owner, city or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 text-xs text-white rounded-xl border border-slate-800 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 flex items-center gap-1 font-semibold text-[11px]">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {(["ALL", "ACTIVE", "TRIAL", "SUSPENDED"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition ${
                statusFilter === filter
                  ? "bg-amber-400 text-slate-950 shadow-sm"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Salons Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/70 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Salon / Business</th>
              <th className="py-3 px-3">Owner Contact</th>
              <th className="py-3 px-3">Subscription Tier</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Valid Until</th>
              <th className="py-3 px-3">Aggregated Usage</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  Loading salon tenants...
                </td>
              </tr>
            ) : filteredSalons.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  No salons match the selected search or filter.
                </td>
              </tr>
            ) : (
              filteredSalons.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4">
                    <div>
                      <p className="font-bold text-white text-sm">{s.name}</p>
                      <p className="text-[10px] text-amber-400/90 font-mono">Tenant ID: {s.id}</p>
                      <p className="text-[10px] text-slate-400">{s.city}, {s.state}</p>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div>
                      <p className="font-semibold text-slate-200">{s.owner_name}</p>
                      <p className="text-[10px] text-slate-400">{s.email}</p>
                      <p className="text-[10px] text-slate-400">{s.phone}</p>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        s.plan_code === "BUSINESS"
                          ? "bg-purple-900/40 text-purple-300 border border-purple-700/60"
                          : "bg-amber-900/40 text-amber-300 border border-amber-700/60"
                      }`}
                    >
                      {s.plan_name}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    {s.subscription_status === "ACTIVE" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-900/40 text-emerald-300 border border-emerald-700/60">
                        Active
                      </span>
                    )}
                    {s.subscription_status === "TRIAL" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-900/40 text-blue-300 border border-blue-700/60">
                        14-Day Trial
                      </span>
                    )}
                    {s.subscription_status === "SUSPENDED" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-900/40 text-rose-300 border border-rose-700/60">
                        Suspended
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-slate-300 font-mono text-[11px]">
                    {s.subscription_end_date
                      ? new Date(s.subscription_end_date).toLocaleDateString("en-IN")
                      : "N/A"}
                  </td>
                  <td className="py-3.5 px-3 text-slate-400">
                    <div className="text-[10px] space-y-0.5">
                      <p>Appointments: <span className="font-bold text-slate-200">{s.total_appointments_count}</span></p>
                      <p>Customers: <span className="font-bold text-slate-200">{s.total_customers_count}</span></p>
                      <p>Staff: <span className="font-bold text-slate-200">{s.total_staff_count}</span></p>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Record Payment Button */}
                      <button
                        onClick={() => {
                          setShowPaymentModal(s.id);
                          setPayForm((prev) => ({
                            ...prev,
                            plan_id: s.plan_name === "Business" ? "plan-business" : "plan-professional",
                            amount: s.plan_name === "Business" ? "1799.00" : "999.00",
                          }));
                        }}
                        className="px-2.5 py-1 bg-slate-800 text-amber-300 hover:bg-slate-700 border border-slate-700 rounded-lg text-[10px] font-bold transition"
                        title="Record Manual Subscription Payment"
                      >
                        Renew / Pay
                      </button>

                      {/* Suspend / Activate toggle */}
                      {s.subscription_status === "SUSPENDED" ? (
                        <button
                          onClick={() => toggleStatusMutation.mutate({ salonId: s.id, status: "ACTIVE" })}
                          className="px-2.5 py-1 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/80 border border-emerald-700/60 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                        >
                          <PlayCircle className="w-3 h-3" />
                          Activate
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const reason = prompt("Enter reason for suspending this salon account:");
                            if (reason) {
                              toggleStatusMutation.mutate({ salonId: s.id, status: "SUSPENDED", reason });
                            }
                          }}
                          className="px-2.5 py-1 bg-rose-950/60 text-rose-300 hover:bg-rose-900/80 border border-rose-700/60 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                        >
                          <PauseCircle className="w-3 h-3" />
                          Suspend
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record Manual Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-400" />
                Record Manual Subscription Payment
              </h3>
              <button onClick={() => setShowPaymentModal(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                paymentMutation.mutate({ salonId: showPaymentModal, ...payForm });
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-semibold block mb-1 text-slate-300">Plan</label>
                <select
                  value={payForm.plan_id}
                  onChange={(e) => {
                    const pid = e.target.value;
                    setPayForm({
                      ...payForm,
                      plan_id: pid,
                      amount: pid === "plan-business" ? "1799.00" : "999.00",
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="plan-professional">Professional (₹999/mo)</option>
                  <option value="plan-business">Business (₹1,799/mo)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-300">Amount Paid (₹) *</label>
                  <input
                    type="number"
                    required
                    value={payForm.amount}
                    onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-white focus:outline-none focus:border-amber-400 font-sans font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-300">Duration (Months) *</label>
                  <input
                    type="number"
                    min="1"
                    max="36"
                    required
                    value={payForm.duration_months}
                    onChange={(e) => setPayForm({ ...payForm, duration_months: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-300">UPI / UTR / Cheque Reference *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UPI-20261116-992100"
                  value={payForm.payment_reference}
                  onChange={(e) => setPayForm({ ...payForm, payment_reference: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-300">Internal Governance Notes</label>
                <input
                  type="text"
                  value={payForm.notes}
                  onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentMutation.isPending}
                  className="flex-1 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 transition"
                >
                  {paymentMutation.isPending ? "Recording..." : "Record & Extend Access"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
