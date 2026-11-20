import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
  IndianRupee,
  Crown,
  ChevronRight,
  Clock,
  Sparkles,
  Heart,
  FileText,
} from "lucide-react";
import { apiClient } from "../../api/client";
import { Customer } from "../../types";

export const CustomersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [search, setSearch] = useState<string>(initialSearch);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    full_name: "",
    mobile: "",
    email: "",
    gender: "Female",
    preferences: "",
    vip_status: false,
  });

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["customers", search],
    queryFn: async () => {
      let url = "/customers?";
      if (search) url += `search=${encodeURIComponent(search)}`;
      return (await apiClient.get(url)).data;
    },
  });

  // Customer Profile Query
  const { data: customerProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["customerProfile", selectedCustomerId],
    queryFn: async () => {
      if (!selectedCustomerId) return null;
      return (await apiClient.get(`/customers/${selectedCustomerId}/profile`)).data;
    },
    enabled: !!selectedCustomerId,
  });

  const addCustomerMutation = useMutation({
    mutationFn: async (payload: any) => (await apiClient.post("/customers", payload)).data,
    onSuccess: (newCust) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setShowAddModal(false);
      setSelectedCustomerId(newCust.id);
      setFormData({
        full_name: "",
        mobile: "",
        email: "",
        gender: "Female",
        preferences: "",
        vip_status: false,
      });
    },
    onError: (err: any) => alert("Failed to add customer: " + (err.response?.data?.detail || err.message)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.mobile) {
      alert("Name and mobile are required.");
      return;
    }
    addCustomerMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-salon-charcoal">
            Customer Relationship Management (CRM)
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Client history, preferences, loyalty packages and visit tracking.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-salon-charcoal text-white rounded-xl text-xs font-semibold hover:bg-black transition shadow-sm"
        >
          <Plus className="w-4 h-4 text-salon-gold" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Main Grid: Customer List (Left) & Customer Detail Profile (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Customer List (2 Cols on lg) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-3 rounded-2xl border border-salon-border shadow-sm flex items-center relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-4" />
            <input
              type="text"
              placeholder="Search by client name, mobile or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-salon-ivory text-xs rounded-xl border border-salon-border focus:outline-none focus:border-salon-gold"
            />
          </div>

          <div className="bg-white rounded-2xl border border-salon-border shadow-luxury overflow-hidden">
            <div className="p-3.5 border-b border-salon-border flex items-center justify-between text-xs text-gray-500 font-semibold">
              <span>Client ({customers.length})</span>
              <span>Visits / Spend</span>
            </div>

            <div className="divide-y divide-salon-border">
              {customers.map((cust) => (
                <div
                  key={cust.id}
                  onClick={() => setSelectedCustomerId(cust.id)}
                  className={`p-4 flex items-center justify-between cursor-pointer transition ${
                    selectedCustomerId === cust.id
                      ? "bg-salon-gold/10 border-l-4 border-salon-gold"
                      : "hover:bg-salon-ivory/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-salon-gold/20 text-salon-gold-dark flex items-center justify-center font-bold text-sm shrink-0">
                      {cust.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-salon-charcoal">
                          {cust.full_name}
                        </span>
                        {cust.vip_status && (
                          <span className="flex items-center gap-0.5 text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded border border-amber-300">
                            <Crown className="w-2.5 h-2.5 text-amber-600" /> VIP
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" /> {cust.mobile}
                        </span>
                        {cust.email && (
                          <span className="hidden sm:flex items-center gap-1 text-gray-400">
                            <Mail className="w-3 h-3" /> {cust.email}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-sm text-salon-charcoal font-sans">
                      ₹ {cust.total_spend.toLocaleString("en-IN")}
                    </span>
                    <span className="block text-[11px] text-gray-500">
                      {cust.total_visits} visits
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Selected Customer Profile Card (1 Col) */}
        <div className="bg-white rounded-2xl border border-salon-border shadow-luxury p-5 flex flex-col justify-between">
          {selectedCustomerId && customerProfile ? (
            <div className="space-y-4">
              <div className="text-center pb-4 border-b border-salon-border">
                <div className="w-16 h-16 rounded-full bg-salon-charcoal text-salon-gold mx-auto flex items-center justify-center text-xl font-bold font-serif mb-2 shadow-md">
                  {customerProfile.customer.full_name.charAt(0)}
                </div>
                <h3 className="font-serif font-bold text-lg text-salon-charcoal">
                  {customerProfile.customer.full_name}
                </h3>
                <p className="text-xs text-gray-500">{customerProfile.customer.mobile}</p>
                {customerProfile.customer.preferences && (
                  <div className="mt-2 text-xs bg-salon-ivory p-2 rounded-xl border border-salon-border text-gray-700 flex items-center gap-2 text-left">
                    <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="text-[11px]">{customerProfile.customer.preferences}</span>
                  </div>
                )}
              </div>

              {/* Stats overview */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-salon-ivory p-2.5 rounded-xl border border-salon-border">
                  <span className="block font-bold text-salon-charcoal text-sm">
                    ₹ {customerProfile.customer.total_spend.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-gray-500">Lifetime Spend</span>
                </div>
                <div className="bg-salon-ivory p-2.5 rounded-xl border border-salon-border">
                  <span className="block font-bold text-salon-charcoal text-sm">
                    {customerProfile.customer.total_visits}
                  </span>
                  <span className="text-[10px] text-gray-500">Completed Visits</span>
                </div>
              </div>

              {/* Active Packages */}
              <div>
                <h4 className="text-xs font-bold text-salon-charcoal uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-salon-gold" /> Active Packages
                </h4>
                {customerProfile.active_packages.length > 0 ? (
                  <div className="space-y-1.5">
                    {customerProfile.active_packages.map((pkg: any) => (
                      <div key={pkg.id} className="p-2 bg-amber-50/60 rounded-xl border border-amber-200 text-xs">
                        <div className="flex justify-between font-semibold text-amber-900">
                          <span>{pkg.package_name}</span>
                          <span>{pkg.remaining_sessions} left</span>
                        </div>
                        <p className="text-[10px] text-amber-700 mt-0.5">
                          Expires: {pkg.expiry_date}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No active package passes.</p>
                )}
              </div>

              {/* Recent Bills */}
              <div>
                <h4 className="text-xs font-bold text-salon-charcoal uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-salon-gold" /> Recent Invoices
                </h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {customerProfile.invoices.slice(0, 4).map((inv: any) => (
                    <div key={inv.id} className="p-2 rounded-xl bg-salon-ivory border border-salon-border text-xs flex justify-between">
                      <div>
                        <span className="font-semibold text-salon-charcoal">{inv.invoice_number}</span>
                        <span className="block text-[10px] text-gray-400">{inv.date.split("T")[0]}</span>
                      </div>
                      <span className="font-bold text-salon-charcoal">₹ {inv.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400 text-xs">
              Select a customer on the left to inspect their complete visit history, packages and profile.
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-salon-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-salon-border">
              <h3 className="font-serif font-bold text-lg text-salon-charcoal">
                Register New Customer
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 text-xl">
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priyanka Bhosale"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 9822334455"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="client@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Preferences / Hair & Skin Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Prefers organic creams, scalp sensitivity..."
                  value={formData.preferences}
                  onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="vipCheckbox"
                  checked={formData.vip_status}
                  onChange={(e) => setFormData({ ...formData, vip_status: e.target.checked })}
                  className="rounded text-salon-gold focus:ring-salon-gold"
                />
                <label htmlFor="vipCheckbox" className="text-xs text-gray-700 font-medium cursor-pointer">
                  Mark as VIP Customer
                </label>
              </div>

              <div className="pt-3 border-t border-salon-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addCustomerMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-salon-gold text-salon-charcoal hover:bg-salon-gold-light transition shadow-sm"
                >
                  {addCustomerMutation.isPending ? "Registering..." : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
