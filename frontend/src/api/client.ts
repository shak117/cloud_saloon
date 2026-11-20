import axios from "axios";

export const API_BASE_URL = "/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach JWT token and Tenant ID
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("cloud_salon_token");
  const tenantId = localStorage.getItem("cloud_salon_tenant_id");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (tenantId) {
    config.headers["X-Tenant-ID"] = tenantId;
  }

  return config;
});

// Response interceptor to handle token expiry / refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("cloud_salon_refresh_token");
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const { access_token, refresh_token: newRefresh } = res.data;
          localStorage.setItem("cloud_salon_token", access_token);
          if (newRefresh) {
            localStorage.setItem("cloud_salon_refresh_token", newRefresh);
          }
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return apiClient(originalRequest);
        } catch (refreshErr) {
          // Clear session on failure
          localStorage.removeItem("cloud_salon_token");
          localStorage.removeItem("cloud_salon_refresh_token");
        }
      }
    }
    return Promise.reject(error);
  }
);
