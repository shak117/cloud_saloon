# CLOUD SALON — System Architecture & Multi-Tenancy Audit
**Document:** System Architecture Audit  
**Author:** Principal SaaS Architect & Full-Stack Engineer  
**Date:** November 15, 2026  
**Product:** Cloud Salon by Cloud Technologies  
**Pilot Customer:** SK Relax Studio (Satara, Maharashtra, India)  

---

## 1. Executive Summary

This audit assesses the current state of the **Cloud Salon** software codebase, analyzes its readiness for full multi-tenant SaaS operation by **Cloud Technologies**, and maps the transition from a single-pilot implementation (SK Relax Studio) to a centralized, shared-database, multi-tenant SaaS platform serving salons, beauty academies, and hair studios across India.

### Core Audit Verdict:
* **Framework Stack**: The application is built on a modern, high-performance foundation: **Python 3.11 + FastAPI + SQLAlchemy 2.0 ORM** on the backend, and **React 19 + TypeScript + Vite + Tailwind CSS + TanStack Query + Zustand** on the frontend.
* **Database**: **PostgreSQL 18** with an isolated schema (`salon`) containing 20 relational tables.
* **Current Multi-Tenancy State**: The current implementation features preliminary multi-tenancy (`tenant_id` columns on business models), but relies on client-supplied headers (`X-Tenant-ID`) with fallback to a hardcoded pilot tenant (`sk-relax-satara`). 
* **Required Transformation**: Must transition to **server-resolved tenant identity** extracted strictly from cryptographically validated JWT claims, introduce Cloud Technologies **Super Admin platform governance**, implement a **subscription plan & enforcement engine**, protect **client privacy from platform admins**, provide an interactive **PWA**, and support automated salon onboarding.

---

## 2. Technology Stack & Framework Inventory

| Component | Framework / Tool | Version | Role in SaaS Architecture |
| :--- | :--- | :--- | :--- |
| **Backend Runtime** | Python | 3.11.9 | Core API execution engine |
| **API Framework** | FastAPI | 0.110.0+ | RESTful API with async lifespan & OpenAPI schema |
| **ORM & Database Layer** | SQLAlchemy | 2.0.28+ | Type-safe relational data mapping |
| **Database Driver** | psycopg (v3) | 3.1.18+ | Binary PostgreSQL 18 driver with connection pooling |
| **Schema Migrations** | Alembic | 1.13.1 | Schema migrations targeting `salon` schema |
| **Security & JWT** | python-jose & bcrypt | HS256 / 4.0.1 | Password hashing and JWT rotation |
| **PDF Invoice Engine** | ReportLab | 4.1.0+ | A4 Statutory Tax Invoices & 80mm POS Thermal Receipts |
| **Testing** | pytest & httpx | 8.3.3 / 0.27.0 | Automated end-to-end workflow verification |
| **Frontend Framework** | React | 19.3.1 | SPA with component-driven architecture |
| **Build Tool & Bundler** | Vite | 8.3.8 | HMR and optimized production bundling |
| **Language** | TypeScript | 7.0.2 | End-to-end type safety |
| **Styling & Theme** | Tailwind CSS | 3.4.19 | Luxury design system (Ivory, Obsidian Slate, Rose-Gold) |
| **Server State Management**| TanStack React Query | 5.107.1 | Optimistic caching and background revalidation |
| **Client Auth State** | Zustand | 5.1.0 | Client session and local state |
| **Icons & Charts** | Lucide React & Recharts | 1.71.0 / 3.10.1 | UI iconography and executive financial analytics |

---

## 3. Database Architecture & Table Inventory

The PostgreSQL 18 database currently runs with schema `salon` under database `cloud_billing`.

### Existing 20 Relational Tables:
1. `tenants`: Primary salon tenant record (currently holding SK Relax Studio).
2. `users`: Salon operators and staff user logins with bcrypt password hashes.
3. `staff`: Salon employees, stylists, therapists, commission rules, and shift hours.
4. `service_categories`: Hair, Skin, Beauty, Spa categories.
5. `services`: Catalog of treatments with prices, durations, SAC codes (`999721`), and GST rates.
6. `customers`: CRM records with mobile numbers, preferences, and visit aggregates.
7. `appointments`: Time slots, stylist assignments, status lifecycle, and conflict tracking.
8. `invoices`: Financial invoices with taxable values, CGST, SGST, IGST, and payment statuses.
9. `invoice_items`: Line items combining treatments, retail products, and package sales.
10. `payments`: Payment tender allocations (Cash, UPI, Card, Bank Transfer).
11. `packages`: Prepaid service packages (e.g., 5 sessions for ₹9,999).
12. `customer_packages`: Customer purchased package passes and remaining session ledger.
13. `package_redemptions`: Audit logs of redeemed sessions without fresh cash collection.
14. `product_categories`: Product taxonomy.
15. `products`: Retail shelf products and treatment consumables.
16. `service_recipes`: Consumable recipe rules for automatic material deduction.
17. `stock_ledger`: Inventory transaction ledger (purchases, sales, consumption, damage).
18. `expenses`: Operating outflows (rent, electricity, salon supplies, marketing).
19. `staff_commissions`: Calculated staff commissions on completed bills.
20. `audit_logs`: Activity logging table.

---

## 4. Current Authentication, Authorization & Security Gaps

### Audit Findings:
1. **Tenant Resolution Vulnerability**:
   - `get_current_tenant_id` in `backend/app/core/deps.py` currently checks the header `X-Tenant-ID` and falls back to `settings.PILOT_TENANT_ID` (`sk-relax-satara`).
   - If a client supplies an unauthorized `X-Tenant-ID` header, requests on routes that only depend on `get_current_tenant_id` could be misrouted.
   - **Remediation**: The tenant ID must be resolved **exclusively from the verified JWT access token payload**, which is cryptographically signed using the server's secret key.
2. **Missing Platform Super Admin Layer**:
   - The current `UserRole` enum only contains salon operational roles: `OWNER`, `MANAGER`, `RECEPTIONIST`, `BEAUTICIAN`, `CASHIER`, `INVENTORY_MANAGER`.
   - There is no platform administrator role (`SUPER_ADMIN`) representing Cloud Technologies.
   - The `User` model mandates `tenant_id` (not nullable), preventing global platform admins from logging in without being pinned to a specific salon.
   - **Remediation**: Add `SUPER_ADMIN` to `UserRole`, make `tenant_id`/`salon_id` nullable *only* for `SUPER_ADMIN`, and build a segregated platform management portal.
3. **Missing Subscription Lifecycle Engine**:
   - There are no tables for `subscription_plans` (Starter, Professional, Enterprise) and `subscriptions` (billing cycles, trial status, active/suspended flags).
   - The API currently allows unrestricted operations without checking whether the salon's subscription is `ACTIVE`, `TRIAL`, `EXPIRED`, or `SUSPENDED`.
   - **Remediation**: Create `subscription_plans` and `subscriptions` tables, add subscription status checks to API middleware/dependencies, and block operational routes when an account is suspended or expired.
4. **Super Admin Privacy Boundaries**:
   - In a multi-tenant SaaS, the software vendor (Cloud Technologies) must not have unrestricted backdoor access to private salon records (customer phone numbers, individual invoice items, stylist salary/commission details).
   - **Remediation**: Enforce strict architectural firewalls in the backend API ensuring Super Admin endpoints only return aggregated platform metrics, salon metadata, and subscription statuses, while explicitly forbidding Super Admin from accessing operational customer and billing endpoints.

---

## 5. Hardcoded Business Information & Demo Data

### Identified Hardcoded Values:
* `backend/.env`: `PILOT_TENANT_ID="sk-relax-satara"`
* `backend/app/core/deps.py`: Defaults to `settings.PILOT_TENANT_ID` when header is missing.
* `backend/app/services/demo_seeder.py`: Hardcoded dataset for SK Relax Studio (Satara).
* `frontend/src/store/authStore.ts`: Default state initializes with Salma Attar and SK Relax Studio data.
* `frontend/src/components/layout/Sidebar.tsx`: Hardcoded "Reset Demo Data" button resetting SK Relax Studio.
* `frontend/src/components/layout/AppLayout.tsx`: Hardcoded "Satara, Maharashtra" and salon name in breadcrumbs.

### Remediation:
All salon names, addresses, logos, GSTINs, and operational settings must be dynamically loaded from the authenticated salon's database profile.

---

## 6. Financial, POS & Inventory Workflow Audit

* **B2C Default Billing**: Working cleanly; generates invoice without mandatory customer registration.
* **GST Calculation**: Handled by `GSTEngine` with 18% inclusive/exclusive logic.
* **Split Tender**: Supports Cash, UPI, and Card.
* **Package Accounting**: Separates package purchase (cash collection) from session redemption (deduction of session balance without cash inflation).
* **Consumables Recipe Auto-Deduction**: Successfully deducts stock from `products` and creates a `stock_ledger` entry upon service completion.
* **Remaining Multi-Tenant Requirement**: Scoped unique constraints are needed (e.g. mobile number uniqueness must be scoped to `(salon_id, mobile)` so two different salons can register the same walk-in customer).

---

## 7. API Endpoints Inventory

56 routes currently active in `backend/app/main.py`:
- `/api/v1/auth/*`: Login, token refresh, current user profile, user creation.
- `/api/v1/dashboard/*`: Summary KPIs, 7-day revenue trend, service breakdown, staff leaderboard.
- `/api/v1/appointments/*`: Appointment listing, conflict detection, booking, status update.
- `/api/v1/pos/*`: Invoices, POS checkout, A4 PDF generation, 80mm thermal receipt generation.
- `/api/v1/services/*`: Categories, service catalog CRUD.
- `/api/v1/customers/*`: Customer listing, mobile lookup, profile drawer, customer creation/update.
- `/api/v1/staff/*`: Staff roster, creation, update, commission tracking.
- `/api/v1/packages/*`: Package plans, customer packages, purchase, session redemption.
- `/api/v1/inventory/*`: Categories, products, stock adjustments, stock ledger.
- `/api/v1/expenses/*`: Operating expenses, summary breakdown.
- `/api/v1/reports/*`: Financial overview, CSV export.
- `/api/v1/settings/*`: Profile update, WhatsApp templates preview, demo reset.

All routes must be updated to enforce trusted server-side tenant validation and subscription status verification.
Additionally, dedicated `/api/v1/super-admin/*` routes will be created for platform administration.

---

## 8. Deployment, PWA & Infrastructure Audit

* **Docker**: `docker-compose.yml` is present with PostgreSQL 16, backend, and frontend containers.
* **Production Domain**: The target domain is `https://salon.cloudtechnologiess.in`.
* **PWA State**: Currently missing `manifest.json`, service worker, install prompts, and offline fallback notice.
* **Database Backup**: `scripts/backup_postgres.ps1` is fully functional and creates compressed `.dump` files with 30-day retention.
