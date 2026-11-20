import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  Plus,
  CheckCircle,
  Clock,
  Search,
  Filter,
  DollarSign,
  FileCheck,
} from "lucide-react";
import { apiClient } from "../../api/client";

export const SubscriptionsPaymentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    salon_id: "",
    plan_id: "plan-professional",
    amount: "999.00",
    billing_cycle: "MONTHLY",
    payment_reference: "",
    duration_months: 1,
    notes: "Direct manual payment verified",
  });

  // 1. Fetch Subscriptions
  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ["superAdminSubscriptions"],
    queryFn: async () => (await apiClient.get("/super-admin/subscriptions")).data,
  });

  // 2. Fetch Salons for dropdown
  const { data: salons = [] } = useQuery({
    queryKey: ["superAdminSalons"],
    queryFn: async () => (await apiClient.get("/super-admin/salons")).data,
  });

  const paymentMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      const res = await apiClient.post("/super-admin/subscriptions/payment", {
        ...payload,
        amount: parseFloat(payload.amount),
      });
      return res.data;
    },
    onSuccess: () => {
      alert("Payment recorded successfully!");
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ["superAdminSubscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["superAdminMetrics"] });
    },
    onError: (err: any) => {
      alert("Failed to record payment: " + (err.response?.data?.detail || err.message));
    },
  });

  const filteredSubs = subscriptions.filter((s: any) =>
    s.salon_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.salon_id?.toLowerCase().includes(search.toLowerCase()) ||
    s.payment_reference?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">
            Subscriptions & Manual Payments
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Audit trail of verified billing transactions and manual subscription extensions.
          </p>
        </div>

        <button
          onClick={() => {
            if (salons.length > 0 && !form.salon_id) {
              setForm((prev) => ({ ...prev, salon_id: salons[0].id }));
            }
            setShowModal(true);
          }}
          className="px-4 py-2.5 bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg hover:bg-amber-300 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Record New Payment
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div className="relative w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by salon name or reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 text-xs text-white rounded-xl border border-slate-800 focus:outline-none focus:border-amber-400"
          />
        </div>
        <span className="text-xs text-slate-400">
          Total Recorded: <span className="font-bold text-white">{subscriptions.length}</span>
        </span>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/70 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Recorded Date</th>
              <th className="py-3 px-3">Salon Tenant</th>
              <th className="py-3 px-3">Plan</th>
              <th className="py-3 px-3">Amount</th>
              <th className="py-3 px-3">Cycle</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-4">UTR / Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">Loading payment history...</td>
              </tr>
            ) : filteredSubs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">No payment records found.</td>
              </tr>
            ) : (
              filteredSubs.map((sub: any) => (
                <tr key={sub.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                    {new Date(sub.created_at).toLocaleDateString("en-IN")}
                  </td>
                  <td className="py-3.5 px-3">
                    <p className="font-bold text-white">{sub.salon_name}</p>
                    <p className="text-[10px] text-amber-400 font-mono">{sub.salon_id}</p>
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-slate-200">{sub.plan_name}</td>
                  <td className="py-3.5 px-3 font-bold font-sans text-emerald-400 text-sm">
                    ₹ {Number(sub.amount).toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-semibold">
                      {sub.billing_cycle}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-700/60">
                      {sub.payment_status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                    {sub.payment_reference || "N/A"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-400" />
                Record Manual Subscription Payment
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                paymentMutation.mutate(form);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-semibold block mb-1 text-slate-300">Select Salon *</label>
                <select
                  value={form.salon_id}
                  onChange={(e) => setForm({ ...form, salon_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                >
                  {salons.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-300">Plan</label>
                <select
                  value={form.plan_id}
                  onChange={(e) => {
                    const pid = e.target.value;
                    setForm({
                      ...form,
                      plan_id: pid,
                      amount: pid === "plan-business" ? "1799.00" : "999.00",
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                >
                  <option value="plan-professional">Professional (₹999/mo)</option>
                  <option value="plan-business">Business (₹1,799/mo)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-300">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-300">Duration (Months) *</label>
                  <input
                    type="number"
                    min="1"
                    max="36"
                    required
                    value={form.duration_months}
                    onChange={(e) => setForm({ ...form, duration_months: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-300">UPI / Reference Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UPI-20261116-883311"
                  value={form.payment_reference}
                  onChange={(e) => setForm({ ...form, payment_reference: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-300">Notes</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentMutation.isPending}
                  className="flex-1 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 transition"
                >
                  {paymentMutation.isPending ? "Recording..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
