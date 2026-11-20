import React from "react";
import { Sliders, Building2, Globe, ShieldCheck, Mail, Phone, Database } from "lucide-react";

export const PlatformSettingsPage: React.FC = () => {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide">
          Platform Governance Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Global SaaS configuration and infrastructure parameters managed by Cloud Technologies.
        </p>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6 shadow-xl text-xs">
        {/* Company & Product */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-amber-400 border-b border-slate-800 pb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Company & SaaS Product Identity
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
            <div>
              <label className="text-slate-400 block mb-1">Company / Platform Owner</label>
              <input
                type="text"
                disabled
                value="Cloud Technologies"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">SaaS Product Name</label>
              <input
                type="text"
                disabled
                value="Cloud Salon"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Production URL Target</label>
              <input
                type="text"
                disabled
                value="https://salon.cloudtechnologiess.in"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-amber-400"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Default Trial Duration</label>
              <input
                type="text"
                disabled
                value="14 Days Full Feature Access"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Financial & Regional Defaults */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-amber-400 border-b border-slate-800 pb-2 flex items-center gap-2">
            <Globe className="w-4 h-4" /> Financial & Regional Parameters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-300">
            <div>
              <label className="text-slate-400 block mb-1">Default Currency</label>
              <input
                type="text"
                disabled
                value="INR (₹ - Indian Rupee)"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Platform Timezone</label>
              <input
                type="text"
                disabled
                value="Asia/Kolkata (+05:30 IST)"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Support Email</label>
              <input
                type="text"
                disabled
                value="support@cloudtechnologies.in"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Database & Infrastructure */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-amber-400 border-b border-slate-800 pb-2 flex items-center gap-2">
            <Database className="w-4 h-4" /> PostgreSQL & Automated Backup Target
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
            <div>
              <label className="text-slate-400 block mb-1">Database Location</label>
              <input
                type="text"
                disabled
                value="localhost:5432 / cloud_billing"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-slate-200"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Backup Storage Directory</label>
              <input
                type="text"
                disabled
                value="C:\CloudSalonBackups"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-emerald-400"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
