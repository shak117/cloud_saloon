import React, { useState } from "react";
import { Outlet, Navigate, useNavigate } from "react-router-dom";
import {
  Menu,
  ShieldAlert,
  Server,
  LogOut,
  Plus,
  ExternalLink,
  Layers,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { PlatformAdminSidebar } from "./PlatformAdminSidebar";
import { useAuthStore } from "../../store/authStore";

export const PlatformAdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, isPlatformAdmin, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Route protection: Block non-platform-admins
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!isPlatformAdmin()) {
    return <Navigate to="/app" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <PlatformAdminSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        {/* Top Master Governance Navbar */}
        <header className="sticky top-0 z-20 h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 shadow-xl">
          {/* Left section: Toggle & Governance Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Toggle Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-bold text-xs shadow-md">
                CT
              </div>
              <div className="leading-tight">
                <span className="font-bold text-sm text-white tracking-wide block">
                  Cloud Technologies
                </span>
                <span className="text-[10px] text-amber-400 uppercase font-semibold tracking-wider block">
                  Cloud Salon Platform Governance
                </span>
              </div>
            </div>
          </div>

          {/* Right section: System Health, Add Salon, Profile & Logout */}
          <div className="flex items-center gap-3">
            {/* System Health Chip */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-800/80 rounded-full border border-slate-700/60 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] text-slate-300 font-medium">PostgreSQL Connected</span>
              <span className="text-slate-500">|</span>
              <span className="text-[10px] text-emerald-400 font-bold">Multi-Tenancy Active</span>
            </div>

            {/* Quick Action: Register Salon */}
            <button
              onClick={() => navigate("/platform-admin/add-salon")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-300 transition text-xs font-bold shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add Salon</span>
            </button>

            {/* Admin User Badge */}
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-amber-500/30 flex items-center justify-center text-[11px] font-bold text-amber-400">
                SA
              </div>
              <div className="text-left text-xs leading-none">
                <p className="font-bold text-slate-200">{user?.full_name || "Super Admin"}</p>
                <p className="text-[9px] text-amber-400/80 mt-0.5">PLATFORM ADMIN</p>
              </div>
            </div>

            {/* Sign Out */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
              title="Sign Out of Platform Admin"
            >
              <LogOut className="w-4 h-4" />
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
