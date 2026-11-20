import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  Plus,
  Scissors,
  Clock,
  IndianRupee,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  Edit2,
} from "lucide-react";
import { apiClient } from "../../api/client";
import { Service, ServiceCategory } from "../../types";

export const ServicesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    category_id: "",
    name: "",
    description: "",
    price: 500,
    duration_minutes: 30,
    sac_code: "999721",
    gst_rate: 18.0,
  });

  const { data: categories = [] } = useQuery<ServiceCategory[]>({
    queryKey: ["serviceCategories"],
    queryFn: async () => (await apiClient.get("/services/categories")).data,
  });

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["services", selectedCategory, search],
    queryFn: async () => {
      let url = "/services?";
      if (selectedCategory !== "ALL") url += `category_id=${selectedCategory}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      return (await apiClient.get(url)).data;
    },
  });

  const addServiceMutation = useMutation({
    mutationFn: async (payload: any) => (await apiClient.post("/services", payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setShowAddModal(false);
      setFormData({
        category_id: "",
        name: "",
        description: "",
        price: 500,
        duration_minutes: 30,
        sac_code: "999721",
        gst_rate: 18.0,
      });
    },
    onError: (err: any) => alert("Failed to add service: " + (err.response?.data?.detail || err.message)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category_id || !formData.name) {
      alert("Please fill category and service name.");
      return;
    }
    addServiceMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-salon-charcoal">
            Salon Services Catalog
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage treatments, durations, GST rates and pricing.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-salon-charcoal text-white rounded-xl text-xs font-semibold hover:bg-black transition shadow-sm"
        >
          <Plus className="w-4 h-4 text-salon-gold" />
          <span>Add New Service</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-salon-border shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              selectedCategory === "ALL"
                ? "bg-salon-charcoal text-white shadow-sm"
                : "bg-salon-ivory text-gray-600 hover:text-black"
            }`}
          >
            All Services
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? "bg-salon-gold text-salon-charcoal shadow-sm"
                  : "bg-salon-ivory text-gray-600 hover:text-black"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search treatments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-salon-ivory text-xs rounded-xl border border-salon-border focus:outline-none focus:border-salon-gold"
          />
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((svc) => (
          <div
            key={svc.id}
            className="bg-white p-5 rounded-2xl border border-salon-border shadow-luxury hover:border-salon-gold/50 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-salon-gold/15 text-salon-gold-dark border border-salon-gold/30">
                  {svc.category_name || "Salon Treatment"}
                </span>
                <span className="text-[10px] text-gray-400">SAC: {svc.sac_code}</span>
              </div>

              <h3 className="font-serif font-bold text-base text-salon-charcoal mt-2">
                {svc.name}
              </h3>
              {svc.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{svc.description}</p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-salon-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-gray-600">
                <Clock className="w-3.5 h-3.5 text-salon-gold" />
                <span>{svc.duration_minutes} mins</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-salon-charcoal font-sans">
                  ₹ {svc.price.toLocaleString("en-IN")}
                </span>
                <span className="block text-[10px] text-gray-400">GST: {svc.gst_rate}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-salon-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-salon-border">
              <h3 className="font-serif font-bold text-lg text-salon-charcoal">
                Add New Salon Service
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 text-xl">
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  required
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                >
                  <option value="">-- Choose Category --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Keratin Smoothing Treatment"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Duration (Minutes) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    SAC Code
                  </label>
                  <input
                    type="text"
                    value={formData.sac_code}
                    onChange={(e) => setFormData({ ...formData, sac_code: e.target.value })}
                    className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    GST Rate (%)
                  </label>
                  <input
                    type="number"
                    value={formData.gst_rate}
                    onChange={(e) => setFormData({ ...formData, gst_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                  />
                </div>
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
                  disabled={addServiceMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-salon-gold text-salon-charcoal hover:bg-salon-gold-light transition shadow-sm"
                >
                  {addServiceMutation.isPending ? "Saving..." : "Save Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
