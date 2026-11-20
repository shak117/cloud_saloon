import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scissors, ShieldAlert, Store, Lock, Mail, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { apiClient } from "../../api/client";
import { useAuthStore } from "../../store/authStore";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await apiClient.post("/auth/login", {
        email: email.trim(),
        password: password
      });

      const { access_token, refresh_token, user } = res.data;

      // If user has a tenant, fetch their tenant profile
      let tenantData = null;
      if (user.tenant_id) {
        try {
          const tenantRes = await apiClient.get("/settings/profile", {
            headers: {
              Authorization: `Bearer ${access_token}`,
              "X-Tenant-ID": user.tenant_id
            }
          });
          tenantData = tenantRes.data;
        } catch {
          // If profile fetch fails, proceed with basic user info
        }
      }

      setAuth(user, access_token, refresh_token, tenantData);

      // Route Redirection based on role
      if (user.role === "PLATFORM_SUPER_ADMIN" || user.role === "SUPER_ADMIN") {
        navigate("/platform-admin");
      } else {
        navigate("/app");
      }
    } catch (err: any) {
      const serverDetail = err.response?.data?.detail;
      if (serverDetail) {
        setErrorMsg(serverDetail);
      } else if (err.message && err.message.toLowerCase().includes("network")) {
        setErrorMsg("Unable to connect to the backend server. Please verify the API is running.");
      } else if (err.response?.status === 502 || err.response?.status === 503 || err.response?.status === 504) {
        setErrorMsg("Backend server is not responding. Please ensure FastAPI is running on port 8001 or 8000.");
      } else {
        setErrorMsg("Invalid login credentials. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fillQuickLogin = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-salon-charcoal flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-salon-gold/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-salon-rose/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md space-y-6 z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-salon-gold to-salon-rose text-salon-charcoal shadow-xl mb-1">
            <Scissors className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-white tracking-wider">
            CLOUD SALON
          </h1>
          <p className="text-xs text-gray-400 font-sans tracking-wide">
            Enterprise Multi-Tenant Salon SaaS by <span className="text-salon-gold font-semibold">Cloud Technologies</span>
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-salon-charcoal-card border border-salon-border-dark p-7 rounded-2xl shadow-2xl space-y-5">
          <div>
            <h2 className="text-base font-bold text-white">Sign In to Your Workspace</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Enter your credentials to access your tenant dashboard or platform administration.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@salon.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-salon-charcoal text-white rounded-xl border border-salon-border-dark focus:outline-none focus:border-salon-gold text-xs transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-salon-charcoal text-white rounded-xl border border-salon-border-dark focus:outline-none focus:border-salon-gold text-xs transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-salon-gold to-salon-rose text-salon-charcoal font-bold text-xs shadow-lg hover:brightness-110 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                "Authenticating..."
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Personas */}
          <div className="pt-4 border-t border-salon-border-dark/60 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block text-center">
              Quick Test Personas
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillQuickLogin("admin@cloudtechnologies.in", "CloudAdmin@2026")}
                className="p-2.5 rounded-xl bg-salon-charcoal hover:bg-black/40 border border-salon-border-dark text-left transition space-y-0.5 group"
              >
                <div className="flex items-center gap-1.5 font-bold text-amber-300 text-[11px]">
                  <ShieldAlert className="w-3.5 h-3.5 text-salon-gold" />
                  Super Admin
                </div>
                <p className="text-[10px] text-gray-400 truncate">Cloud Technologies</p>
                <p className="text-[9px] text-gray-500">→ /platform-admin</p>
              </button>

              <button
                type="button"
                onClick={() => fillQuickLogin("salma@skrelax.com", "Salma@2026")}
                className="p-2.5 rounded-xl bg-salon-charcoal hover:bg-black/40 border border-salon-border-dark text-left transition space-y-0.5 group"
              >
                <div className="flex items-center gap-1.5 font-bold text-emerald-300 text-[11px]">
                  <Store className="w-3.5 h-3.5 text-emerald-400" />
                  Salon Owner
                </div>
                <p className="text-[10px] text-gray-400 truncate">SK Relax Studio (Tenant 1)</p>
                <p className="text-[9px] text-gray-500">→ /app</p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-gray-500">
          Cloud Salon SaaS © 2026 Cloud Technologies. All rights reserved.
        </p>
      </div>
    </div>
  );
};
