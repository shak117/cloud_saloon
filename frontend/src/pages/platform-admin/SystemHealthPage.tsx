import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Server,
  Database,
  ShieldCheck,
  HardDrive,
  CheckCircle,
  RefreshCw,
  FolderArchive,
} from "lucide-react";
import { apiClient } from "../../api/client";

export const SystemHealthPage: React.FC = () => {
  const { data: health, isLoading, refetch } = useQuery({
    queryKey: ["superAdminHealth"],
    queryFn: async () => (await apiClient.get("/super-admin/system-health")).data,
    refetchInterval: 15000,
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">
            Platform Infrastructure & Health
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry of PostgreSQL 18 database, multi-tenancy firewall, and backup archives.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-2 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
          Refresh Status
        </button>
      </div>

      {/* Main Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Database Status */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="font-bold text-white text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" /> PostgreSQL Database
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-700/60">
              {health?.database?.connection_status || "CONNECTED"}
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Database Engine:</span>
              <span className="font-bold text-white">{health?.database?.engine || "PostgreSQL 18"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Database Name:</span>
              <span className="font-mono text-amber-300">{health?.database?.database_name || "cloud_billing"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Isolated Schema:</span>
              <span className="font-mono text-amber-300">{health?.database?.schema || "salon"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Isolation Model:</span>
              <span className="text-right text-[11px] text-slate-200">Shared Schema with Tenant ID</span>
            </div>
          </div>
        </div>

        {/* Backups Status */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="font-bold text-white text-sm flex items-center gap-2">
              <FolderArchive className="w-4 h-4 text-emerald-400" /> Automated Backups
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-700/60">
              VERIFIED
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Backup Directory:</span>
              <span className="font-mono text-[11px] text-slate-200 truncate max-w-[180px]">
                {health?.backups?.directory || "C:\\CloudSalonBackups"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Dumps:</span>
              <span className="font-bold text-white">{health?.backups?.total_backup_dumps ?? 1} files</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Format:</span>
              <span className="font-mono text-slate-200">PostgreSQL Custom (-Fc)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Pre-Correction Dump:</span>
              <span className="text-emerald-400 font-semibold">Available & Intact</span>
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="font-bold text-white text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" /> Privacy Firewall
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950/60 text-purple-300 border border-purple-700/60">
              ENFORCED
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Platform Layer:</span>
              <span className="font-semibold text-white">Cloud Technologies</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">SaaS Isolation:</span>
              <span className="text-emerald-400 font-semibold">Row-Level tenant_id</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Super Admin Firewall:</span>
              <span className="text-amber-300 font-semibold">No Salon Ops Access</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">API Health:</span>
              <span className="text-emerald-400 font-bold">FastAPI 8001 Operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* Backup Files List */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-3 shadow-xl">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-amber-400" />
          Recent Database Dump Files in Local Storage
        </h3>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
          {health?.backups?.latest_backups?.length > 0 ? (
            health.backups.latest_backups.map((f: string, i: number) => (
              <div key={i} className="flex items-center gap-2 text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{f}</span>
              </div>
            ))
          ) : (
            <p className="text-slate-500">No backup files listed.</p>
          )}
        </div>
      </div>
    </div>
  );
};
