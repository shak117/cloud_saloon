import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  CheckCircle,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Lock,
  MapPin,
  Sparkles,
  ArrowLeft,
  Copy,
} from "lucide-react";
import { apiClient } from "../../api/client";

export const AddNewSalonPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    salon_name: "",
    business_type: "HAIR_AND_BEAUTY_SALON",
    owner_name: "",
    owner_email: "",
    owner_phone: "",
    owner_password: "",
    address: "",
    city: "Pune",
    state: "Maharashtra",
    plan_id: "plan-professional",
    is_trial: true,
  });

  const [createdTenant, setCreatedTenant] = useState<any | null>(null);

  const registerMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      const res = await apiClient.post("/super-admin/salons", payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["superAdminSalons"] });
      queryClient.invalidateQueries({ queryKey: ["superAdminMetrics"] });
      setCreatedTenant(data);
    },
    onError: (err: any) => {
      alert("Registration failed: " + (err.response?.data?.detail || err.message));
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard: " + text);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/platform-admin/tenants")}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          title="Back to Tenants"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide flex items-center gap-2">
            <Building2 className="w-6 h-6 text-amber-400" />
            Onboard New Salon Tenant
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Provisions a fresh, isolated PostgreSQL workspace with default main branch and owner credentials.
          </p>
        </div>
      </div>

      {createdTenant ? (
        /* Success Confirmation Card */
        <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-8 space-y-6 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Salon Workspace Successfully Provisioned!
              </h2>
              <p className="text-xs text-emerald-400">
                Independent tenant container created in PostgreSQL database schema 'salon'.
              </p>
            </div>
          </div>

          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-400">Salon Name:</span>
              <span className="font-bold text-white text-sm">{createdTenant.salon_name}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-400">Tenant Slug / ID:</span>
              <span className="font-mono text-amber-400 font-bold">{createdTenant.tenant_id}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-400">Owner Work Email:</span>
              <span className="font-mono text-slate-200">{createdTenant.owner_email}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-400">Subscription Status:</span>
              <span className="font-bold text-emerald-400">{createdTenant.subscription_status}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Access Valid Until:</span>
              <span className="font-mono text-slate-200">
                {new Date(createdTenant.trial_end_date).toLocaleDateString("en-IN")}
              </span>
            </div>
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 space-y-1">
            <p className="font-bold">Salon Owner Login URL:</p>
            <p className="font-mono text-[11px] text-white">https://salon.cloudtechnologiess.in/login</p>
            <p className="text-[11px] text-slate-300">
              The salon owner can now log in using email: <span className="font-mono text-amber-300">{createdTenant.owner_email}</span> and the configured password.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setCreatedTenant(null);
                setForm({
                  salon_name: "",
                  business_type: "HAIR_AND_BEAUTY_SALON",
                  owner_name: "",
                  owner_email: "",
                  owner_phone: "",
                  owner_password: "",
                  address: "",
                  city: "Pune",
                  state: "Maharashtra",
                  plan_id: "plan-professional",
                  is_trial: true,
                });
              }}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
            >
              Onboard Another Salon
            </button>
            <button
              onClick={() => navigate("/platform-admin/tenants")}
              className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition shadow-lg"
            >
              Go to Tenants Directory
            </button>
          </div>
        </div>
      ) : (
        /* 10-Field Form */
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-7 shadow-2xl space-y-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              registerMutation.mutate(form);
            }}
            className="space-y-5 text-xs text-white"
          >
            {/* Section 1: Salon Identity */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-amber-400 border-b border-slate-800 pb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> 1. Salon Identity & Classification
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold block mb-1 text-slate-300">Salon / Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Elegance Studio & Spa"
                    value={form.salon_name}
                    onChange={(e) => setForm({ ...form, salon_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-300">Business Category *</label>
                  <select
                    value={form.business_type}
                    onChange={(e) => setForm({ ...form, business_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="HAIR_AND_BEAUTY_SALON">Hair & Beauty Salon</option>
                    <option value="SPA_AND_WELLNESS">Luxury Spa & Wellness Studio</option>
                    <option value="UNISEX_SALON">Unisex Family Salon</option>
                    <option value="MAKEUP_AND_BRIDAL_STUDIO">Bridal & Makeup Academy</option>
                    <option value="NAIL_AND_SKIN_CLINIC">Nail & Skin Aesthetic Lounge</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Owner Information */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-amber-400 border-b border-slate-800 pb-2 flex items-center gap-2">
                <User className="w-4 h-4" /> 2. Owner & Administrative Credentials
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold block mb-1 text-slate-300">Owner Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patel"
                    value={form.owner_name}
                    onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-300">Owner Work Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="owner@elegancestudio.com"
                    value={form.owner_email}
                    onChange={(e) => setForm({ ...form, owner_email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-300">Owner Mobile (WhatsApp) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 9822XXXXXX"
                    value={form.owner_phone}
                    onChange={(e) => setForm({ ...form, owner_phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-300">Initial Owner Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters (e.g. Owner@2026)"
                  value={form.owner_password}
                  onChange={(e) => setForm({ ...form, owner_password: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Section 3: Physical Location */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-amber-400 border-b border-slate-800 pb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> 3. Salon Location & Address
              </h3>
              <div>
                <label className="font-semibold block mb-1 text-slate-300">Street Address</label>
                <input
                  type="text"
                  placeholder="Shop #4, Phoenix Plaza, MG Road"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold block mb-1 text-slate-300">City / District *</label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-300">State *</label>
                  <input
                    type="text"
                    required
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Subscription Plan & Trial */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-amber-400 border-b border-slate-800 pb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> 4. Subscription Tier & Trial Period
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => setForm({ ...form, plan_id: "plan-professional" })}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    form.plan_id === "plan-professional"
                      ? "bg-amber-500/10 border-amber-400 text-white"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase text-amber-400">Plan A</span>
                  <h4 className="font-bold text-sm text-white">Professional</h4>
                  <p className="text-lg font-bold font-sans text-amber-400 mt-0.5">₹ 999 <span className="text-xs text-slate-400 font-normal">/ month</span></p>
                  <p className="text-[11px] text-slate-400 mt-1">1 branch • 3 staff accounts • POS & Appointments</p>
                </div>

                <div
                  onClick={() => setForm({ ...form, plan_id: "plan-business" })}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    form.plan_id === "plan-business"
                      ? "bg-purple-500/10 border-purple-400 text-white"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase text-purple-400">Plan B</span>
                  <h4 className="font-bold text-sm text-white">Business</h4>
                  <p className="text-lg font-bold font-sans text-purple-400 mt-0.5">₹ 1,799 <span className="text-xs text-slate-400 font-normal">/ month</span></p>
                  <p className="text-[11px] text-slate-400 mt-1">Up to 3 branches • Unlimited staff • Advanced commissions</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="trial_toggle"
                  checked={form.is_trial}
                  onChange={(e) => setForm({ ...form, is_trial: e.target.checked })}
                  className="rounded text-amber-400 focus:ring-0 w-4 h-4"
                />
                <label htmlFor="trial_toggle" className="font-medium text-slate-200 cursor-pointer">
                  Activate with 14-day full feature free trial (no initial payment required)
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/platform-admin/tenants")}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold transition shadow-lg flex items-center gap-2"
              >
                {registerMutation.isPending ? "Provisioning..." : "Provision Salon Workspace"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
