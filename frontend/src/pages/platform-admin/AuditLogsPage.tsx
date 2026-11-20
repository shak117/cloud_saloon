import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileCheck, ShieldCheck, Search, Filter } from "lucide-react";
import { apiClient } from "../../api/client";

export const AuditLogsPage: React.FC = () => {
  const [search, setSearch] = useState("");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["superAdminAuditLogsAll"],
    queryFn: async () => (await apiClient.get("/super-admin/audit-logs?limit=100")).data,
  });

  const filteredLogs = logs.filter((l: any) =>
    l.description?.toLowerCase().includes(search.toLowerCase()) ||
    l.action?.toLowerCase().includes(search.toLowerCase()) ||
    l.salon_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide">
          Platform Governance Audit Logs
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Immutable audit record of tenant provisioning, plan modifications, status toggles, and manual payments.
        </p>
      </div>

      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div className="relative w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by action, salon ID or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 text-xs text-white rounded-xl border border-slate-800 focus:outline-none focus:border-amber-400"
          />
        </div>
        <span className="text-xs text-slate-400">
          Total Logs: <span className="font-bold text-white">{logs.length}</span>
        </span>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/70 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-3">Action Type</th>
              <th className="py-3 px-3">Target Tenant</th>
              <th className="py-3 px-4">Event Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400">Loading audit trail...</td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">No audit logs matching search.</td>
              </tr>
            ) : (
              filteredLogs.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                    {new Date(log.created_at).toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-amber-300 border border-slate-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-mono text-slate-200">{log.salon_id || "GLOBAL"}</td>
                  <td className="py-3.5 px-4 text-slate-200">{log.description}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

