import { create } from "zustand";
import { User, Tenant } from "../types";

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string, refreshToken?: string, tenant?: Tenant) => void;
  setTenant: (tenant: Tenant) => void;
  logout: () => void;
  isPlatformAdmin: () => boolean;
}

// Safely retrieve cached user / tenant
const getCachedUser = (): User | null => {
  try {
    const raw = localStorage.getItem("cloud_salon_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getCachedTenant = (): Tenant | null => {
  try {
    const raw = localStorage.getItem("cloud_salon_tenant");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialToken = localStorage.getItem("cloud_salon_token");
const initialUser = getCachedUser();
const initialTenant = getCachedTenant();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialUser,
  tenant: initialTenant,
  token: initialToken,
  isAuthenticated: !!initialToken && !!initialUser,

  setAuth: (user, token, refreshToken, tenant) => {
    localStorage.setItem("cloud_salon_token", token);
    localStorage.setItem("cloud_salon_user", JSON.stringify(user));
    if (refreshToken) {
      localStorage.setItem("cloud_salon_refresh_token", refreshToken);
    }
    if (tenant) {
      localStorage.setItem("cloud_salon_tenant", JSON.stringify(tenant));
      localStorage.setItem("cloud_salon_tenant_id", tenant.id);
    } else if (user.tenant_id) {
      localStorage.setItem("cloud_salon_tenant_id", user.tenant_id);
    } else {
      localStorage.removeItem("cloud_salon_tenant");
      localStorage.removeItem("cloud_salon_tenant_id");
    }
    set({
      user,
      token,
      tenant: tenant || null,
      isAuthenticated: true
    });
  },

  setTenant: (tenant) => {
    localStorage.setItem("cloud_salon_tenant", JSON.stringify(tenant));
    localStorage.setItem("cloud_salon_tenant_id", tenant.id);
    set({ tenant });
  },

  logout: () => {
    localStorage.removeItem("cloud_salon_token");
    localStorage.removeItem("cloud_salon_refresh_token");
    localStorage.removeItem("cloud_salon_user");
    localStorage.removeItem("cloud_salon_tenant");
    localStorage.removeItem("cloud_salon_tenant_id");
    set({ user: null, tenant: null, token: null, isAuthenticated: false });
  },

  isPlatformAdmin: () => {
    const role = get().user?.role;
    return role === "PLATFORM_SUPER_ADMIN" || role === "SUPER_ADMIN";
  }
}));
