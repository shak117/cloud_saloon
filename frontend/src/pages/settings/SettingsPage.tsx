import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Settings,
  Store,
  Phone,
  Mail,
  MapPin,
  Clock,
  Printer,
  RotateCcw,
  MessageSquare,
  CheckCircle,
  Save,
  ShieldAlert,
} from "lucide-react";
import { apiClient } from "../../api/client";
import { Tenant } from "../../types";

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [resetting, setResetting] = useState(false);

  const { data: tenant, isLoading } = useQuery<Tenant>({
    queryKey: ["tenantProfile"],
    queryFn: async () => (await apiClient.get("/settings/profile")).data,
  });

  const { data: whatsappData } = useQuery({
    queryKey: ["whatsappTemplates"],
    queryFn: async () => (await apiClient.get("/settings/whatsapp-templates")).data,
  });

  const [form, setForm] = useState<Partial<Tenant>>({});

  React.useEffect(() => {
    if (tenant) {
      setForm(tenant);
    }
  }, [tenant]);

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => (await apiClient.put("/settings/profile", payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenantProfile"] });
      alert("Salon settings updated successfully!");
    },
    onError: (err: any) => alert("Failed to save settings: " + (err.response?.data?.detail || err.message)),
  });

  const handleResetDemo = async () => {
    if (!confirm("Reset pilot demo data for SK Relax Studio? All dummy transactions will be refreshed to clean initial records.")) {
      return;
    }
    setResetting(true);
    try {
      await apiClient.post("/settings/demo/reset");
      alert("SK Relax Studio demo data reset successfully!");
      window.location.reload();
    } catch (err: any) {
      alert("Reset failed: " + (err.response?.data?.detail || err.message));
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-salon-charcoal">
            Salon Configuration & Business Profile
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Store identity, GST parameters, receipt branding and WhatsApp communication.
          </p>
        </div>

        {tenant?.is_demo && (
          <button
            onClick={handleResetDemo}
            disabled={resetting}
            className="flex items-center gap-2 px-4 py-2 bg-rose-900 text-rose-100 rounded-xl text-xs font-semibold hover:bg-rose-950 transition border border-rose-700 shadow-sm"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? "animate-spin" : ""}`} />
            <span>{resetting ? "Resetting Demo..." : "Reset Pilot Demo Data"}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Salon Profile Form (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-salon-border shadow-luxury p-6 space-y-5">
          <div className="pb-3 border-b border-salon-border flex items-center justify-between">
            <h2 className="font-serif font-bold text-base text-salon-charcoal flex items-center gap-2">
              <Store className="w-4 h-4 text-salon-gold" />
              Salon Business Information
            </h2>
            <span className="text-[10px] text-gray-400">Tenant ID: {tenant?.id}</span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate(form);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Salon Display Name *
                </label>
                <input
                  type="text"
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Legal Business Name (For Invoices)
                </label>
                <input
                  type="text"
                  value={form.legal_name || ""}
                  onChange={(e) => setForm({ ...form, legal_name: e.target.value })}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  GSTIN
                </label>
                <input
                  type="text"
                  value={form.gstin || ""}
                  onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Phone / WhatsApp
                </label>
                <input
                  type="tel"
                  value={form.phone || ""}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email || ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                value={form.address || ""}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={form.city || ""}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={form.state || ""}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Pincode
                </label>
                <input
                  type="text"
                  value={form.pincode || ""}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Opening Time
                </label>
                <input
                  type="text"
                  value={form.opening_time || "10:00"}
                  onChange={(e) => setForm({ ...form, opening_time: e.target.value })}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Closing Time
                </label>
                <input
                  type="text"
                  value={form.closing_time || "20:00"}
                  onChange={(e) => setForm({ ...form, closing_time: e.target.value })}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Invoice Prefix
                </label>
                <input
                  type="text"
                  value={form.invoice_prefix || "SKR-"}
                  onChange={(e) => setForm({ ...form, invoice_prefix: e.target.value })}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none uppercase font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Thermal 80mm Receipt Footer Note
              </label>
              <textarea
                rows={2}
                value={form.thermal_footer || ""}
                onChange={(e) => setForm({ ...form, thermal_footer: e.target.value })}
                className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t border-salon-border flex justify-end">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-salon-gold text-salon-charcoal hover:bg-salon-gold-light transition shadow-md"
              >
                <Save className="w-4 h-4" />
                {updateMutation.isPending ? "Saving..." : "Save Business Settings"}
              </button>
            </div>
          </form>
        </div>

        {/* WhatsApp Integration Preview (1 col) */}
        <div className="bg-white rounded-2xl border border-salon-border shadow-luxury p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-salon-border">
              <h3 className="font-serif font-bold text-base text-salon-charcoal flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                WhatsApp Cloud API
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Connected
              </span>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Official Meta WhatsApp Business Cloud API templates configured for automated customer messages.
            </p>

            <div className="space-y-3 mt-4">
              {whatsappData?.templates?.map((t: any) => (
                <div key={t.id} className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs">
                  <span className="font-bold text-emerald-950 block text-[11px] uppercase tracking-wider">
                    {t.name}
                  </span>
                  <p className="text-gray-700 mt-1 text-[11px] leading-relaxed italic bg-white p-2 rounded-lg border border-emerald-100">
                    "{t.sample}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-salon-ivory rounded-xl border border-salon-border text-center text-xs text-gray-500">
            Messages are transmitted through authorized WhatsApp Cloud API channels.
          </div>
        </div>
      </div>
    </div>
  );
};
