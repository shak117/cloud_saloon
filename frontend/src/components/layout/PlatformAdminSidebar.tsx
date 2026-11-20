import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  CreditCard,
  DollarSign,
  Clock,
  RotateCcw,
  Users,
  Activity,
  FileText,
  Sliders,
  LogOut,
  ShieldCheck,
  Server,
  Layers,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";

interface PlatformAdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const PlatformAdminSidebar: React.FC<PlatformAdminSidebarProps> = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { name: "Platform Overview", path: "/platform-admin/overview", icon: LayoutDashboard },
    { name: "Manage Tenants", path: "/platform-admin/tenants", icon: Building2 },
    { name: "Add New Salon", path: "/platform-admin/add-salon", icon: PlusCircle, highlight: true },
    { name: "Subscription Plans", path: "/platform-admin/plans", icon: CreditCard },
    { name: "Subscriptions & Payments", path: "/platform-admin/subscriptions", icon: DollarSign },
    { name: "Trial Management", path: "/platform-admin/trials", icon: Clock },
    { name: "Renewals & Expiry", path: "/platform-admin/renewals", icon: RotateCcw },
    { name: "Platform Users", path: "/platform-admin/users", icon: Users },
    { name: "System Health", path: "/platform-admin/health", icon: Activity },
    { name: "Audit Logs", path: "/platform-admin/audit-logs", icon: FileText },
    { name: "Platform Settings", path: "/platform-admin/settings", icon: Sliders },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen transition-all duration-300 bg-slate-950 text-white flex flex-col justify-between border-r border-slate-800 shadow-2xl ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div>
        {/* Brand Header - Cloud Technologies ONLY */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 shadow-lg">
              <Layers className="w-5 h-5 text-slate-950" />
            </div>
            {!collapsed && (
              <div className="leading-tight overflow-hidden">
                <span className="font-bold text-sm tracking-wide text-white block">
                  CLOUD SALON
                </span>
                <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-widest block truncate">
                  Platform Admin
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Cloud Technologies Platform Governance Badge */}
        {!collapsed && (
          <div className="mx-3 mt-3 px-3 py-2 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="overflow-hidden">
              <p className="text-[11px] font-bold text-slate-200 truncate">Cloud Technologies</p>
              <p className="text-[9px] text-slate-400">Master Governance</p>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 mt-2 overflow-y-auto max-h-[calc(100vh-190px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-amber-400 text-slate-950 shadow-md font-bold"
                      : item.highlight
                      ? "bg-slate-900 text-amber-300 hover:bg-slate-800 border border-amber-500/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-900/80"
                  }`
                }
                title={collapsed ? item.name : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${item.highlight ? "text-amber-400" : ""}`} />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer / User Profile & Logout */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user?.full_name || "Platform Admin"}</p>
              <p className="text-[10px] text-amber-400 font-mono truncate">{user?.email || "admin@cloudtechnologies.in"}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
            title="Sign Out of Platform Admin"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
