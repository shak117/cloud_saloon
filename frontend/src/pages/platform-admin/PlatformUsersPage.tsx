import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, ShieldCheck, Mail, Phone, Lock } from "lucide-react";
import { apiClient } from "../../api/client";

export const PlatformUsersPage: React.FC = () => {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["superAdminUsers"],
    queryFn: async () => (await apiClient.get("/super-admin/platform-users")).data,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide">
          Platform Governance Administrators
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Cloud Technologies personnel with PLATFORM_SUPER_ADMIN authorization.
        </p>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/70 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Administrator Name</th>
              <th className="py-3 px-3">Work Email</th>
              <th className="py-3 px-3">Contact</th>
              <th className="py-3 px-3">Platform Role</th>
              <th className="py-3 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">Loading administrators...</td>
              </tr>
            ) : (
              users.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-800 border border-amber-400/40 flex items-center justify-center text-amber-400 text-xs font-bold">
                      {u.full_name?.charAt(0) || "A"}
                    </div>
                    {u.full_name}
                  </td>
                  <td className="py-3.5 px-3 text-slate-300 font-mono text-[11px]">{u.email}</td>
                  <td className="py-3.5 px-3 text-slate-400">{u.phone || "N/A"}</td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-700/60">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-700/60">
                      ACTIVE
                    </span>
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
