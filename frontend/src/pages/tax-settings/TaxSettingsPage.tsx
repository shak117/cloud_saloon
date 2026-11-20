import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Receipt,
  CheckCircle,
  HelpCircle,
  Save,
  ShieldCheck,
  AlertTriangle,
  Info,
} from "lucide-react";
import { apiClient } from "../../api/client";
import { Tenant } from "../../types";

export const TaxSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: tenant, isLoading } = useQuery<Tenant>({
    queryKey: ["tenantProfile"],
    queryFn: async () => (await apiClient.get("/settings/profile")).data,
  });

  const [form, setForm] = useState({
    gst_enabled: false,
    gstin: "",
    gst_rate: 18.0,
    cgst_rate: 9.0,
    sgst_rate: 9.0,
    composition_scheme: false,
    prices_include_tax: true,
  });

  useEffect(() => {
    if (tenant) {
      const taxConfig = tenant.tax_configuration || {};
      setForm({
        gst_enabled: !!taxConfig.gst_enabled,
        gstin: tenant.gstin || "",
        gst_rate: taxConfig.gst_rate !== undefined ? taxConfig.gst_rate : 18.0,
        cgst_rate: taxConfig.cgst_rate !== undefined ? taxConfig.cgst_rate : 9.0,
        sgst_rate: taxConfig.sgst_rate !== undefined ? taxConfig.sgst_rate : 9.0,
        composition_scheme: !!taxConfig.composition_scheme,
        prices_include_tax: taxConfig.prices_include_tax !== undefined ? taxConfig.prices_include_tax : true,
      });
    }
  }, [tenant]);

  const updateMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      const res = await apiClient.put("/settings/profile", {
        gstin: payload.gstin,
        tax_configuration: {
          gst_enabled: payload.gst_enabled,
          gst_rate: payload.gst_rate,
          cgst_rate: payload.cgst_rate,
          sgst_rate: payload.sgst_rate,
          composition_scheme: payload.composition_scheme,
          prices_include_tax: payload.prices_include_tax,
        },
      });
      return res.data;
    },
    onSuccess: () => {
      alert("GST & Tax configuration saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["tenantProfile"] });
    },
    onError: (err: any) => {
      alert("Failed to save tax configuration: " + (err.response?.data?.detail || err.message));
    },
  });

  const handleGstRateChange = (rate: number) => {
    const half = Number((rate / 2).toFixed(2));
    setForm((prev) => ({
      ...prev,
      gst_rate: rate,
      cgst_rate: half,
      sgst_rate: half,
    }));
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-salon-charcoal flex items-center gap-2">
          <Receipt className="w-6 h-6 text-salon-gold" />
          GST & Tax Configuration
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Configure how Goods & Services Tax (GST) is calculated on invoices, printed on receipts, and split between CGST and SGST.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-salon-border shadow-luxury p-7 space-y-6 text-xs">
        {/* Toggle Mode */}
        <div className="p-4 rounded-xl border border-salon-border bg-salon-ivory/50 flex items-center justify-between">
          <div>
            <span className="font-bold text-salon-charcoal text-sm block">
              Enable GST Billing Mode
            </span>
            <p className="text-gray-500 text-[11px] mt-0.5">
              Turn off for simple non-GST billing (small salons, turnover below ₹20L/₹40L threshold). Invoices will display plain totals without tax breakup.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.gst_enabled}
              onChange={(e) => setForm({ ...form, gst_enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-salon-gold"></div>
          </label>
        </div>

        {form.gst_enabled ? (
          <div className="space-y-5 border-t border-salon-border pt-5">
            {/* GSTIN & Composition */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  15-Digit Goods & Services Tax Number (GSTIN) *
                </label>
                <input
                  type="text"
                  maxLength={15}
                  placeholder="27AAAAA0000A1Z5"
                  value={form.gstin}
                  onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none uppercase font-mono font-bold"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="comp_scheme"
                  checked={form.composition_scheme}
                  onChange={(e) => setForm({ ...form, composition_scheme: e.target.checked })}
                  className="rounded text-salon-gold focus:ring-0"
                />
                <label htmlFor="comp_scheme" className="text-gray-700 font-medium cursor-pointer">
                  Registered under GST Composition Scheme (1% or 6% flat rate, no tax collection from clients)
                </label>
              </div>
            </div>

            {/* Default GST Rate Selector */}
            <div className="space-y-2">
              <label className="font-semibold text-gray-700 block">
                Default Salon Service GST Rate
              </label>
              <div className="grid grid-cols-4 gap-3">
                {[0, 5, 12, 18].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => handleGstRateChange(rate)}
                    className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition ${
                      form.gst_rate === rate
                        ? "bg-salon-gold text-salon-charcoal border-salon-gold shadow-sm"
                        : "bg-salon-ivory text-gray-600 border-salon-border hover:bg-salon-ivory-warm"
                    }`}
                  >
                    {rate}% GST
                    <span className="block text-[10px] font-normal text-gray-500">
                      {rate === 18 ? "Standard Salon Rate" : rate === 0 ? "Exempt / Non-GST" : "Reduced"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Split Breakdown */}
            <div className="grid grid-cols-2 gap-4 bg-salon-ivory p-4 rounded-xl border border-salon-border">
              <div>
                <span className="text-gray-500 block text-[11px]">Intra-State Central GST (CGST)</span>
                <span className="text-base font-bold text-salon-charcoal">{form.cgst_rate}%</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[11px]">Intra-State State GST (SGST)</span>
                <span className="text-base font-bold text-salon-charcoal">{form.sgst_rate}%</span>
              </div>
            </div>

            {/* Price Inclusive / Exclusive */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="inclusive_tax"
                checked={form.prices_include_tax}
                onChange={(e) => setForm({ ...form, prices_include_tax: e.target.checked })}
                className="rounded text-salon-gold focus:ring-0"
              />
              <label htmlFor="inclusive_tax" className="text-gray-700 font-medium cursor-pointer">
                Catalogue prices are inclusive of GST (Recommended for B2C walk-in customers: e.g. ₹450 includes ₹381.36 base + ₹68.64 GST)
              </label>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
            <Info className="w-5 h-5 text-amber-700 shrink-0" />
            <div>
              <span className="font-bold">Simple Non-GST Billing Mode Active: </span>
              Invoices will generate clean, consumer-friendly bills with zero tax line items. You can enable official 18% GST billing at any time when your business registers for GSTIN.
            </div>
          </div>
        )}

        {/* HSN / SAC Code Reference Card */}
        <div className="space-y-2 border-t border-salon-border pt-4">
          <h3 className="font-semibold text-gray-700 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-salon-gold" />
            Indian Salon GST HSN / SAC Codes Reference
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-gray-600">
            <div className="p-3 bg-salon-ivory rounded-xl border border-salon-border">
              <p className="font-bold font-mono text-salon-charcoal">SAC 999721</p>
              <p>Hairdressing, haircutting, hair styling and beard grooming services.</p>
            </div>
            <div className="p-3 bg-salon-ivory rounded-xl border border-salon-border">
              <p className="font-bold font-mono text-salon-charcoal">SAC 999722</p>
              <p>Cosmetic treatment, beauty facials, manicure, pedicure & bridal makeup.</p>
            </div>
            <div className="p-3 bg-salon-ivory rounded-xl border border-salon-border">
              <p className="font-bold font-mono text-salon-charcoal">HSN 330510</p>
              <p>Retail hair shampoos, conditioners and hair care preparations.</p>
            </div>
            <div className="p-3 bg-salon-ivory rounded-xl border border-salon-border">
              <p className="font-bold font-mono text-salon-charcoal">HSN 330499</p>
              <p>Retail beauty skin care lotions, masks, serums and cosmetic kits.</p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-salon-border flex justify-end">
          <button
            type="button"
            onClick={() => updateMutation.mutate(form)}
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-salon-gold text-salon-charcoal hover:bg-salon-gold-light transition shadow-md"
          >
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? "Saving..." : "Save Tax Settings"}
          </button>
        </div>
      </div>
    </div>
  );
};
