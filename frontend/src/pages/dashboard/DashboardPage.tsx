import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  IndianRupee,
  Calendar,
  CheckCircle2,
  Users,
  CreditCard,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Clock,
  Scissors,
  Sparkles,
  ChevronRight,
  Filter,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { apiClient } from "../../api/client";
import { DashboardSummary } from "../../types";

export const DashboardPage: React.FC = () => {
  const [rangeType, setRangeType] = useState<string>("today");
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery<DashboardSummary>({
    queryKey: ["dashboardData", rangeType],
    queryFn: async () => {
      const res = await apiClient.get(`/dashboard/summary?range_type=${rangeType}`);
      return res.data;
    },
    refetchInterval: 20000,
  });

  const { data: upcomingAppts } = useQuery({
    queryKey: ["upcomingAppointments"],
    queryFn: async () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const res = await apiClient.get(`/appointments?appointment_date=${todayStr}`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-salon-gold border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-medium text-gray-500">Loading Cloud Salon Analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
        Failed to load dashboard data. Please check backend connection.
      </div>
    );
  }

  const { kpis, revenue_trends, service_breakdown, staff_performance } = data;

  return (
    <div className="space-y-6">
      {/* Page Header with Time Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-salon-charcoal">
            Executive Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time financial performance, appointments and salon activity.
          </p>
        </div>

        {/* Range Filters */}
        <div className="flex items-center bg-white p-1 rounded-xl border border-salon-border shadow-sm text-xs">
          {[
            { id: "today", label: "Today" },
            { id: "yesterday", label: "Yesterday" },
            { id: "last7days", label: "Last 7 Days" },
            { id: "thismonth", label: "This Month" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRangeType(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                rangeType === tab.id
                  ? "bg-salon-charcoal text-white shadow-sm"
                  : "text-gray-600 hover:text-black hover:bg-salon-ivory"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Primary Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Earned Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-salon-border shadow-luxury relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-salon-gold/15 flex items-center justify-center text-salon-gold-dark">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-salon-charcoal font-sans">
              ₹ {kpis.today_revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
            <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-500">
              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold border border-emerald-200">
                Cash: ₹{kpis.today_cash_collected.toLocaleString("en-IN")}
              </span>
              <span>Digital: ₹{kpis.today_digital_collected.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Operating Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-salon-border shadow-luxury">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Operating Expenses
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-rose-700 font-sans">
              ₹ {kpis.today_expenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
            <p className="mt-2 text-[11px] text-gray-500">
              Rent, bills, salon consumables & supplies
            </p>
          </div>
        </div>

        {/* Estimated Net Profit */}
        <div className="bg-white p-5 rounded-2xl border border-salon-border shadow-luxury">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Estimated Net Profit
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-emerald-800 font-sans">
              ₹ {kpis.net_operating_profit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
            <p className="mt-2 text-[11px] text-gray-500">
              Revenue minus expenses & materials
            </p>
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-white p-5 rounded-2xl border border-salon-border shadow-luxury">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Pending Receivables
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-amber-700 font-sans">
              ₹ {kpis.pending_receivables.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
            <p className="mt-2 text-[11px] text-gray-500">
              Partial / unpaid bills to collect
            </p>
          </div>
        </div>
      </div>

      {/* 4 Operational Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-salon-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-lg font-bold text-salon-charcoal">{kpis.today_appointments}</p>
            <p className="text-[11px] text-gray-500">Total Bookings</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-salon-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-lg font-bold text-salon-charcoal">{kpis.today_completed_services}</p>
            <p className="text-[11px] text-gray-500">Services Completed</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-salon-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-lg font-bold text-salon-charcoal">{kpis.today_walkin_customers}</p>
            <p className="text-[11px] text-gray-500">Walk-in Clients</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-salon-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-lg font-bold text-rose-700">{kpis.low_stock_count}</p>
            <p className="text-[11px] text-gray-500">Low Stock Alerts</p>
          </div>
        </div>
      </div>

      {/* Center Section: Revenue Trend Chart & Upcoming Appointments Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trends Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-salon-border shadow-luxury">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif font-bold text-base text-salon-charcoal">
                Revenue & Collections Trend
              </h2>
              <p className="text-xs text-gray-500">Daily sales vs cash collected across past 7 days</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue_trends}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C5A059" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#C5A059" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#12141A" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#12141A" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#999" fontSize={11} />
                <YAxis stroke="#999" fontSize={11} />
                <Tooltip
                  formatter={(val: any) => [`₹ ${Number(val).toLocaleString("en-IN")}`, ""]}
                  contentStyle={{ backgroundColor: "#12141A", color: "#fff", borderRadius: 8, fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue Earned"
                  stroke="#C5A059"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
                <Area
                  type="monotone"
                  dataKey="cash_collected"
                  name="Collections"
                  stroke="#12141A"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCash)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Schedule Preview (1 col) - Mangomint / Glowboard inspired timeline */}
        <div className="bg-white p-5 rounded-2xl border border-salon-border shadow-luxury flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif font-bold text-base text-salon-charcoal flex items-center gap-2">
                <Clock className="w-4 h-4 text-salon-gold" />
                Today's Schedule
              </h2>
              <button
                onClick={() => navigate("/app/appointments")}
                className="text-xs text-salon-gold-dark hover:underline flex items-center"
              >
                View Grid <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-72 pr-1">
              {upcomingAppts && upcomingAppts.length > 0 ? (
                upcomingAppts.slice(0, 5).map((appt: any) => (
                  <div
                    key={appt.id}
                    className="p-2.5 rounded-xl border border-salon-border bg-salon-ivory/50 flex items-center justify-between hover:bg-salon-ivory transition"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div
                        className="w-2.5 h-9 rounded-full shrink-0"
                        style={{ backgroundColor: appt.staff_color || "#C5A059" }}
                      ></div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold text-salon-charcoal truncate">
                          {appt.customer_name}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate">{appt.service_name}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-bold text-salon-charcoal">
                        {appt.start_time} - {appt.end_time}
                      </span>
                      <span
                        className={`block text-[9px] font-semibold uppercase ${
                          appt.status === "COMPLETED"
                            ? "text-emerald-700"
                            : appt.status === "IN_PROGRESS"
                            ? "text-blue-700"
                            : "text-amber-700"
                        }`}
                      >
                        {appt.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 py-6 text-center">No appointments scheduled for today.</p>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate("/app/pos")}
            className="w-full mt-4 py-2.5 bg-gradient-to-r from-salon-charcoal to-salon-charcoal-card text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow hover:opacity-95 transition"
          >
            <CreditCard className="w-4 h-4 text-salon-gold" />
            Launch POS Cash Register
          </button>
        </div>
      </div>

      {/* Bottom Section: Service Breakdown & Staff Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Revenue Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-salon-border shadow-luxury">
          <h2 className="font-serif font-bold text-base text-salon-charcoal mb-1">
            Top Performing Services
          </h2>
          <p className="text-xs text-gray-500 mb-4">Revenue share by treatments and services</p>

          <div className="space-y-3">
            {service_breakdown.map((s, idx) => (
              <div key={s.service_id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span className="w-5 h-5 rounded-full bg-salon-gold/20 text-salon-gold-dark font-bold flex items-center justify-center text-[10px] shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-salon-charcoal truncate">{s.service_name}</span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-gray-400">{s.service_count} sessions</span>
                  <span className="font-bold text-salon-charcoal">
                    ₹ {s.revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Staff Performance & Commissions */}
        <div className="bg-white p-5 rounded-2xl border border-salon-border shadow-luxury">
          <h2 className="font-serif font-bold text-base text-salon-charcoal mb-1">
            Stylist & Therapist Leaderboard
          </h2>
          <p className="text-xs text-gray-500 mb-4">Completed services, revenue generated and commissions earned</p>

          <div className="space-y-3">
            {staff_performance.map((st) => (
              <div
                key={st.staff_id}
                className="p-2.5 rounded-xl border border-salon-border/60 bg-salon-ivory/30 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-[11px] shrink-0"
                    style={{ backgroundColor: st.color_code }}
                  >
                    {st.staff_name.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-semibold text-salon-charcoal truncate">{st.staff_name}</p>
                    <p className="text-[10px] text-gray-500">{st.designation}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-salon-charcoal">
                    ₹ {st.revenue_generated.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-emerald-700 font-medium">
                    Comm: ₹{st.commission_earned.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
