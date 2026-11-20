import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { RotateCcw, AlertTriangle, CheckCircle, Calendar, CreditCard } from "lucide-react";
import { apiClient } from "../../api/client";

export const RenewalsExpiryPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: renewals = [], isLoading } = useQuery({
    queryKey: ["superAdminRenewals"],
    queryFn: async () => (await apiClient.get("/super-admin/renewals")).data,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide">
          Renewals & Expiry Tracker
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Salons with subscriptions expiring within 30 days or accounts that have expired.
        </p>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/70 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Salon Tenant</th>
              <th className="py-3 px-3">Owner Contact</th>
              <th className="py-3 px-3">Plan</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">End Date</th>
              <th className="py-3 px-3">Time Left</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">Checking renewal schedules...</td>
              </tr>
            ) : renewals.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  All active salons are up to date! No renewals pending in next 30 days.
                </td>
              </tr>
            ) : (
              renewals.map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-white">{r.name}</p>
                    <p className="text-[10px] text-amber-400 font-mono">{r.id}</p>
                  </td>
                  <td className="py-3.5 px-3">
                    <p className="font-semibold text-slate-200">{r.owner_name}</p>
                    <p className="text-[10px] text-slate-400">{r.phone}</p>
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-slate-300">{r.plan_name}</td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.is_expired
                          ? "bg-rose-950/60 text-rose-300 border border-rose-700/60"
                          : "bg-amber-950/60 text-amber-300 border border-amber-700/60"
                      }`}
                    >
                      {r.is_expired ? "EXPIRED" : "EXPIRING SOON"}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-300 font-mono text-[11px]">
                    {new Date(r.subscription_end_date).toLocaleDateString("en-IN")}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-bold text-slate-200">
                      {r.is_expired ? `${Math.abs(r.days_until_expiry)} days ago` : `${r.days_until_expiry} days remaining`}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => navigate("/platform-admin/tenants")}
                      className="px-3 py-1 bg-amber-400 text-slate-950 hover:bg-amber-300 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ml-auto"
                    >
                      <CreditCard className="w-3 h-3" />
                      Renew Account
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
