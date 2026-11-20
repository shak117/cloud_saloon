import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UserCheck,
  Plus,
  Phone,
  Mail,
  Clock,
  IndianRupee,
  BadgePercent,
  CheckCircle2,
  Calendar,
  Sparkles,
  Award,
} from "lucide-react";
import { apiClient } from "../../api/client";
import { Staff } from "../../types";

export const StaffPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    designation: "Stylist",
    specialization: "All Services",
    color_code: "#C5A059",
    commission_type: "PERCENTAGE",
    commission_rate: 10.0,
    working_hours_start: "10:00",
    working_hours_end: "20:00",
  });

  const { data: staffList = [], isLoading } = useQuery<Staff[]>({
    queryKey: ["staff"],
    queryFn: async () => (await apiClient.get("/staff")).data,
  });

  const { data: staffCommissions } = useQuery({
    queryKey: ["staffCommissions", selectedStaffId],
    queryFn: async () => {
      if (!selectedStaffId) return null;
      return (await apiClient.get(`/staff/${selectedStaffId}/commissions`)).data;
    },
    enabled: !!selectedStaffId,
  });

  const addStaffMutation = useMutation({
    mutationFn: async (payload: any) => (await apiClient.post("/staff", payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      setShowAddModal(false);
      setFormData({
        name: "",
        mobile: "",
        email: "",
        designation: "Stylist",
        specialization: "All Services",
        color_code: "#C5A059",
        commission_type: "PERCENTAGE",
        commission_rate: 10.0,
        working_hours_start: "10:00",
        working_hours_end: "20:00",
      });
    },
    onError: (err: any) => alert("Failed to add staff: " + (err.response?.data?.detail || err.message)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile) {
      alert("Name and mobile are required.");
      return;
    }
    addStaffMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-salon-charcoal">
            Staff & Commission Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Team roster, shift schedules, commission rates and earnings ledger.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-salon-charcoal text-white rounded-xl text-xs font-semibold hover:bg-black transition shadow-sm"
        >
          <Plus className="w-4 h-4 text-salon-gold" />
          <span>Add Team Member</span>
        </button>
      </div>

      {/* Grid: Staff Cards & Detailed Commission Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Staff Roster (2 Cols) */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {staffList.map((st) => (
            <div
              key={st.id}
              onClick={() => setSelectedStaffId(st.id)}
              className={`bg-white p-5 rounded-2xl border transition shadow-luxury cursor-pointer flex flex-col justify-between ${
                selectedStaffId === st.id
                  ? "border-salon-gold ring-2 ring-salon-gold/20"
                  : "border-salon-border hover:border-salon-gold/40"
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-sm"
                      style={{ backgroundColor: st.color_code }}
                    >
                      {st.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-salon-charcoal">{st.name}</h3>
                      <p className="text-[11px] text-gray-500">{st.designation}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Active
                  </span>
                </div>

                <div className="mt-4 space-y-1 text-xs text-gray-600">
                  <p className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-salon-gold" />
                    <span>Specialization: {st.specialization}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{st.mobile}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>{st.working_hours_start} - {st.working_hours_end}</span>
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-salon-border flex items-center justify-between text-xs">
                <span className="text-gray-500">Commission Rule:</span>
                <span className="font-bold text-salon-charcoal bg-salon-ivory px-2 py-0.5 rounded-md border border-salon-border">
                  {st.commission_type === "PERCENTAGE"
                    ? `${st.commission_rate}% of Service`
                    : st.commission_type === "FIXED"
                    ? `₹${st.commission_rate} per Service`
                    : "No Commission"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Commission & Performance Ledger Drawer */}
        <div className="bg-white rounded-2xl border border-salon-border shadow-luxury p-5 flex flex-col justify-between">
          {selectedStaffId && staffCommissions ? (
            <div className="space-y-4">
              <div className="text-center pb-3 border-b border-salon-border">
                <div
                  className="w-12 h-12 rounded-full mx-auto flex items-center justify-center font-bold text-white text-base mb-2 shadow"
                  style={{ backgroundColor: staffCommissions.staff.color_code }}
                >
                  {staffCommissions.staff.name.charAt(0)}
                </div>
                <h3 className="font-serif font-bold text-base text-salon-charcoal">
                  {staffCommissions.staff.name}
                </h3>
                <p className="text-xs text-gray-500">{staffCommissions.staff.designation}</p>
              </div>

              {/* Commission Cards */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  <span className="block font-bold text-amber-900 text-sm">
                    ₹ {staffCommissions.total_unpaid_commission.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-amber-700">Pending Commission</span>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  <span className="block font-bold text-emerald-900 text-sm">
                    ₹ {staffCommissions.total_paid_commission.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-emerald-700">Settled Commission</span>
                </div>
              </div>

              {/* Commission Line Items */}
              <div>
                <h4 className="text-xs font-bold text-salon-charcoal uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-salon-gold" /> Service Commission Ledger
                </h4>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {staffCommissions.records.length > 0 ? (
                    staffCommissions.records.map((r: any) => (
                      <div
                        key={r.id}
                        className="p-2 rounded-xl bg-salon-ivory border border-salon-border text-xs flex justify-between items-center"
                      >
                        <div>
                          <span className="font-semibold text-salon-charcoal">Service ₹{r.service_amount}</span>
                          <span className="block text-[10px] text-gray-400">{r.date.split("T")[0]}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-emerald-700">+₹{r.commission_amount}</span>
                          <span className="block text-[9px] text-gray-400">({r.commission_rate}%)</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 py-4 text-center">No commission records logged yet.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400 text-xs">
              Select a stylist on the left to inspect commission earnings and performance ledger.
            </div>
          )}
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-salon-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-salon-border">
              <h3 className="font-serif font-bold text-lg text-salon-charcoal">
                Add Team Member
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 text-xl">
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Employee Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pooja Shinde"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Mobile *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 9822101011"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    placeholder="Senior Hair Stylist"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Specialization
                </label>
                <input
                  type="text"
                  placeholder="Haircuts, Keratin, Nanoplastia"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Commission Type
                  </label>
                  <select
                    value={formData.commission_type}
                    onChange={(e) => setFormData({ ...formData, commission_type: e.target.value })}
                    className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed (₹)</option>
                    <option value="NONE">No Commission</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Rate (% or ₹)
                  </label>
                  <input
                    type="number"
                    value={formData.commission_rate}
                    onChange={(e) => setFormData({ ...formData, commission_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Working Hours
                  </label>
                  <input
                    type="text"
                    value={formData.working_hours_start}
                    onChange={(e) => setFormData({ ...formData, working_hours_start: e.target.value })}
                    className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Badge Color
                  </label>
                  <input
                    type="color"
                    value={formData.color_code}
                    onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
                    className="w-full h-9 bg-salon-ivory rounded-lg border border-salon-border p-1"
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
                  disabled={addStaffMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-salon-gold text-salon-charcoal hover:bg-salon-gold-light transition shadow-sm"
                >
                  {addStaffMutation.isPending ? "Adding..." : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
