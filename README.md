# CLOUD SALON — Premium Salon Billing & Management SaaS
**Built by Cloud Technologies**  
**Initial Pilot Tenant:** SK Relax Studio (Satara, Maharashtra, India)  
**Target Market:** Salons, Beauty Studios, Hair Artists & Spas across India  

---

## 1. System Overview

Cloud Salon is an end-to-end, commercial-grade SaaS platform built specifically for Indian salon and beauty studio operations. It prioritizes frictionless **B2C Walk-in billing**, provides **multi-column stylist calendar grids**, automates **service consumable recipe deductions**, separates **prepaid package sales from session redemptions**, and manages **statutory GST compliance (SAC 999721/999722, HSN 330510)**.

### Live Architecture:
- **Backend**: Python 3.11 + FastAPI + SQLAlchemy 2.0 ORM + Pydantic v2 + Alembic (Running on Port `8001`).
- **Database**: PostgreSQL 18 with dedicated `salon` schema, strict multi-tenant `tenant_id` partitioning and connection pooling (`psycopg v3`).
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons + TanStack Query + Zustand (Running on Port `5174`).
- **PDF Engine**: ReportLab generating standard A4 Tax Invoices and 80mm POS Thermal Receipts.

---

## 2. 12 Core Modules

1. **Executive Dashboard**: Real-time revenue earned, cash collected, digital payments, pending receivables, operating expenses, and estimated net profit.
2. **Appointment Scheduling**: Multi-column stylist schedule grid with automated double-booking conflict prevention.
3. **B2C POS Billing**: Fast point-of-sale checkout (< 15 seconds) with split tender (Cash, UPI, Card), discount engine, and A4/80mm thermal receipt printing.
4. **Customer CRM**: Client visit history, preferences, skin/hair notes, active loyalty packages, and VIP status.
5. **Services Catalog**: Categorized catalog (Hair, Skin, Beauty, Spa) with duration, SAC codes, and 18% GST rates.
6. **Staff Management**: Team roster, shift hours, and commission engine (Fixed / Percentage / None).
7. **Memberships & Packages**: Prepaid multi-session passes with session redemption that avoids inflating cash revenue.
8. **Products & Inventory**: Dual-ledger separating retail cosmetics sold to clients from treatment consumables.
9. **Consumable Recipe Engine**: Auto-deducts treatment materials (creams, developers, wax) when services are marked completed.
10. **Expense Management**: Operating expense tracking (Rent, Electricity, Salon supplies, Staff payroll) factored into net profit.
11. **Reports & Analytics**: Statutory GST statement, payment breakdown, stylist leaderboard, and CSV sales export.
12. **RBAC & Salon Settings**: 6 roles (Owner, Manager, Receptionist, Cashier, Beautician, Inventory Manager), WhatsApp Business Cloud API preview, and demo reset.

---

## 3. Pilot Tenant: SK Relax Studio (Satara)

- **Name**: SK Relax Beauty Academy & Salon
- **Founder**: Salma Attar
- **Address**: 6, Rajwada Circle, Pratapganj Peth, Satara, Maharashtra 415002
- **GSTIN**: `27AAACS1234F1Z5`
- **Default Login**:
  - Owner: `salma@skrelax.com` (Password: `Salma@2026`)
  - Manager: `manager@skrelax.com` (Password: `Manager@2026`)
  - Receptionist: `reception@skrelax.com` (Password: `Reception@2026`)
  - Stylist: `stylist@skrelax.com` (Password: `Stylist@2026`)

---

## 4. Quick Start Guide

### Start Everything:
Double click `start_cloud_salon.bat` or run:

```bash
# 1. Start Backend (Port 8001)
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload

# 2. Start Frontend (Port 5174)
cd frontend
npm run dev
```

Visit: `http://localhost:5174/`  
API Swagger Docs: `http://127.0.0.1:8001/docs`

### Run Test Suite:
```bash
pytest -v
```

### Automated Database Backup:
```powershell
powershell -ExecutionPolicy Bypass -File "scripts\backup_postgres.ps1"
```
Backups are archived in `C:\CloudSalonBackups\` as compressed `.dump` files with 30-day retention.
