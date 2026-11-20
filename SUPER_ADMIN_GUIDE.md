# CLOUD SALON – Super Admin Operations Manual
## Cloud Technologies | Platform Governance, Salon Management & Subscription Control

### 1. Platform Governance Overview
The Cloud Technologies Super Admin dashboard is accessible exclusively to Cloud Technologies personnel to manage SaaS operations, monitor platform health, register salons, configure official plans, and record subscription renewals.

* **Target URL**: `https://salon.cloudtechnologiess.in/super-admin`
* **Default Super Admin Credentials**:
  - Email: `admin@cloudtechnologies.in`
  - Password: `CloudAdmin@2026`

---

### 2. Platform Dashboard & Key Performance Indicators (KPIs)

Upon logging into the Super Admin portal, administrators see live SaaS metrics:
1. **Total Registered Salons**: Aggregate count of all customer businesses created on the platform.
2. **Active Operational Salons**: Salons actively operating on paid subscriptions or valid trials.
3. **14-Day Free Trials**: Salons currently in their self-service trial evaluation window.
4. **Verified Monthly Recurring Revenue (MRR)**: Sum of active monthly subscriptions and prorated annual subscriptions verified by payment receipts.
5. **Subscription Tier Split**: Real-time breakdown of **Professional** (₹999/mo) vs **Business** (₹1,799/mo) accounts.
6. **Platform Health**: PostgreSQL connection status, database schema integrity (`salon`), and service uptime.

---

### 3. Registering a New Salon Tenant

To onboard a new salon:
1. Navigate to `/super-admin` and click **"+ Register New Salon"**.
2. Complete the onboarding modal:
   - **Salon / Brand Name**: (e.g. *Elegance Beauty Studio*)
   - **Owner Full Name**: (e.g. *Rahul Deshmukh*)
   - **Owner Phone / WhatsApp**: (e.g. `+91 9822334455`)
   - **Owner Login Email**: (e.g. `rahul@elegance.com`)
   - **Initial Temporary Password**: (e.g. `Elegance@2026`)
   - **Subscription Tier**: Choose `Professional` or `Business`.
   - **14-Day Free Trial Toggle**: Checked by default.
   - **City & State**: (e.g. *Pune, Maharashtra*)
3. Click **"Create Tenant & Account"**.
   - The backend automatically initializes a fresh isolated tenant, registers the owner account, seeds a default main branch, and sets up clean independent records.

---

### 4. Account Lifecycle Management: Suspend & Reactivate

If a salon account experiences payment delinquency or violates terms of service:
1. Locate the salon in the **Registered Salons** table.
2. Click **"Suspend"**.
3. Enter the reason (e.g. *Subscription expired past grace period*).
4. **Immediate Effect**:
   - The salon's login and checkout API endpoints immediately return `HTTP 403 Forbidden`.
   - The salon's data, customer history, appointments, and inventory are **100% preserved**.
5. To restore access, click **"Activate"** or record a verified subscription payment.

---

### 5. Recording Verified Subscription Payments (Renewal)

Cloud Technologies supports direct bank transfer, UPI QR, and cash subscription payments from salon owners:
1. In the **Registered Salons** table, click **"Renew / Pay"** next to the target salon.
2. Select the renewal plan (`Professional` or `Business`).
3. Enter the amount paid (e.g. ₹999 for 1 month or ₹9,999 for 1 year).
4. Enter the **Transaction Reference** (e.g. `UPI/UTR/20261115-992100`).
5. Enter the duration in months (e.g. `1` or `12`).
6. Click **"Record & Extend Access"**.
   - The subscription validity date is extended forward in PostgreSQL.
   - The salon status transitions to `ACTIVE`, and the payment appears in platform MRR.

---

### 6. Platform Audit Trail
All Super Admin actions (salon creation, plan changes, suspensions, payment recordings) are permanently logged to `platform_audit_logs` and viewable under the **Platform Governance Logs** tab.
