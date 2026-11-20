# CLOUD SALON – Official Subscription Plans & Feature Gates
## Cloud Technologies | Commercial SaaS Pricing & Feature Tiers

### 1. Subscription Overview
Cloud Salon offers exactly **TWO official subscription tiers** designed for the Indian salon and wellness market.

All subscription pricing, staff limits, branch allocations, and feature toggles are dynamically managed and configurable by Cloud Technologies through the **Super Admin Portal**.

---

### 2. Tier Comparison Matrix

| Capability / Resource | PLAN A – PROFESSIONAL | PLAN B – BUSINESS |
| :--- | :--- | :--- |
| **Target Audience** | Independent salons, single beauty studios, boutique stylists | Multi-branch studios, premium academies, expanding spas |
| **Monthly Subscription** | **₹999 / month** | **₹1,799 / month** |
| **Annual Subscription** | **₹9,999 / year** (Save ₹1,989) | **₹17,999 / year** (Save ₹3,589) |
| **One-time Setup Fee** | **₹1,999** | **₹2,999** |
| **Free Trial Duration** | **14 Days** (Full Features) | **14 Days** (Full Features) |
| **Salon Locations / Branches**| **Strictly 1 Location** | **Up to 3 Branches** |
| **Staff Accounts** | **Maximum 3 Staff** *(Excludes Owner)* | **Unlimited Staff Accounts** |
| **B2C POS Billing (<15s)** | ✅ Included | ✅ Included |
| **Cash, UPI & Card Tracking** | ✅ Included | ✅ Included |
| **Appointment Scheduler** | ✅ Included | ✅ Included |
| **Customer Visit CRM** | ✅ Included | ✅ Included |
| **Service Catalogue & Pricing**| ✅ Included | ✅ Included |
| **Basic Inventory & Products** | ✅ Included | ✅ Included |
| **Daily & Monthly Reports** | ✅ Included | ✅ Included |
| **Invoice & Thermal Printing** | ✅ Included | ✅ Included |
| **Multi-Branch Dashboard** | ❌ Requires Business | ✅ Included |
| **Branch-wise Revenue Reports**| ❌ Requires Business | ✅ Included |
| **Advanced Staff Commissions** | ❌ Requires Business | ✅ Included |
| **Memberships & Packages** | ❌ Requires Business | ✅ Included |
| **Advanced Inventory & Recipes**| ❌ Requires Business | ✅ Included |
| **Purchases & Suppliers** | ❌ Requires Business | ✅ Included |
| **Staff Performance Analytics**| ❌ Requires Business | ✅ Included |
| **Operating Profit Statements**| ❌ Requires Business | ✅ Included |
| **Support SLA** | Standard Email & WhatsApp Support | Priority WhatsApp & Dedicated Manager |

---

### 3. Backend Subscription Feature Control Engine

Feature restrictions are enforced at the API layer via FastAPI dependencies (`require_feature`, `require_active_subscription`):

```python
# backend/app/core/deps.py
def require_feature(feature_key: str):
    def feature_checker(
        tenant: Tenant = Depends(require_active_subscription),
        db: Session = Depends(get_db)
    ) -> Tenant:
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == tenant.subscription_plan_id).first()
        features = plan.feature_configuration or {}
        if not features.get(feature_key, False):
            display_name = feature_key.replace("_", " ").title()
            raise HTTPException(
                status_code=403,
                detail=f"{display_name} is available exclusively in Cloud Salon Business. Upgrade to ₹1,799/month to unlock this feature."
            )
        return tenant
    return feature_checker
```

---

### 4. Staff Account Limit Calculation
The owner account is **explicitly excluded** from the staff limit:
```python
# Count staff accounts excluding OWNER
existing_staff_count = db.query(User).filter(
    User.tenant_id == current_user.tenant_id,
    User.role != UserRole.OWNER.value,
    User.is_active == True
).count()

if existing_staff_count >= plan.staff_limit:
    raise HTTPException(
        status_code=403,
        detail=f"Staff limit reached ({existing_staff_count}/{plan.staff_limit}). Cloud Salon {plan.plan_name} allows up to {plan.staff_limit} staff accounts (excluding owner). Upgrade to Cloud Salon Business for unlimited staff accounts."
    )
```

---

### 5. Grace Period & Expiration Policy
1. **14-Day Free Trial**:
   - Every newly registered salon enjoys 14 days of unrestricted operational access.
   - At the conclusion of day 14, if no paid subscription is recorded, account status shifts to `EXPIRED`.
2. **Expired / Suspended Status Enforcement**:
   - If `subscription_status in ("SUSPENDED", "CANCELLED")` or `subscription_end_date < now`:
   - All write operations (checkout, new appointments, staff updates) return `HTTP 403 Forbidden` with detailed renewal instructions.
   - **Data Preservation Guarantee**: Salon data, appointments, invoices, and customer records are **never deleted** on subscription lapse. Access is immediately restored upon recording verified renewal.
