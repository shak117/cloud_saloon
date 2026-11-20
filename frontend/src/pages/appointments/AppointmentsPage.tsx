import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Scissors,
  CreditCard,
  User,
  Phone,
  Search,
} from "lucide-react";
import { apiClient } from "../../api/client";
import { Appointment, Staff, Service } from "../../types";

export const AppointmentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>("ALL");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    service_id: "",
    staff_id: "",
    start_time: "11:00",
    is_walkin: false,
    notes: "",
  });

  // Queries
  const { data: staffList = [] } = useQuery<Staff[]>({
    queryKey: ["staff"],
    queryFn: async () => (await apiClient.get("/staff")).data,
  });

  const { data: servicesList = [] } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: async () => (await apiClient.get("/services")).data,
  });

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["appointments", selectedDate, selectedStaffFilter],
    queryFn: async () => {
      let url = `/appointments?appointment_date=${selectedDate}`;
      if (selectedStaffFilter !== "ALL") {
        url += `&staff_id=${selectedStaffFilter}`;
      }
      return (await apiClient.get(url)).data;
    },
    refetchInterval: 15000,
  });

  // Check conflict on field change
  const handleTimeOrStaffChange = async (staffId: string, startTime: string, serviceId: string) => {
    if (!staffId || !startTime || !serviceId) return;
    const svc = servicesList.find((s) => s.id === serviceId);
    const duration = svc ? svc.duration_minutes : 30;
    
    // Compute end time
    const [h, m] = startTime.split(":").map(Number);
    const totalMin = h * 60 + m + duration;
    const endH = Math.floor(totalMin / 60);
    const endM = totalMin % 60;
    const end_time = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

    try {
      const res = await apiClient.post("/appointments/check-conflict", {
        staff_id: staffId,
        appointment_date: selectedDate,
        start_time: startTime,
        end_time: end_time,
      });
      if (res.data.conflict) {
        setConflictWarning(res.data.message);
      } else {
        setConflictWarning(null);
      }
    } catch {
      setConflictWarning(null);
    }
  };

  // Create Appointment Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => (await apiClient.post("/appointments", payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      setShowModal(false);
      setConflictWarning(null);
      setFormData({
        customer_name: "",
        customer_phone: "",
        service_id: "",
        staff_id: "",
        start_time: "11:00",
        is_walkin: false,
        notes: "",
      });
    },
    onError: (err: any) => {
      alert("Booking failed: " + (err.response?.data?.detail || err.message));
    },
  });

  // Update Status Mutation
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      (await apiClient.put(`/appointments/${id}`, { status })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_name || !formData.service_id || !formData.staff_id) {
      alert("Please fill customer name, service and staff.");
      return;
    }
    createMutation.mutate({
      ...formData,
      appointment_date: selectedDate,
    });
  };

  // Time grid slots: 10:00 AM to 8:00 PM
  const timeSlots = [
    "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"
  ];

  return (
    <div className="space-y-5">
      {/* Top Controls: Date Picker, Staff Filter, Book Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-salon-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-salon-ivory px-3 py-1.5 rounded-xl border border-salon-border">
            <CalendarIcon className="w-4 h-4 text-salon-gold" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-salon-charcoal focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <select
              value={selectedStaffFilter}
              onChange={(e) => setSelectedStaffFilter(e.target.value)}
              className="bg-salon-ivory text-xs px-3 py-1.5 rounded-xl border border-salon-border focus:outline-none font-medium"
            >
              <option value="ALL">All Stylists & Therapists</option>
              {staffList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.designation})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-salon-charcoal text-white rounded-xl text-xs font-semibold hover:bg-black transition shadow-sm"
        >
          <Plus className="w-4 h-4 text-salon-gold" />
          <span>New Appointment / Walk-in</span>
        </button>
      </div>

      {/* Multi-Column Staff Schedule Board (Mangomint / Glowboard Inspired) */}
      <div className="bg-white rounded-2xl border border-salon-border shadow-luxury overflow-hidden">
        <div className="p-4 border-b border-salon-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-serif font-bold text-base text-salon-charcoal">
              Stylist Lanes & Schedule Grid
            </h2>
            <span className="text-xs bg-salon-gold/15 text-salon-gold-dark px-2 py-0.5 rounded-full font-semibold border border-salon-gold/30">
              {appointments.length} Total Bookings
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Booked
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> In Progress
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Completed
            </span>
          </div>
        </div>

        {/* Multi-column Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px] grid grid-cols-6 border-b border-salon-border bg-salon-ivory/50">
            {/* Header: Stylist Columns */}
            <div className="p-3 text-xs font-bold text-gray-500 border-r border-salon-border text-center">
              Time
            </div>
            {staffList
              .filter((st) => selectedStaffFilter === "ALL" || st.id === selectedStaffFilter)
              .slice(0, 5)
              .map((st) => (
                <div
                  key={st.id}
                  className="p-3 text-xs font-bold text-salon-charcoal border-r border-salon-border flex items-center justify-center gap-2"
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: st.color_code }}
                  ></span>
                  <span className="truncate">{st.name}</span>
                </div>
              ))}
          </div>

          {/* Time Rows */}
          <div className="min-w-[800px] divide-y divide-salon-border/60">
            {timeSlots.map((time) => {
              const activeStaff = staffList.filter(
                (st) => selectedStaffFilter === "ALL" || st.id === selectedStaffFilter
              ).slice(0, 5);

              return (
                <div key={time} className="grid grid-cols-6 min-h-[56px] hover:bg-salon-ivory/20 transition">
                  {/* Time label */}
                  <div className="p-2.5 text-[11px] font-semibold text-gray-400 border-r border-salon-border text-center flex items-center justify-center bg-salon-ivory/30">
                    {time}
                  </div>

                  {/* Staff Cells */}
                  {activeStaff.map((st) => {
                    // Check if an appointment starts around this time slot
                    const appt = appointments.find(
                      (a) => a.staff_id === st.id && a.start_time <= time && a.end_time > time
                    );

                    return (
                      <div
                        key={st.id}
                        className="p-1.5 border-r border-salon-border relative flex flex-col justify-center"
                      >
                        {appt ? (
                          <div
                            className={`p-2 rounded-xl text-xs border shadow-sm transition group ${
                              appt.status === "COMPLETED"
                                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                                : appt.status === "IN_PROGRESS"
                                ? "bg-blue-50 border-blue-200 text-blue-900"
                                : "bg-amber-50 border-amber-200 text-amber-900"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold truncate text-[11px]">{appt.customer_name}</span>
                              <span className="text-[9px] font-semibold uppercase">{appt.status}</span>
                            </div>
                            <p className="text-[10px] text-gray-600 truncate mt-0.5">{appt.service_name}</p>
                            <div className="flex items-center justify-between mt-1 pt-1 border-t border-black/5 text-[9px]">
                              <span>{appt.start_time} - {appt.end_time}</span>
                              
                              {/* Quick Action Buttons */}
                              <div className="flex items-center gap-1 opacity-90">
                                {appt.status === "BOOKED" && (
                                  <button
                                    onClick={() => statusMutation.mutate({ id: appt.id, status: "IN_PROGRESS" })}
                                    className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[8px] font-semibold"
                                  >
                                    Start
                                  </button>
                                )}
                                {appt.status === "IN_PROGRESS" && (
                                  <button
                                    onClick={() => statusMutation.mutate({ id: appt.id, status: "COMPLETED" })}
                                    className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[8px] font-semibold"
                                  >
                                    Complete
                                  </button>
                                )}
                                <button
                                  onClick={() => navigate(`/app/pos?appt_id=${appt.id}`)}
                                  className="px-1.5 py-0.5 bg-salon-charcoal text-white rounded text-[8px] font-semibold flex items-center gap-0.5"
                                  title="Bill at POS"
                                >
                                  <CreditCard className="w-2.5 h-2.5 text-salon-gold" />
                                  Bill
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Appointment Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-salon-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-salon-border">
              <h3 className="font-serif font-bold text-lg text-salon-charcoal">
                New Salon Booking / Walk-in
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-black text-xl"
              >
                &times;
              </button>
            </div>

            {conflictWarning && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Staff Double-Booking Detected:</span>
                  <p className="mt-0.5">{conflictWarning}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarti Patil"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none focus:border-salon-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 9822001122"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none focus:border-salon-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Select Service *
                </label>
                <select
                  required
                  value={formData.service_id}
                  onChange={(e) => {
                    const sid = e.target.value;
                    setFormData({ ...formData, service_id: sid });
                    handleTimeOrStaffChange(formData.staff_id, formData.start_time, sid);
                  }}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none focus:border-salon-gold"
                >
                  <option value="">-- Choose a Salon Service --</option>
                  {servicesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.duration_minutes}m) — ₹{s.price}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Assigned Stylist *
                  </label>
                  <select
                    required
                    value={formData.staff_id}
                    onChange={(e) => {
                      const stid = e.target.value;
                      setFormData({ ...formData, staff_id: stid });
                      handleTimeOrStaffChange(stid, formData.start_time, formData.service_id);
                    }}
                    className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none focus:border-salon-gold"
                  >
                    <option value="">-- Choose Staff --</option>
                    {staffList.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.specialization})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <select
                    value={formData.start_time}
                    onChange={(e) => {
                      const t = e.target.value;
                      setFormData({ ...formData, start_time: t });
                      handleTimeOrStaffChange(formData.staff_id, t, formData.service_id);
                    }}
                    className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none focus:border-salon-gold"
                  >
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="walkinCheck"
                  checked={formData.is_walkin}
                  onChange={(e) => setFormData({ ...formData, is_walkin: e.target.checked })}
                  className="rounded text-salon-gold focus:ring-salon-gold"
                />
                <label htmlFor="walkinCheck" className="text-xs text-gray-700 font-medium cursor-pointer">
                  Mark as Direct Walk-in Customer
                </label>
              </div>

              <div className="pt-3 border-t border-salon-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || !!conflictWarning}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-salon-gold text-salon-charcoal hover:bg-salon-gold-light disabled:opacity-50 transition shadow-sm"
                >
                  {createMutation.isPending ? "Confirming..." : "Confirm Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
