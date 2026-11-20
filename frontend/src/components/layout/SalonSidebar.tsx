import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  CreditCard,
  Users,
  Sparkles,
  UserCheck,
  Crown,
  Boxes,
  TrendingDown,
  BarChart3,
  Receipt,
  Settings,
  ShieldAlert,
  Scissors,
  Store,
  LogOut,
  RotateCcw,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { apiClient } from "../../api/client";

interface SalonSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const SalonSidebar: React.FC<SalonSidebarProps> = ({ collapsed, onToggle }) => {
  const { tenant, user, logout } = useAuthStore();
  const [resetting, setResetting] = React.useState(false);
  const [resetMsg, setResetMsg] = React.useState<string | null>(null);

  // Exactly the 13 required salon workspace navigation items
  const navItems = [
    { name: "Dashboard", path: "/app", icon: LayoutDashboard },
    { name: "Appointments", path: "/app/appointments", icon: Calendar },
    { name: "POS Billing", path: "/app/pos", icon: CreditCard, highlight: true },
    { name: "Customers", path: "/app/customers", icon: Users },
    { name: "Services", path: "/app/services", icon: Sparkles },
    { name: "Staff & Comm.", path: "/app/staff", icon: UserCheck },
    { name: "Memberships & Pkgs", path: "/app/packages", icon: Crown },
    { name: "Inventory", path: "/app/inventory", icon: Boxes },
    { name: "Expenses", path: "/app/expenses", icon: TrendingDown },
    { name: "Reports", path: "/app/reports", icon: BarChart3 },
    { name: "GST & Tax Settings", path: "/app/tax-settings", icon: Receipt },
    { name: "Salon Settings", path: "/app/settings", icon: Settings },
    { name: "Subscription & Billing", path: "/app/subscription", icon: CreditCard },
  ];

  const handleResetDemo = async () => {
    if (!confirm(`Are you sure you want to reset demo data for ${tenant?.name || "your salon"}? All changes will be refreshed to clean initial records.`)) {
      return;
    }
    setResetting(true);
    setResetMsg(null);
    try {
      await apiClient.post("/settings/demo/reset");
      setResetMsg("Reset successful! Reloading...");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      alert("Demo reset failed: " + (err.response?.data?.detail || err.message));
      setResetting(false);
    }
  };

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen transition-all duration-300 bg-salon-charcoal text-white flex flex-col justify-between border-r border-salon-border-dark ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div>
        {/* Salon Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-salon-border-dark/60 bg-salon-charcoal">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-salon-gold to-salon-rose flex items-center justify-center shrink-0 shadow-md">
              <Scissors className="w-5 h-5 text-salon-charcoal" />
            </div>
            {!collapsed && (
              <div className="leading-tight overflow-hidden">
                <span className="font-serif tracking-wider font-bold text-base text-white truncate block">
                  {tenant?.name || "Cloud Salon"}
                </span>
                <span className="block text-[10px] uppercase font-semibold text-salon-gold tracking-widest truncate">
                  Salon Workspace
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Authenticated Tenant Badge */}
        {!collapsed && tenant && (
          <div className="mx-3 mt-3 px-3 py-2 bg-salon-charcoal-card rounded-lg border border-salon-border-dark flex items-center gap-2">
            <Store className="w-4 h-4 text-salon-gold shrink-0" />
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{tenant.name}</p>
              <p className="text-[10px] text-gray-400 truncate">
                {tenant.city || "Satara"}, {tenant.state || "Maharashtra"}
              </p>
            </div>
            {tenant.is_demo && (
              <span className="ml-auto text-[9px] bg-salon-gold/20 text-salon-gold font-bold px-1.5 py-0.5 rounded border border-salon-gold/30">
                PILOT
              </span>
            )}
          </div>
        )}

        {/* Navigation Items (13 salon routes) */}
        <nav className="p-3 space-y-1 mt-2 overflow-y-auto max-h-[calc(100vh-270px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/app"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 group ${
                    isActive
                      ? "bg-salon-gold text-salon-charcoal font-bold shadow-md"
                      : item.highlight
                      ? "bg-salon-rose/15 text-salon-rose-light hover:bg-salon-rose/25"
                      : "text-gray-300 hover:text-white hover:bg-salon-charcoal-hover"
                  }`
                }
                title={collapsed ? item.name : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${item.highlight ? "text-salon-rose" : ""}`} />
                {!collapsed && <span className="truncate">{item.name}</span>}
                {!collapsed && item.highlight && (
                  <span className="ml-auto text-[9px] bg-salon-rose text-white font-bold px-1.5 py-0.5 rounded-full">
                    POS
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Demo Controls */}
      <div className="p-3 border-t border-salon-border-dark/60 bg-salon-charcoal-card/60">
        {!collapsed && tenant?.is_demo && (
          <button
            onClick={handleResetDemo}
            disabled={resetting}
            className="w-full mb-3 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-medium text-amber-200 bg-amber-950/40 border border-amber-800/50 hover:bg-amber-900/60 transition"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? "animate-spin" : ""}`} />
            {resetting ? "Resetting..." : "Reset Pilot Demo Data"}
          </button>
        )}
        {resetMsg && (
          <p className="text-[11px] text-green-400 text-center mb-2">{resetMsg}</p>
        )}

        {/* User Card & Logout */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-salon-gold/20 border border-salon-gold/40 flex items-center justify-center text-salon-gold font-bold text-xs shrink-0">
              {user?.full_name ? user.full_name.charAt(0) : "S"}
            </div>
            {!collapsed && (
              <div className="overflow-hidden leading-tight">
                <p className="text-xs font-medium text-white truncate">{user?.full_name || "Salon User"}</p>
                <p className="text-[10px] text-gray-400 truncate">{user?.role || "OWNER"}</p>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 text-gray-400 hover:text-rose-400 rounded-md hover:bg-salon-charcoal-hover transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
