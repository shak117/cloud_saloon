# Cloud Salon – Tenant Migration Report
**Tenant ID:** `sk-relax-satara`  
**Tenant Name:** SK Relax Studio  
**Classification:** Pilot Customer (Tenant 001)  
**Database:** PostgreSQL 18 (`cloud_billing`), Schema: `salon`  
**Date:** November 16, 2026  
**Status:** Successfully Migrated & Isolated  

---

## 1. Executive Summary

As part of the multi-tenant SaaS architecture correction, SK Relax Studio has been cleanly isolated as an independent tenant customer within the Cloud Salon platform. 

**Zero data was lost or deleted.** All historical operational records, appointments, invoices, payments, staff profiles, and service recipes remain fully intact under `tenant_id = 'sk-relax-satara'`.

---

## 2. Baseline Record Inventory Verification

A full database audit confirmed the preservation of all baseline records:

| Entity Type | Database Table | Record Count | Verification Status |
|---|---|---|---|
| **Tenant Container** | `salon.tenants` | 1 | Preserved (`id = 'sk-relax-satara'`) |
| **Branch** | `salon.branches` | 1 | Preserved (Main Branch: Rajwada Circle) |
| **Users / Authentication** | `salon.users` | 4 | Preserved (Owner, Manager, Stylists) |
| **Staff Members** | `salon.staff` | 6 | Preserved (Pooja, Sneha, Rahul, Priyanka, etc.) |
| **Customers** | `salon.customers` | 6 | Preserved with full visit histories |
| **Service Catalogue** | `salon.services` | 14 | Preserved with pricing & durations |
| **Service Categories** | `salon.service_categories` | 5 | Preserved (Hair, Skin, Bridal, Massage, Nails) |
| **Product Inventory** | `salon.products` | 7 | Preserved (Retail shampoos + Professional Creambath) |
| **Product Categories** | `salon.product_categories` | 3 | Preserved |
| **Service Recipes** | `salon.service_recipes` | 2 | Preserved (Creambath grams & Hydra-facial vials) |
| **Prepaid Packages** | `salon.packages` | 2 | Preserved (Bridal Glow & Annual Hair Care) |
| **Customer Package Holds**| `salon.customer_packages` | 1 | Preserved |
| **Package Redemptions** | `salon.package_redemptions` | 1 | Preserved |
| **Appointments** | `salon.appointments` | 6 | Preserved & active |
| **Invoices** | `salon.invoices` | 10 | Preserved with sequence numbers |
| **Invoice Items** | `salon.invoice_items` | 15 | Preserved with tax breakdowns |
| **Payment Receipts** | `salon.payments` | 15 | Preserved (UPI, Card, Cash) |
| **Staff Commissions** | `salon.staff_commissions` | 12 | Preserved with calculated earnings |
| **Expenses** | `salon.expenses` | 4 | Preserved (Rent, Electricity, Supplies, Marketing) |
| **Subscriptions** | `salon.subscriptions` | 1 | Preserved (Business Tier Subscription) |

---

## 3. Database Schema & Multi-Tenant Keys

All tables in the PostgreSQL database reside in the dedicated `salon` schema. Every operational table enforces row-level multi-tenancy via `tenant_id`:
```sql
ALTER TABLE salon.appointments ADD CONSTRAINT fk_appointments_tenant FOREIGN KEY (tenant_id) REFERENCES salon.tenants(id) ON DELETE CASCADE;
ALTER TABLE salon.invoices ADD CONSTRAINT fk_invoices_tenant FOREIGN KEY (tenant_id) REFERENCES salon.tenants(id) ON DELETE CASCADE;
ALTER TABLE salon.customers ADD CONSTRAINT fk_customers_tenant FOREIGN KEY (tenant_id) REFERENCES salon.tenants(id) ON DELETE CASCADE;
ALTER TABLE salon.products ADD CONSTRAINT fk_products_tenant FOREIGN KEY (tenant_id) REFERENCES salon.tenants(id) ON DELETE CASCADE;
```

Unique constraints (such as customer phone numbers and invoice numbers) are composite-scoped:
- `UNIQUE(tenant_id, phone)` on `customers`: Allows multiple salons to serve the same customer phone number without collision.
- `UNIQUE(tenant_id, invoice_number)` on `invoices`: Allows each salon to maintain independent invoice numbering (`SKR-1001`, `ELG-1001`).

---

## 4. Pre-Correction Database Backup Details

Before applying schema and role migrations, a full PostgreSQL binary dump was generated and validated:

- **Backup File Path:** `C:\CloudSalonBackups\cloud_salon_2026-11-15_231437.dump`
- **File Size:** `75,479 bytes` (73.71 KB)
- **Format:** PostgreSQL Custom Archive (`-Fc`), compressed with metadata.
- **Scope:** Entire `salon` schema including data, sequences, tables, constraints, and indexes.

### Restoration Command
To restore this baseline state if ever needed:
```powershell
& 'C:\Program Files\PostgreSQL\18\bin\pg_restore.exe' -h localhost -U cloudbilling -d cloud_billing --clean --if-exists -n salon 'C:\CloudSalonBackups\cloud_salon_2026-11-15_231437.dump'
```
