import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CreditCard,
  Sparkles,
  Check,
  Calendar,
  Building2,
  Users,
  ShieldCheck,
  Phone,
  Mail,
  QrCode,
  ArrowRight,
} from "lucide-react";
import { apiClient } from "../../api/client";
import { useAuthStore } from "../../store/authStore";

export const SalonSubscriptionPage: React.FC = () => {
  const { tenant } = useAuthStore();

  const { data: sub, isLoading } = useQuery({
    queryKey: ["salonSubscriptionDetails"],
    queryFn: async () => (await apiClient.get("/settings/subscription")).data,
  });

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-salon-charcoal flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-salon-gold" />
          Salon Subscription & SaaS Tier
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          View your active Cloud Salon subscription tier, account limits, renewal schedule and Cloud Technologies billing support.
        </p>
      </div>

      {/* Current Plan Overview Card */}
      <div className="bg-white rounded-2xl border border-salon-border shadow-luxury p-7 space-y-6 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-salon-border">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-salon-gold">
              Active Subscription
            </span>
            <h2 className="font-serif text-xl font-bold text-salon-charcoal mt-0.5">
              Plan {sub?.plan_code === "BUSINESS" ? "B – Business" : "A – Professional"}
            </h2>
            <p className="text-xs text-gray-500">
              Workspace: <span className="font-semibold text-salon-charcoal">{tenant?.name || "SK Relax Studio"}</span> (ID: <span className="font-mono">{tenant?.id}</span>)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                sub?.subscription_status === "ACTIVE"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : sub?.subscription_status === "TRIAL"
                  ? "bg-blue-50 text-blue-800 border border-blue-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {sub?.subscription_status === "TRIAL" ? "14-Day Free Trial" : sub?.subscription_status || "ACTIVE"}
            </span>
          </div>
        </div>

        {/* Pricing & Expiration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-salon-ivory p-4 rounded-xl border border-salon-border">
            <span className="text-gray-500 block text-[11px]">Monthly Fee</span>
            <span className="text-2xl font-bold font-sans text-salon-charcoal">
              ₹ {sub?.monthly_price ? Number(sub.monthly_price).toLocaleString("en-IN") : "999"}
            </span>
            <span className="text-gray-500 text-[11px]"> / month</span>
          </div>

          <div className="bg-salon-ivory p-4 rounded-xl border border-salon-border">
            <span className="text-gray-500 block text-[11px]">Access Valid Until</span>
            <span className="text-lg font-bold font-mono text-salon-charcoal">
              {sub?.subscription_end_date
                ? new Date(sub.subscription_end_date).toLocaleDateString("en-IN")
                : "Active"}
            </span>
            <span className="text-emerald-700 block text-[11px] font-medium mt-0.5">
              Account in Good Standing
            </span>
          </div>

          <div className="bg-salon-ivory p-4 rounded-xl border border-salon-border">
            <span className="text-gray-500 block text-[11px]">Account Limits</span>
            <p className="font-semibold text-salon-charcoal mt-1">
              Locations: <span className="font-bold">{sub?.branch_limit || 1} branch</span>
            </p>
            <p className="font-semibold text-salon-charcoal">
              Staff: <span className="font-bold">{sub?.staff_limit >= 100 ? "Unlimited" : `${sub?.staff_limit || 3} accounts`}</span>
            </p>
          </div>
        </div>

        {/* Feature Comparison */}
        <div className="space-y-2 border-t border-salon-border pt-4">
          <h3 className="font-semibold text-gray-700">Included In Your Plan:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              "Fast Walk-in POS Billing",
              "Appointment Scheduling",
              "Customer Directory & Profiles",
              "Service Catalogue & Rates",
              "Staff Commissions Tracking",
              "Thermal 80mm Receipt Printing",
              "Daily & Monthly Sales Reports",
              "Inventory & Stock Ledger",
              "WhatsApp API Notifications",
              ...(sub?.plan_code === "BUSINESS"
                ? ["Prepaid Packages & Sessions", "Multi-Branch Management", "Consumables & Recipes"]
                : []),
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-1.5 text-gray-700">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cloud Technologies Support & Renewal Card */}
      <div className="bg-gradient-to-r from-salon-charcoal via-salon-charcoal-card to-slate-900 rounded-2xl border border-salon-border-dark p-7 shadow-luxury text-white space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-salon-gold" />
          <h3 className="font-serif font-bold text-base text-white">
            Cloud Technologies SaaS Billing & Renewal Support
          </h3>
        </div>
        <p className="text-xs text-gray-300">
          Cloud Salon is an enterprise software product developed, hosted and maintained by Cloud Technologies. For subscription renewals, adding new branches, custom integrations or technical assistance:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
            <span className="text-gray-400 block text-[10px] uppercase font-semibold">Support Helpline</span>
            <p className="font-bold text-salon-gold flex items-center gap-1.5 text-sm">
              <Phone className="w-4 h-4" /> +91 9822000000
            </p>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
            <span className="text-gray-400 block text-[10px] uppercase font-semibold">Billing Inquiries</span>
            <p className="font-mono text-white text-xs flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-salon-gold" /> billing@cloudtechnologies.in
            </p>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
            <span className="text-gray-400 block text-[10px] uppercase font-semibold">Instant UPI Renewal</span>
            <p className="font-mono text-amber-300 text-xs font-bold flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-salon-gold" /> cloudtechnologies@upi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
