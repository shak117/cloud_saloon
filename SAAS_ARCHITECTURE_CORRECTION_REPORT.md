# Cloud Salon – SaaS Architecture & Frontend Correction Report
**Vendor & Platform Owner:** Cloud Technologies  
**Product:** Cloud Salon (Enterprise Multi-Tenant Salon Management & Billing SaaS)  
**Production URL:** `https://salon.cloudtechnologiess.in`  
**Date:** November 16, 2026  
**Status:** Completed & Production Ready  

---

## 1. Executive Summary & Root Cause Analysis

### The Problem
In earlier iterations of the codebase, platform administration concepts were mingled with the first pilot customer's business workspace:
- SK Relax Studio (Satara) was mistakenly treated as synonymous with the software product.
- Super Admin navigation was visible inside the salon workspace, creating severe brand confusion and data security risks.
- Default authentication state in Zustand hardcoded "Salma Attar" and "SK Relax Studio".
- The HTTP API client injected a fallback `X-Tenant-ID: "sk-relax-satara"` on platform administrative requests.

### The Architectural Correction
We have re-architected the entire application around the correct enterprise hierarchy:
```
CLOUD TECHNOLOGIES (Platform Owner & SaaS Vendor)
  │
  └── CLOUD SALON (Central Multi-Tenant SaaS Software)
        │
        ├── Tenant 001: SK Relax Studio (Pilot Client - Satara)
        │     ├── Owner (Salma Attar)
        │     ├── Manager, Receptionist, Stylists
        │     └── Isolated Appointments, POS, Customers, Inventory
        │
        ├── Tenant 002: Elegance Hair Studio (Client - Pune)
        │     ├── Owner (Ramesh Patel)
        │     └── Isolated Operations
        │
        └── Tenant N: Future Independent Salons Across India
```

Cloud Technologies platform administrators sit **ABOVE** all tenant workspaces and maintain zero access to private salon operational data (appointments, client phone numbers, receipts, commissions).

---

## 2. Two Distinct Application Experiences

The application now cleanly separates platform governance from salon operations:

### Experience A: Platform Administration (`/platform-admin`)
- **Target Audience:** Cloud Technologies Super Administrators (`PLATFORM_SUPER_ADMIN`).
- **Branding:** Exclusively **Cloud Technologies | Cloud Salon Platform Management**. Zero SK Relax branding.
- **Route Guard:** Strictly blocks unauthenticated users and salon users, redirecting them to `/login` or `/app`.
- **Dedicated Modules (11 Sections):**
  1. **Platform Overview** (`/platform-admin/overview`): Real-time platform KPIs, verified MRR, 14-day trial counts, PostgreSQL connectivity status, and recent platform governance logs.
  2. **Manage Tenants** (`/platform-admin/tenants`): Directory of all salon tenants, instant account activation/suspension toggles with audit reason prompts, and manual renewal payment triggers.
  3. **Add New Salon** (`/platform-admin/add-salon`): 10-field tenant provisioning form with automated database isolation, default branch creation, and owner credentials setup.
  4. **Subscription Plans** (`/platform-admin/plans`): Live manager for Plan A (Professional @ ₹999/mo) and Plan B (Business @ ₹1,799/mo), with price editors and feature toggles.
  5. **Subscriptions & Payments** (`/platform-admin/subscriptions`): Verified audit trail of manual billing transactions (UPI, Bank Transfer, Cheque) with reference numbers.
  6. **Trial Management** (`/platform-admin/trials`): Monitoring for salons in 14-day trials with countdown days remaining and one-click conversion to paid.
  7. **Renewals & Expiry** (`/platform-admin/renewals`): Salons expiring within 30 days and expired account recovery tools.
  8. **Platform Users** (`/platform-admin/users`): Cloud Technologies administrative team registry.
  9. **System Health** (`/platform-admin/health`): Telemetry of PostgreSQL 18 schema `salon`, database connection pool, local backup dump verification (`C:\CloudSalonBackups`), and API server status.
  10. **Audit Logs** (`/platform-admin/audit-logs`): Comprehensive record of administrative lifecycle operations.
  11. **Platform Settings** (`/platform-admin/settings`): Global platform configurations, trial duration, and infrastructure locations.

### Experience B: Salon Workspace (`/app`)
- **Target Audience:** Salon owners, managers, cashiers, receptionists, stylists, and inventory managers.
- **Branding:** Dynamically resolves to the logged-in salon's name (`tenant.name`), city, and operating hours. If SK Relax logs in, it displays SK Relax Studio; if another salon logs in, it displays their branding.
- **Isolation:** **Zero Super Admin or platform governance links exist in the salon workspace**.
- **Dedicated Modules (13 Sections):**
  1. **Dashboard** (`/app`): Salon revenue, daily appointments, staff leaderboard, and service share.
  2. **Appointments** (`/app/appointments`): Multi-stylist interactive booking calendar and conflict prevention.
  3. **POS Billing** (`/app/pos`): Walk-in B2C billing, retail cart, split payments, and thermal receipts.
  4. **Customers** (`/app/customers`): Client database with visit frequency and spending history.
  5. **Services** (`/app/services`): Salon service menu and pricing.
  6. **Staff & Commissions** (`/app/staff`): Stylist profiles, service commissions, and attendance.
  7. **Memberships & Packages** (`/app/packages`): Multi-session package sales and redemptions.
  8. **Inventory** (`/app/inventory`): Stock on hand, low-stock alerts, and stock ledger.
  9. **Expenses** (`/app/expenses`): Daily studio expenditures and category breakdowns.
  10. **Reports** (`/app/reports`): Daily, monthly sales, tax summaries, and staff performance.
  11. **GST & Tax Settings** (`/app/tax-settings`): Dedicated configuration for Simple Non-GST vs Regular GST (18%) billing, HSN/SAC codes, and tax-inclusive pricing.
  12. **Salon Settings** (`/app/settings`): Business profile, thermal receipt headers, and WhatsApp templates.
  13. **Subscription & Billing** (`/app/subscription`): Salon's view of their active tier, account limits, and direct Cloud Technologies renewal support.

---

## 3. Universal Login & Role-Based Routing

The login portal at `/login` provides seamless routing based on user role:
- **`PLATFORM_SUPER_ADMIN` / `SUPER_ADMIN`:** Automatically redirects to `/platform-admin/overview`.
- **Salon Roles (`OWNER`, `MANAGER`, `RECEPTIONIST`, `CASHIER`, `BEAUTICIAN`, `INVENTORY_MANAGER`):** Automatically redirects to `/app`.
- **Root URL (`/`):** Evaluates authentication state; redirects guests to `/login`, platform admins to `/platform-admin`, and salon users to `/app`.
- **Cross-Access Prevention:** Salon users attempting to open `/platform-admin` are blocked by `PlatformAdminLayout` and redirected to `/app`.

---

## 4. Architectural Verification Matrix

| Area | Prior Implementation | Corrected SaaS Architecture |
|---|---|---|
| **Software Identity** | Cloud Salon mixed with SK Relax | Cloud Salon SaaS by Cloud Technologies |
| **SK Relax Position** | Mistaken for Super Admin | Customer 001 (Isolated Tenant) |
| **Platform Navigation** | Embedded inside salon sidebar | Independent `/platform-admin` application |
| **Salon Navigation** | Contained platform settings | Purely operational 13 salon modules |
| **Authentication Store** | Hardcoded default user/tenant | Dynamic initialization from `localStorage` |
| **API Client Headers** | Defaulted to SK Relax fallback | Scoped strictly to authenticated session |
| **Privacy Firewall** | Partial | Enforced at DB and API layers |
