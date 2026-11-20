# CLOUD SALON — Multi-Tenant Database Migration Plan
**Document:** Database Migration Specification  
**Author:** Principal PostgreSQL Database Engineer & SaaS Architect  
**Date:** November 15, 2026  
**Product:** Cloud Salon by Cloud Technologies  
**Target Schema:** PostgreSQL 18 `salon` schema  

---

## 1. Objectives & Migration Strategy

The goal is to transition the database from a single-pilot schema to a scalable, multi-tenant SaaS schema supporting hundreds of independent salons, while:
1. **Preserving 100% of SK Relax Studio pilot records** without data loss.
2. **Introducing Core SaaS Entities**: `subscription_plans`, `subscriptions`, and `platform_audit_logs`.
3. **Enhancing the Salon Model**: Expanding `tenants` to fulfill all `salons` requirements (`owner_name`, `business_type`, `subscription_plan_id`, `subscription_status`, `subscription_start_date`, `subscription_end_date`, `timezone`, `tax_configuration`).
4. **Enabling Platform Super Admin**: Updating `users` table so `tenant_id` is nullable *exclusively* for `SUPER_ADMIN` platform operators.
5. **Adding Scoped Constraints**: Ensuring uniqueness (e.g. customer phone numbers, invoice sequences) is scoped per salon.

---

## 2. Table-by-Table Schema Specification

### A. New Platform Table: `subscription_plans`
```sql
CREATE TABLE IF NOT EXISTS salon.subscription_plans (
    id VARCHAR(36) PRIMARY KEY,
    plan_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    monthly_price NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    annual_price NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    feature_configuration JSONB DEFAULT '{}'::jsonb,
    user_limit INTEGER NOT NULL DEFAULT 5,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### B. New Platform Table: `subscriptions`
```sql
CREATE TABLE IF NOT EXISTS salon.subscriptions (
    id VARCHAR(36) PRIMARY KEY,
    salon_id VARCHAR(64) NOT NULL REFERENCES salon.tenants(id) ON DELETE CASCADE,
    plan_id VARCHAR(36) NOT NULL REFERENCES salon.subscription_plans(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PAID',
    subscription_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    payment_method VARCHAR(50) DEFAULT 'BANK_TRANSFER',
    transaction_reference VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_subscriptions_salon_id ON salon.subscriptions(salon_id);
```

### C. New Platform Table: `platform_audit_logs`
```sql
CREATE TABLE IF NOT EXISTS salon.platform_audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    platform_user_id VARCHAR(36) REFERENCES salon.users(id) ON DELETE SET NULL,
    salon_id VARCHAR(64) REFERENCES salon.tenants(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_platform_audit_logs_salon_id ON salon.platform_audit_logs(salon_id);
```

### D. Table Enhancement: `tenants` (acting as `salons`)
Add missing SaaS columns:
```sql
ALTER TABLE salon.tenants 
    ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255) DEFAULT 'Salon Owner',
    ADD COLUMN IF NOT EXISTS business_type VARCHAR(100) DEFAULT 'Unisex Salon & Spa',
    ADD COLUMN IF NOT EXISTS subscription_plan_id VARCHAR(36) REFERENCES salon.subscription_plans(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS subscription_start_date DATE DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS subscription_end_date DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
    ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    ADD COLUMN IF NOT EXISTS tax_configuration JSONB DEFAULT '{"cgst_rate": 9.0, "sgst_rate": 9.0, "igst_rate": 18.0}'::jsonb;
```

### E. Table Enhancement: `users`
Make `tenant_id` nullable for Cloud Technologies Super Admins:
```sql
ALTER TABLE salon.users ALTER COLUMN tenant_id DROP NOT NULL;
```

### F. Scoped Unique Indexes on Business Tables
1. **Customers**: Unique mobile number scoped per salon:
   ```sql
   CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_mobile_per_salon 
   ON salon.customers (tenant_id, mobile) WHERE is_active = true;
   ```
2. **Invoices**: Unique invoice numbering scoped per salon:
   ```sql
   CREATE UNIQUE INDEX IF NOT EXISTS uq_invoice_number_per_salon 
   ON salon.invoices (tenant_id, invoice_number);
   ```
3. **Appointments**: Unique appointment number scoped per salon:
   ```sql
   CREATE UNIQUE INDEX IF NOT EXISTS uq_appointment_number_per_salon 
   ON salon.appointments (tenant_id, appointment_number);
   ```

---

## 3. Data Migration & Seeding Sequence

1. **Pre-Migration Backup**: Execute `scripts/backup_postgres.ps1` before altering schema.
2. **Create New Tables**: `subscription_plans`, `subscriptions`, `platform_audit_logs`.
3. **Seed SaaS Subscription Plans**:
   - **Starter Plan**: ₹1,499/mo (Up to 3 staff, basic POS & Appointments).
   - **Professional Plan**: ₹2,999/mo (Up to 10 staff, inventory recipe deduction, packages, reports).
   - **Enterprise Plan**: ₹5,999/mo (Unlimited staff, multi-branch, dedicated WhatsApp API).
4. **Update Pilot Tenant (SK Relax Studio)**:
   - Assign to **Professional Plan**.
   - Set status to **ACTIVE**.
   - Validity set to 1 year from current date.
   - Record an initial subscription payment record in `subscriptions`.
5. **Seed Cloud Technologies Super Admin**:
   - Email: `admin@cloudtechnologies.in`
   - Name: `Cloud Technologies Platform Administrator`
   - Role: `SUPER_ADMIN`
   - `tenant_id`: `NULL`
   - Password: `CloudAdmin@2026` (Securely hashed via bcrypt).

---

## 4. Rollback & Reversibility Strategy

* Every migration step is written with reversible Alembic operations (`upgrade()` and `downgrade()`).
* Database backups are preserved in `C:\CloudSalonBackups\`.
* In the event of a failure, the backup dump can be restored in seconds with `pg_restore`.
