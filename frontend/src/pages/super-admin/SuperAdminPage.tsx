import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldAlert,
  Building2,
  Users,
  CreditCard,
  Plus,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Server,
  Lock,
  PauseCircle,
  PlayCircle,
  FileCheck,
  Search,
  ExternalLink,
  Calendar,
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

export const SuperAdminPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"SALONS" | "PLANS" | "LOGS">("SALONS");
  const [search, setSearch] = useState("");
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState<string | null>(null);

  // New salon form state
  const [regForm, setRegForm] = useState({
    salon_name: "",
    owner_name: "",
    owner_email: "",
    owner_phone: "",
    owner_password: "",
    plan_id: "plan-professional",
    is_trial: true,
    city: "Satara",
    state: "Maharashtra",
    address: "",
  });

  // Payment form state
  const [payForm, setPayForm] = useState({
    plan_id: "plan-professional",
    amount: "999.00",
    billing_cycle: "MONTHLY",
    payment_reference: "",
    duration_months: 1,
    notes: "Verified subscription renewal",
  });

  // 1. Fetch Platform Metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["superAdminMetrics"],
    queryFn: async () => (await apiClient.get("/super-admin/metrics")).data,
    refetchInterval: 30000,
  });

  // 2. Fetch Salons
  const { data: salons = [], isLoading: salonsLoading } = useQuery<SalonSummary[]>({
    queryKey: ["superAdminSalons"],
    queryFn: async () => (await apiClient.get("/super-admin/salons")).data,
  });

  // 3. Fetch Plans
  const { data: plans = [] } = useQuery({
    queryKey: ["superAdminPlans"],
    queryFn: async () => (await apiClient.get("/super-admin/plans")).data,
  });

  // 4. Fetch Audit Logs
  const { data: auditLogs = [] } = useQuery({
    queryKey: ["superAdminAuditLogs"],
    queryFn: async () => (await apiClient.get("/super-admin/audit-logs")).data,
  });

  // Register Salon Mutation
  const registerMutation = useMutation({
    mutationFn: async (payload: typeof regForm) => {
      const res = await apiClient.post("/super-admin/salons", payload);
      return res.data;
    },
    onSuccess: () => {
      alert("Salon registered successfully with clean isolated environment!");
      setShowRegisterModal(false);
      setRegForm({
        salon_name: "",
        owner_name: "",
        owner_email: "",
        owner_phone: "",
        owner_password: "",
        plan_id: "plan-professional",
        is_trial: true,
        city: "Satara",
        state: "Maharashtra",
        address: "",
      });
      queryClient.invalidateQueries({ queryKey: ["superAdminSalons"] });
      queryClient.invalidateQueries({ queryKey: ["superAdminMetrics"] });
    },
    onError: (err: any) => {
      alert("Registration failed: " + (err.response?.data?.detail || err.message));
    },
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
      alert("Subscription payment recorded and access extended!");
      setShowPaymentModal(null);
      queryClient.invalidateQueries({ queryKey: ["superAdminSalons"] });
      queryClient.invalidateQueries({ queryKey: ["superAdminMetrics"] });
    },
    onError: (err: any) => {
      alert("Failed to record payment: " + (err.response?.data?.detail || err.message));
    },
  });

  const filteredSalons = salons.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.owner_name.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-salon-charcoal via-salon-charcoal-card to-slate-900 p-6 rounded-2xl border border-salon-border-dark text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              Cloud Technologies Platform Governance
            </span>
            <span className="text-xs text-gray-400">Target: https://salon.cloudtechnologiess.in</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-white tracking-wide">
            Cloud Salon – Central Super Admin
          </h1>
          <p className="text-xs text-gray-300 max-w-2xl">
            Manage multi-tenant salon registrations, official subscription tiers (Professional ₹999 & Business ₹1,799), verified manual payment renewals, and platform health.
          </p>
        </div>

        <button
          onClick={() => setShowRegisterModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-salon-gold to-salon-rose text-salon-charcoal font-bold text-xs rounded-xl shadow-lg hover:brightness-110 transition flex items-center gap-2 self-start md:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          Register New Salon
        </button>
      </div>

      {/* Super Admin Privacy Notice */}
      <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex items-center gap-3 text-xs text-amber-900 shadow-sm">
        <Lock className="w-4 h-4 text-amber-700 shrink-0" />
        <div>
          <span className="font-bold">Strict Super Admin Privacy Firewall Active: </span>
          Super Admin is restricted to high-level tenant lifecycle governance. Individual customer records, invoices, transactions, and stylist commissions are confidential to each salon and inaccessible to platform administrators.
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-salon-border shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-salon-gold" />
            Total Salons
          </span>
          <p className="text-2xl font-bold text-salon-charcoal font-sans">
            {metrics?.total_salons ?? "--"}
          </p>
          <span className="text-[10px] text-emerald-600 font-medium">
            {metrics?.active_salons ?? 0} active & operational
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-salon-border shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            14-Day Free Trials
          </span>
          <p className="text-2xl font-bold text-blue-600 font-sans">
            {metrics?.trial_salons ?? "--"}
          </p>
          <span className="text-[10px] text-gray-500">Self-onboarded</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-salon-border shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            Verified MRR
          </span>
          <p className="text-2xl font-bold text-emerald-700 font-sans">
            ₹ {metrics?.mrr_amount ? Number(metrics.mrr_amount).toLocaleString("en-IN") : "0"}
          </p>
          <span className="text-[10px] text-gray-500">Paid subscriptions</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-salon-border shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            Subscription Tiers
          </span>
          <p className="text-xs font-bold text-gray-800 pt-1">
            Pro: <span className="text-salon-gold-dark">{metrics?.professional_subscribers ?? 0}</span> | Biz:{" "}
            <span className="text-purple-600">{metrics?.business_subscribers ?? 0}</span>
          </p>
          <span className="text-[10px] text-gray-500">₹999/mo & ₹1,799/mo</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-salon-border shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
            <Server className="w-3.5 h-3.5 text-emerald-500" />
            Platform Health
          </span>
          <p className="text-xs font-bold text-emerald-600 pt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {metrics?.platform_health ?? "99.98% Uptime"}
          </p>
          <span className="text-[10px] text-gray-500">PostgreSQL Schema Healthy</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-salon-border gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("SALONS")}
          className={`pb-2.5 transition flex items-center gap-1.5 ${
            activeTab === "SALONS"
              ? "border-b-2 border-salon-gold text-salon-charcoal font-bold"
              : "text-gray-500 hover:text-black"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Registered Salons ({salons.length})
        </button>

        <button
          onClick={() => setActiveTab("PLANS")}
          className={`pb-2.5 transition flex items-center gap-1.5 ${
            activeTab === "PLANS"
              ? "border-b-2 border-salon-gold text-salon-charcoal font-bold"
              : "text-gray-500 hover:text-black"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Subscription Plans & Pricing
        </button>

        <button
          onClick={() => setActiveTab("LOGS")}
          className={`pb-2.5 transition flex items-center gap-1.5 ${
            activeTab === "LOGS"
              ? "border-b-2 border-salon-gold text-salon-charcoal font-bold"
              : "text-gray-500 hover:text-black"
          }`}
        >
          <FileCheck className="w-4 h-4" />
          Platform Governance Logs
        </button>
      </div>

      {/* Tab 1: Salon Management */}
      {activeTab === "SALONS" && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search salons by name, owner or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white text-xs rounded-xl border border-salon-border focus:outline-none focus:border-salon-gold"
              />
            </div>
            <span className="text-xs text-gray-500">
              Showing {filteredSalons.length} of {salons.length} registered salons
            </span>
          </div>

          {/* Salons Table */}
          <div className="bg-white rounded-2xl border border-salon-border shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-salon-ivory text-gray-600 font-semibold border-b border-salon-border">
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
              <tbody className="divide-y divide-salon-border">
                {filteredSalons.map((s) => (
                  <tr key={s.id} className="hover:bg-salon-ivory/40 transition">
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-salon-charcoal">{s.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">ID: {s.id}</p>
                        <p className="text-[10px] text-gray-500">{s.city}, {s.state}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div>
                        <p className="font-semibold text-salon-charcoal">{s.owner_name}</p>
                        <p className="text-[10px] text-gray-500">{s.email}</p>
                        <p className="text-[10px] text-gray-500">{s.phone}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        s.plan_code === "BUSINESS"
                          ? "bg-purple-100 text-purple-800 border border-purple-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}>
                        {s.plan_name}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      {s.subscription_status === "ACTIVE" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      )}
                      {s.subscription_status === "TRIAL" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          14-Day Trial
                        </span>
                      )}
                      {s.subscription_status === "SUSPENDED" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          Suspended
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-gray-600 font-mono text-[11px]">
                      {s.subscription_end_date ? new Date(s.subscription_end_date).toLocaleDateString("en-IN") : "N/A"}
                    </td>
                    <td className="py-3.5 px-3 text-gray-600">
                      <div className="text-[10px] space-y-0.5">
                        <p>Appointments: <span className="font-bold">{s.total_appointments_count}</span></p>
                        <p>Customers: <span className="font-bold">{s.total_customers_count}</span></p>
                        <p>Staff: <span className="font-bold">{s.total_staff_count}</span></p>
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
                          className="px-2.5 py-1 bg-salon-ivory text-salon-charcoal hover:bg-salon-ivory-warm border border-salon-border rounded-lg text-[10px] font-bold transition"
                          title="Record Manual Subscription Payment"
                        >
                          Renew / Pay
                        </button>

                        {/* Suspend / Activate toggle */}
                        {s.subscription_status === "SUSPENDED" ? (
                          <button
                            onClick={() => toggleStatusMutation.mutate({ salonId: s.id, status: "ACTIVE" })}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
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
                            className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                          >
                            <PauseCircle className="w-3 h-3" />
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Subscription Plans Manager */}
      {activeTab === "PLANS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((p: any) => (
            <div key={p.id} className="bg-white p-6 rounded-2xl border border-salon-border shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-salon-gold">
                    Official SaaS Tier
                  </span>
                  <h3 className="text-xl font-bold text-salon-charcoal">{p.plan_name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{p.description}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-salon-ivory text-salon-charcoal border border-salon-border">
                  {p.code}
                </span>
              </div>

              <div className="bg-salon-ivory p-4 rounded-xl border border-salon-border flex justify-between items-baseline">
                <div>
                  <span className="text-xs text-gray-500 block">Subscription Fee</span>
                  <span className="text-2xl font-bold text-salon-charcoal font-sans">
                    ₹ {Number(p.monthly_price).toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-gray-500"> / month</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 block">One-time Setup</span>
                  <span className="text-lg font-semibold text-gray-700 font-sans">
                    ₹ {Number(p.setup_fee || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="text-xs space-y-2 border-t border-salon-border pt-3">
                <p className="font-semibold text-gray-700">Limits & Policies:</p>
                <div className="grid grid-cols-2 gap-2 text-gray-600">
                  <p>Branch Limit: <span className="font-bold text-salon-charcoal">{p.branch_limit} branch(es)</span></p>
                  <p>Staff Limit: <span className="font-bold text-salon-charcoal">{p.staff_limit >= 100 ? "Unlimited" : `${p.staff_limit} accounts`}</span></p>
                  <p>Trial Period: <span className="font-bold text-salon-charcoal">{p.trial_days || 14} days</span></p>
                  <p>Annual Rate: <span className="font-bold text-salon-charcoal">₹ {Number(p.annual_price).toLocaleString("en-IN")}</span></p>
                </div>
              </div>

              <div className="text-xs space-y-2 border-t border-salon-border pt-3">
                <p className="font-semibold text-gray-700">Feature Entitlements:</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(p.feature_configuration || {}).map(([key, val]) => (
                    <span
                      key={key}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                        val
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-gray-100 text-gray-400 line-through"
                      }`}
                    >
                      {key.replace("_", " ")}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Platform Governance Audit Logs */}
      {activeTab === "LOGS" && (
        <div className="bg-white rounded-2xl border border-salon-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-salon-border font-bold text-xs text-gray-700">
            Recent Platform Administrative Actions
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-salon-ivory text-gray-600 font-semibold border-b border-salon-border">
              <tr>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-3">Action Type</th>
                <th className="py-2.5 px-3">Target Salon</th>
                <th className="py-2.5 px-4">Event Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-salon-border">
              {auditLogs.map((log: any) => (
                <tr key={log.id} className="hover:bg-salon-ivory/30">
                  <td className="py-2.5 px-4 text-gray-500 font-mono text-[11px]">
                    {new Date(log.created_at).toLocaleString("en-IN")}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-gray-600">{log.salon_id || "GLOBAL"}</td>
                  <td className="py-2.5 px-4 text-salon-charcoal">{log.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Register New Salon Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-salon-border pb-3">
              <h3 className="font-bold text-base text-salon-charcoal flex items-center gap-2">
                <Building2 className="w-5 h-5 text-salon-gold" />
                Register New Salon Account
              </h3>
              <button onClick={() => setShowRegisterModal(false)} className="text-gray-400 hover:text-black">
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                registerMutation.mutate(regForm);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-semibold block mb-1">Salon / Brand Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Elegance Beauty Lounge"
                  value={regForm.salon_name}
                  onChange={(e) => setRegForm({ ...regForm, salon_name: e.target.value })}
                  className="w-full px-3 py-2 border border-salon-border rounded-lg bg-salon-ivory focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Owner Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patel"
                    value={regForm.owner_name}
                    onChange={(e) => setRegForm({ ...regForm, owner_name: e.target.value })}
                    className="w-full px-3 py-2 border border-salon-border rounded-lg bg-salon-ivory focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Owner Phone (WhatsApp) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 9822XXXXXX"
                    value={regForm.owner_phone}
                    onChange={(e) => setRegForm({ ...regForm, owner_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-salon-border rounded-lg bg-salon-ivory focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Owner Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="owner@salon.com"
                    value={regForm.owner_email}
                    onChange={(e) => setRegForm({ ...regForm, owner_email: e.target.value })}
                    className="w-full px-3 py-2 border border-salon-border rounded-lg bg-salon-ivory focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Initial Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={regForm.owner_password}
                    onChange={(e) => setRegForm({ ...regForm, owner_password: e.target.value })}
                    className="w-full px-3 py-2 border border-salon-border rounded-lg bg-salon-ivory focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Subscription Tier *</label>
                  <select
                    value={regForm.plan_id}
                    onChange={(e) => setRegForm({ ...regForm, plan_id: e.target.value })}
                    className="w-full px-3 py-2 border border-salon-border rounded-lg bg-salon-ivory focus:outline-none"
                  >
                    <option value="plan-professional">Professional (₹999/mo - 1 branch, 3 staff)</option>
                    <option value="plan-business">Business (₹1,799/mo - 3 branches, unlimited staff)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">City / Region *</label>
                  <input
                    type="text"
                    required
                    value={regForm.city}
                    onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                    className="w-full px-3 py-2 border border-salon-border rounded-lg bg-salon-ivory focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="trial_chk"
                  checked={regForm.is_trial}
                  onChange={(e) => setRegForm({ ...regForm, is_trial: e.target.checked })}
                  className="rounded text-salon-gold focus:ring-0"
                />
                <label htmlFor="trial_chk" className="font-medium text-gray-700">
                  Enable 14-Day Full Feature Free Trial
                </label>
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="flex-1 py-2 rounded-xl bg-salon-charcoal text-white font-bold hover:bg-black transition"
                >
                  {registerMutation.isPending ? "Creating Salon..." : "Create Tenant & Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Manual Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-salon-border pb-3">
              <h3 className="font-bold text-base text-salon-charcoal flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-salon-gold" />
                Record Manual Subscription Payment
              </h3>
              <button onClick={() => setShowPaymentModal(null)} className="text-gray-400 hover:text-black">
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
                <label className="font-semibold block mb-1">Plan</label>
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
                  className="w-full px-3 py-2 border border-salon-border rounded-lg bg-salon-ivory focus:outline-none"
                >
                  <option value="plan-professional">Professional (₹999/mo)</option>
                  <option value="plan-business">Business (₹1,799/mo)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Amount Paid (₹) *</label>
                  <input
                    type="number"
                    required
                    value={payForm.amount}
                    onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-salon-border rounded-lg bg-salon-ivory focus:outline-none font-sans font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Duration (Months) *</label>
                  <input
                    type="number"
                    min="1"
                    max="36"
                    required
                    value={payForm.duration_months}
                    onChange={(e) => setPayForm({ ...payForm, duration_months: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-salon-border rounded-lg bg-salon-ivory focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">UPI / UTR / Cheque Reference *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UPI-20261115-992100"
                  value={payForm.payment_reference}
                  onChange={(e) => setPayForm({ ...payForm, payment_reference: e.target.value })}
                  className="w-full px-3 py-2 border border-salon-border rounded-lg bg-salon-ivory focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Internal Notes</label>
                <input
                  type="text"
                  value={payForm.notes}
                  onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-salon-border rounded-lg bg-salon-ivory focus:outline-none"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(null)}
                  className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentMutation.isPending}
                  className="flex-1 py-2 rounded-xl bg-emerald-700 text-white font-bold hover:bg-emerald-800 transition"
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
