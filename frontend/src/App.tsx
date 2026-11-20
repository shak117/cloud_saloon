import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";

// Universal Login
import { LoginPage } from "./pages/auth/LoginPage";

// Platform Administration Experience (Cloud Technologies Master Governance)
import { PlatformAdminLayout } from "./components/layout/PlatformAdminLayout";
import { PlatformOverviewPage } from "./pages/platform-admin/PlatformOverviewPage";
import { ManageTenantsPage } from "./pages/platform-admin/ManageTenantsPage";
import { AddNewSalonPage } from "./pages/platform-admin/AddNewSalonPage";
import { SubscriptionPlansPage } from "./pages/platform-admin/SubscriptionPlansPage";
import { SubscriptionsPaymentsPage } from "./pages/platform-admin/SubscriptionsPaymentsPage";
import { TrialManagementPage } from "./pages/platform-admin/TrialManagementPage";
import { RenewalsExpiryPage } from "./pages/platform-admin/RenewalsExpiryPage";
import { PlatformUsersPage } from "./pages/platform-admin/PlatformUsersPage";
import { SystemHealthPage } from "./pages/platform-admin/SystemHealthPage";
import { AuditLogsPage } from "./pages/platform-admin/AuditLogsPage";
import { PlatformSettingsPage } from "./pages/platform-admin/PlatformSettingsPage";

// Salon Workspace Experience (Dedicated Tenant Workspace)
import { SalonWorkspaceLayout } from "./components/layout/SalonWorkspaceLayout";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { AppointmentsPage } from "./pages/appointments/AppointmentsPage";
import { POSPage } from "./pages/pos/POSPage";
import { CustomersPage } from "./pages/customers/CustomersPage";
import { ServicesPage } from "./pages/services/ServicesPage";
import { StaffPage } from "./pages/staff/StaffPage";
import { PackagesPage } from "./pages/packages/PackagesPage";
import { InventoryPage } from "./pages/inventory/InventoryPage";
import { ExpensesPage } from "./pages/expenses/ExpensesPage";
import { ReportsPage } from "./pages/reports/ReportsPage";
import { TaxSettingsPage } from "./pages/tax-settings/TaxSettingsPage";
import { SettingsPage } from "./pages/settings/SettingsPage";
import { SalonSubscriptionPage } from "./pages/subscription/SalonSubscriptionPage";

// Smart root redirect based on authentication and role
const RootRedirect: React.FC = () => {
  const { isAuthenticated, isPlatformAdmin } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (isPlatformAdmin()) {
    return <Navigate to="/platform-admin/overview" replace />;
  }
  return <Navigate to="/app" replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Universal Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Root Redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* EXPERIENCE 1: Platform Administration (Cloud Technologies Super Admin) */}
        <Route path="/platform-admin" element={<PlatformAdminLayout />}>
          <Route index element={<Navigate to="/platform-admin/overview" replace />} />
          <Route path="overview" element={<PlatformOverviewPage />} />
          <Route path="tenants" element={<ManageTenantsPage />} />
          <Route path="add-salon" element={<AddNewSalonPage />} />
          <Route path="plans" element={<SubscriptionPlansPage />} />
          <Route path="subscriptions" element={<SubscriptionsPaymentsPage />} />
          <Route path="trials" element={<TrialManagementPage />} />
          <Route path="renewals" element={<RenewalsExpiryPage />} />
          <Route path="users" element={<PlatformUsersPage />} />
          <Route path="health" element={<SystemHealthPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="settings" element={<PlatformSettingsPage />} />
        </Route>

        {/* EXPERIENCE 2: Salon Workspace (Authenticated Salon Tenant) */}
        <Route path="/app" element={<SalonWorkspaceLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="pos" element={<POSPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="packages" element={<PackagesPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="tax-settings" element={<TaxSettingsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="subscription" element={<SalonSubscriptionPage />} />
        </Route>

        {/* Backward Compatibility Redirects */}
        <Route path="/dashboard" element={<Navigate to="/app" replace />} />
        <Route path="/appointments" element={<Navigate to="/app/appointments" replace />} />
        <Route path="/pos" element={<Navigate to="/app/pos" replace />} />
        <Route path="/customers" element={<Navigate to="/app/customers" replace />} />
        <Route path="/services" element={<Navigate to="/app/services" replace />} />
        <Route path="/staff" element={<Navigate to="/app/staff" replace />} />
        <Route path="/packages" element={<Navigate to="/app/packages" replace />} />
        <Route path="/inventory" element={<Navigate to="/app/inventory" replace />} />
        <Route path="/expenses" element={<Navigate to="/app/expenses" replace />} />
        <Route path="/reports" element={<Navigate to="/app/reports" replace />} />
        <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
        <Route path="/super-admin" element={<Navigate to="/platform-admin/overview" replace />} />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
