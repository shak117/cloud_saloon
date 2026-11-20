import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Users,
  CreditCard,
  Plus,
  CheckCircle,
  TrendingUp,
  Server,
  Lock,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Activity,
  Layers,
} from "lucide-react";
import { apiClient } from "../../api/client";

export const PlatformOverviewPage: React.FC = () => {
  const navigate = useNavigate();

  // 1. Fetch Platform Metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["superAdminMetrics"],
    queryFn: async () => (await apiClient.get("/super-admin/metrics")).data,
    refetchInterval: 15000,
  });

  // 2. Fetch Recent Audit Logs
  const { data: auditLogs = [] } = useQuery({
    queryKey: ["superAdminAuditLogs"],
    queryFn: async () => (await apiClient.get("/super-admin/audit-logs?limit=8")).data,
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Cloud Technologies Platform Governance
            </span>
            <span className="text-xs text-slate-400">Target: https://salon.cloudtechnologiess.in</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">
            Cloud Salon Platform Overview
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl">
            Master governance dashboard for Cloud Technologies. Monitor multi-tenant salon registrations, 14-day trials, subscription revenue, and PostgreSQL health.
          </p>
        </div>

        <button
          onClick={() => navigate("/platform-admin/add-salon")}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg hover:brightness-110 transition flex items-center gap-2 self-start md:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add New Salon
        </button>
      </div>

      {/* Super Admin Privacy Notice */}
      <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl flex items-center gap-3 text-xs text-slate-300 shadow-sm">
        <Lock className="w-4 h-4 text-amber-400 shrink-0" />
        <div>
          <span className="font-bold text-amber-400">Strict Super Admin Privacy Firewall Active: </span>
          Platform administrators govern tenant lifecycles, subscriptions and health. Operational salon data (appointments, customer PII, stylist commissions and transactions) is cryptographically isolated and private to each salon.
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            Total Registered
          </span>
          <p className="text-2xl font-bold text-white font-sans">
            {metrics?.total_salons ?? "--"}
          </p>
          <span className="text-[10px] text-emerald-400 font-medium">
            {metrics?.active_salons ?? 0} active & operational
          </span>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            14-Day Free Trials
          </span>
          <p className="text-2xl font-bold text-blue-400 font-sans">
            {metrics?.trial_salons ?? "--"}
          </p>
          <span className="text-[10px] text-slate-400">Self-onboarded</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Verified MRR
          </span>
          <p className="text-2xl font-bold text-emerald-400 font-sans">
            ₹ {metrics?.mrr_amount ? Number(metrics.mrr_amount).toLocaleString("en-IN") : "0"}
          </p>
          <span className="text-[10px] text-slate-400">Paid subscriptions</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Plan Distribution
          </span>
          <p className="text-xs font-bold text-slate-200 pt-1">
            Pro: <span className="text-amber-400">{metrics?.professional_subscribers ?? 0}</span> | Biz:{" "}
            <span className="text-purple-400">{metrics?.business_subscribers ?? 0}</span>
          </p>
          <span className="text-[10px] text-slate-400">₹999/mo & ₹1,799/mo</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            System Health
          </span>
          <p className="text-xs font-bold text-emerald-400 pt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {metrics?.platform_health ?? "99.98% Uptime"}
          </p>
          <span className="text-[10px] text-slate-400">PostgreSQL Schema Healthy</span>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => navigate("/platform-admin/tenants")}
          className="bg-slate-900 p-5 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition cursor-pointer group space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-slate-800 rounded-xl text-amber-400 group-hover:bg-amber-400 group-hover:text-slate-950 transition">
              <Building2 className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition" />
          </div>
          <h3 className="font-bold text-white text-sm">Manage Tenants</h3>
          <p className="text-xs text-slate-400">
            View all salons, suspend accounts, activate access, or record subscription renewals.
          </p>
        </div>

        <div
          onClick={() => navigate("/platform-admin/plans")}
          className="bg-slate-900 p-5 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition cursor-pointer group space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-slate-800 rounded-xl text-purple-400 group-hover:bg-purple-400 group-hover:text-slate-950 transition">
              <CreditCard className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition" />
          </div>
          <h3 className="font-bold text-white text-sm">Subscription Tiers</h3>
          <p className="text-xs text-slate-400">
            Configure Professional (₹999/mo) and Business (₹1,799/mo) plans, limits, and pricing.
          </p>
        </div>

        <div
          onClick={() => navigate("/platform-admin/health")}
          className="bg-slate-900 p-5 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition cursor-pointer group space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-slate-800 rounded-xl text-emerald-400 group-hover:bg-emerald-400 group-hover:text-slate-950 transition">
              <Activity className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition" />
          </div>
          <h3 className="font-bold text-white text-sm">System Health</h3>
          <p className="text-xs text-slate-400">
            Check PostgreSQL connection, database schema status, and backup archives.
          </p>
        </div>
      </div>

      {/* Recent Platform Governance Activity */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-xs text-slate-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Recent Platform Administrative Actions
          </h3>
          <button
            onClick={() => navigate("/platform-admin/audit-logs")}
            className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <span>View All Logs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-4">Timestamp</th>
              <th className="py-2.5 px-3">Action</th>
              <th className="py-2.5 px-3">Target Tenant</th>
              <th className="py-2.5 px-4">Event Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {auditLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-500">
                  No governance logs recorded yet.
                </td>
              </tr>
            ) : (
              auditLogs.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">
                    {new Date(log.created_at).toLocaleString("en-IN")}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-amber-300 border border-slate-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-300">{log.salon_id || "GLOBAL"}</td>
                  <td className="py-2.5 px-4 text-slate-200">{log.description}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
