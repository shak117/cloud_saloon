import React, { useState } from "react";
import { Outlet, useNavigate, Navigate } from "react-router-dom";
import {
  Menu,
  Bell,
  Search,
  CreditCard,
  Calendar,
  MapPin,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { SalonSidebar } from "./SalonSidebar";
import { useAuthStore } from "../../store/authStore";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../api/client";

export const SalonWorkspaceLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { tenant, user, isAuthenticated, isPlatformAdmin } = useAuthStore();
  const navigate = useNavigate();

  // Route protection: Block unauthenticated users
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Fetch low-stock alert count for notification pill
  const { data: dashboardData } = useQuery({
    queryKey: ["dashboardSummary"],
    queryFn: async () => {
      const res = await apiClient.get("/dashboard/summary?range_type=today");
      return res.data;
    },
    refetchInterval: 15000,
  });

  const lowStockCount = dashboardData?.kpis?.low_stock_count || 0;

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/app/customers?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="min-h-screen bg-salon-ivory flex">
      {/* Salon Sidebar */}
      <SalonSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        {/* Platform Admin Notification Banner if Super Admin views /app */}
        {isPlatformAdmin() && (
          <div className="bg-amber-500 text-slate-950 px-6 py-2 text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              You are signed in as Platform Super Admin viewing the salon workspace experience.
            </span>
            <button
              onClick={() => navigate("/platform-admin/overview")}
              className="px-3 py-1 bg-slate-950 text-white rounded-lg text-[11px] font-bold hover:bg-black transition flex items-center gap-1"
            >
              Back to Platform Admin <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Top Navbar */}
        <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-md border-b border-salon-border flex items-center justify-between px-6 shadow-sm">
          {/* Left section: Toggle & Salon Branding Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg text-salon-charcoal hover:bg-salon-ivory-warm transition"
              title="Toggle Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="font-semibold text-salon-charcoal flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-salon-gold" />
                {tenant?.name || "Cloud Salon Workspace"}
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500">
                {tenant?.city || "Satara"}, {tenant?.state || "Maharashtra"}
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Open ({tenant?.opening_time || "10:00"} - {tenant?.closing_time || "20:00"})
              </span>
            </div>
          </div>

          {/* Center: Quick Search */}
          <form onSubmit={handleGlobalSearch} className="hidden md:flex items-center relative w-72 lg:w-96">
            <Search className="w-4 h-4 text-gray-400 absolute left-3" />
            <input
              type="text"
              placeholder="Search customer by name or mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none focus:border-salon-gold transition"
            />
          </form>

          {/* Right: Quick Action Buttons & Alerts */}
          <div className="flex items-center gap-3">
            {/* Quick Walk-in POS Checkout Button */}
            <button
              onClick={() => navigate("/app/pos")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-salon-charcoal text-white hover:bg-black transition text-xs font-semibold shadow-sm"
              title="Open Fast Walk-in POS"
            >
              <CreditCard className="w-3.5 h-3.5 text-salon-gold" />
              <span>Fast POS</span>
            </button>

            {/* Quick New Appointment Button */}
            <button
              onClick={() => navigate("/app/appointments")}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-salon-gold/15 text-salon-gold-dark hover:bg-salon-gold/25 transition text-xs font-semibold border border-salon-gold/30"
              title="New Appointment"
            >
              <Calendar className="w-3.5 h-3.5 text-salon-gold" />
              <span>+ Booking</span>
            </button>

            {/* Low-stock Notification Icon */}
            <button
              onClick={() => navigate("/app/inventory")}
              className="relative p-2 rounded-lg text-gray-600 hover:bg-salon-ivory-warm transition"
              title={lowStockCount > 0 ? `${lowStockCount} items need reordering` : "No low stock alerts"}
            >
              <Bell className="w-4 h-4" />
              {lowStockCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {lowStockCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Dynamic Page Content Viewport */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
