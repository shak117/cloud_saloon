# Cloud Salon – Role & Permission Matrix
**Platform Owner:** Cloud Technologies  
**Product:** Cloud Salon SaaS  
**Date:** November 16, 2026  
**Status:** Approved & Enforced  

---

## 1. Role Architecture Overview

Cloud Salon defines two completely separated tiers of roles:

1. **Platform Governance Tier (`PLATFORM_SUPER_ADMIN`):**
   - Cloud Technologies administrative personnel.
   - Sits above all tenants.
   - Manages salon registrations, subscriptions, manual payments, and platform health.
   - **Zero access to private salon transactions, customer contacts, or appointments**.

2. **Salon Operational Tier:**
   - Scoped strictly to one authenticated salon workspace (`tenant_id`).
   - Includes: `SALON_OWNER`, `SALON_MANAGER`, `SALON_RECEPTIONIST`, `SALON_CASHIER`, `SALON_BEAUTICIAN`, `SALON_INVENTORY_MANAGER`.

---

## 2. Comprehensive Role Permission Matrix

| Feature / Module | PLATFORM_SUPER_ADMIN | SALON_OWNER | SALON_MANAGER | SALON_RECEPTIONIST | SALON_CASHIER | SALON_BEAUTICIAN | SALON_INVENTORY_MANAGER |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Platform Governance Portal (`/platform-admin`)** | ✅ Full | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked |
| **Tenant Provisioning & Onboarding** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Subscription Plan Pricing & Limits** | ✅ Full | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Tenant Suspension / Activation** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Record Subscription Renewals** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Platform Infrastructure Telemetry** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Salon Workspace Access (`/app`)** | ⚠️ View Only | ✅ Full | ✅ Full | ✅ Limited | ✅ Limited | ✅ Limited | ✅ Limited |
| **Salon Dashboard & Revenue Metrics** | ❌ Blocked (Firewall) | ✅ Full | ✅ Full | ❌ No | ❌ No | ❌ No | ❌ No |
| **Appointment Scheduling & Calendar** | ❌ Blocked (Firewall) | ✅ Full | ✅ Full | ✅ Full | 👁️ Read | 👁️ Own Appts | ❌ No |
| **POS Billing & Checkout** | ❌ Blocked (Firewall) | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ❌ No | ❌ No |
| **Customer Database & PII Contacts** | ❌ Blocked (Firewall) | ✅ Full | ✅ Full | ✅ Full | 👁️ Read | 👁️ Assigned | ❌ No |
| **Service Menu & Pricing Management** | ❌ Blocked (Firewall) | ✅ Full | ✅ Full | 👁️ Read | 👁️ Read | 👁️ Read | 👁️ Read |
| **Staff Management & Roster** | ❌ Blocked (Firewall) | ✅ Full | ✅ Full | 👁️ Read | 👁️ Read | 👁️ Own Profile | ❌ No |
| **Staff Commission Tracking & Payouts**| ❌ Blocked (Firewall) | ✅ Full | ✅ Full | ❌ No | ❌ No | 👁️ Own Comm. | ❌ No |
| **Prepaid Packages & Memberships** | ❌ Blocked (Firewall) | ✅ Full | ✅ Full | ✅ Redeem | ✅ Redeem | ❌ No | ❌ No |
| **Inventory Stock Management** | ❌ Blocked (Firewall) | ✅ Full | ✅ Full | 👁️ Read | 👁️ Read | ❌ No | ✅ Full |
| **Expenses Tracking & Categorization**| ❌ Blocked (Firewall) | ✅ Full | ✅ Full | ❌ No | ❌ No | ❌ No | 👁️ Supplies |
| **Business & Tax Reports** | ❌ Blocked (Firewall) | ✅ Full | ✅ Full | ❌ No | ❌ No | ❌ No | ❌ No |
| **GST Configuration & Tax Settings** | ❌ Blocked (Firewall) | ✅ Full | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Salon Business Settings & Receipts** | ❌ Blocked (Firewall) | ✅ Full | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Salon Subscription View (`/subscription`)**| ❌ Blocked (Firewall) | ✅ Full | 👁️ Read | ❌ No | ❌ No | ❌ No | ❌ No |

---

## 3. Super Admin Privacy Firewall Architecture

The Super Admin Privacy Firewall protects customer privacy and commercial trust across all independent salons:

1. **Cryptographic & Header Boundary:** Platform administrators authenticate with tokens lacking tenant scoping (`tenant_id = null`). When a platform administrator requests salon operational endpoints (e.g. `/api/v1/invoices` or `/api/v1/customers`), the backend dependency `get_current_tenant_id` blocks the request with `403 Forbidden: Super Admin cannot directly access salon operational records`.
2. **Aggregated Usage Only:** In `/api/v1/super-admin/salons`, platform administrators can view aggregated counts only (`total_customers_count`, `total_appointments_count`, `total_staff_count`), without any access to customer names, mobile numbers, service notes, or individual bill amounts.
3. **No Cross-Tenant Leaks:** Even if a Super Admin wanted to look at a salon's appointments, the operational API does not provide a tenant-override parameter. Platform administrators govern the business contract (subscription status, plan limits, expiry dates), not the internal daily appointments of the salon.
