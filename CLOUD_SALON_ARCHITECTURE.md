# CLOUD SALON – SaaS Architecture Specification
## Cloud Technologies | Production-Grade Multi-Tenant Platform

### 1. Architectural Mission & Vision
**Cloud Salon** is a commercial multi-tenant Software-as-a-Service (SaaS) platform engineered by **Cloud Technologies** for salons, beauty academies, hair studios, and spas across India. 

The platform operates on a **Single Codebase, Shared Database, Strict Tenant Isolation** model deployed at:
`https://salon.cloudtechnologiess.in`

---

### 2. High-Level System Architecture

```
[ Salon Tablets / PCs / Reception Desks ]
        │ (HTTPS / WSS / PWA)
        ▼
[ NGINX Reverse Proxy & SSL Termination ]
  (Certbot Let's Encrypt / Rate Limiting / Security Headers)
        │
        ├──▶ [ React 19 + Vite + Tailwind + PWA Client ] (Port 5174 / Static Assets)
        │
        └──▶ [ FastAPI Multi-Tenant Core ] (Port 8001)
                │
                ├── [ Security & Auth Engine (JWT / Role Guard / Privacy Firewall) ]
                ├── [ Subscription & Feature Gatekeeper (Plan A vs Plan B) ]
                ├── [ POS & Non-GST Billing Engine (Modular Tax Architecture) ]
                ├── [ Staff Commission & Inventory Recipe Engine ]
                │
                ▼
        [ PostgreSQL 18 Multi-Tenant Database ] (Schema: `salon`)
          ├── Scoped Unique Constraints (tenant_id + mobile, tenant_id + email)
          ├── Foreign Key Referential Integrity & Cascades
          └── Connection Pooling with Safe Isolation
```

---

### 3. Core Architectural Principles

1. **One Central Shared Web Application**:
   - Every salon tenant accesses the application through `https://salon.cloudtechnologiess.in`.
   - Distinct salon branding, currency, timezones, and feature limits are resolved dynamically based on authenticated JWT credentials.
2. **Server-Side Tenant Resolution (Zero Trust on Client Headers)**:
   - Client requests cannot spoof or inject `X-Tenant-ID` to access foreign salon records.
   - The user's trusted server-side identity (`sub` and `tenant_id`) is extracted from the cryptographically signed JWT token.
3. **Super Admin Privacy Firewall**:
   - Platform administration is segregated from tenant operations.
   - Cloud Technologies Super Admin has centralized governance over salon onboarding, plan assignments, suspensions, and platform metrics, but is **strictly blocked** by backend guards from inspecting private customer contact details, salon invoices, operational receipts, or staff commissions.
4. **Offline Resilience & PWA**:
   - Cloud Salon is installable on Windows, macOS, Android, and iOS as a standalone Progressive Web App.
   - Offline fallback transparently clarifies that central server synchronization is required to preserve live transactional integrity.

---

### 4. Technology Stack Specification

| Layer | Technology | Version / Specification | Role in Cloud Salon |
| :--- | :--- | :--- | :--- |
| **Frontend** | React + Vite + TypeScript | React 19, Vite 8, TS 5.6 | Fast, responsive single-page desktop and tablet UI |
| **Styling** | Tailwind CSS + Lucide Icons | Tailwind 3.4 | Luxury aesthetic (Ivory, Charcoal, Rose Gold) |
| **State & Cache** | TanStack Query + Zustand | TanStack Query v5, Zustand v5 | Optimistic state, cached queries, auto-refresh |
| **Backend** | Python FastAPI | Python 3.11, FastAPI 0.115 | High-throughput asynchronous REST API |
| **ORM** | SQLAlchemy 2.0 | Core + ORM | Database modeling, relationships, migrations |
| **Database** | PostgreSQL 18 | Schema `salon` | Multi-tenant relational storage, ACID compliance |
| **Security** | Python Native `bcrypt` + PyJWT | HS256, Bcrypt salt | Secure password hashing, tamper-proof tokens |
| **Reporting** | ReportLab | ReportLab 4.2 | Dynamic A4 retail invoices & 80mm thermal receipts |
| **Testing** | Pytest + Starlette TestClient | Pytest 8.3 | Automated cross-tenant isolation & workflow testing |

---

### 5. Multi-Tenant Relational Schema Model

The PostgreSQL database `cloud_billing` encapsulates all tables under the dedicated schema `salon`:

* **Platform Governance**:
  - `subscription_plans`: Defines the two official tiers (**Professional** ₹999/mo, **Business** ₹1,799/mo), one-time setup fees, staff limits, branch limits, and feature toggles.
  - `subscriptions`: Real-time subscription lifecycle records (ACTIVE, TRIAL, SUSPENDED, EXPIRED).
  - `platform_audit_logs`: Immutable audit trail of Super Admin operations.
* **Salon Business Core**:
  - `tenants`: Primary salon organization record (`owner_name`, `business_type`, `subscription_plan_id`, `tax_configuration`, `invoice_prefix`, `invoice_sequence`).
  - `branches`: Physical salon branch locations (1 for Professional, up to 3 for Business).
  - `users`: Salon operators and staff with RBAC (`OWNER`, `MANAGER`, `RECEPTIONIST`, `BEAUTICIAN`, `CASHIER`, `INVENTORY_MANAGER`). Super Admin has `tenant_id = NULL` and role `SUPER_ADMIN`.
  - `customers`: Salon CRM profiles scoped with unique index on `(tenant_id, mobile)`.
  - `services` & `service_categories`: Treatment catalogue with duration and pricing.
  - `staff` & `staff_commissions`: Service providers, designations, and commission ledgers.
  - `appointments`: Real-time salon appointment scheduler with double-booking prevention.
  - `invoices`, `invoice_items`, `payments`: B2C retail billing, multi-tender payments (UPI, Cash, Card), discounts, and partial balances.
  - `products`, `product_categories`, `stock_ledger`, `service_recipes`: Consumable and retail cosmetic inventory with automated depletion upon service completion.
  - `packages`, `customer_packages`, `package_redemptions`: Prepaid session packages (Business tier).
  - `expenses`: Operating expense records (rent, utilities, vendor bills).
