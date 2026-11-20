# CLOUD SALON – Multi-Tenant Security & Isolation Architecture
## Cloud Technologies | Security Policies, RBAC & Privacy Firewalls

### 1. Multi-Tenant Threat Model & Security Posture
In a commercial SaaS platform serving multiple independent salon businesses across India, data leakage between competitor salons constitutes an existential business and legal risk.

**Cloud Salon enforces a Zero-Trust Multi-Tenant Architecture.** Under no circumstance can Salon A query, modify, or infer the existence of Salon B's customers, revenue, employees, or operational documents.

---

### 2. Core Isolation Enforcement Rules

#### Rule 1: Server-Side Identity Resolution
```python
# backend/app/core/deps.py
def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    # Decodes server-signed JWT using secret key
    payload = decode_token(token)
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(401, "Invalid credentials or inactive account.")
    return user

def get_current_tenant_id(current_user: User = Depends(get_current_user)) -> str:
    # Privacy Firewall: Block platform admin from operational salon queries
    if current_user.role == UserRole.SUPER_ADMIN.value:
        raise HTTPException(403, "Privacy Firewall: Super Admin cannot access private salon data.")
    if not current_user.tenant_id:
        raise HTTPException(403, "User has no assigned salon tenant.")
    return current_user.tenant_id
```
* **Attack Vector Mitigated**: Client-side header tampering. If a user tampers with `X-Tenant-ID` in HTTP requests or proxies, the backend ignores it and binds strictly to `current_user.tenant_id` decoded from the cryptographically signed JWT.

#### Rule 2: Scoped Database Constraints
PostgreSQL enforces scoped unique indexes rather than global namespace collisions:
```sql
-- Allows independent salons to register customers with identical phone numbers
CREATE UNIQUE INDEX uq_customers_tenant_mobile ON salon.customers (tenant_id, mobile);

-- Allows staff accounts with identical names across different salons
CREATE UNIQUE INDEX uq_users_tenant_email ON salon.users (tenant_id, email) WHERE tenant_id IS NOT NULL;

-- Ensures platform super admin email is globally unique
CREATE UNIQUE INDEX uq_super_admin_email ON salon.users (email) WHERE tenant_id IS NULL;

-- Enforces unique branch names within a salon
CREATE UNIQUE INDEX uq_branches_tenant_name ON salon.branches (tenant_id, name);
```

#### Rule 3: Direct API Request Rejection (Object-Level Authorization)
Every API query, update, or delete checks both record ID and `tenant_id`:
```python
inv = db.query(Invoice).filter(
    Invoice.id == invoice_id, 
    Invoice.tenant_id == current_user.tenant_id
).first()
if not inv:
    raise HTTPException(status_code=404, detail="Invoice not found.")
```
If an operator at Salon A guesses or obtains an invoice ID from Salon B, the database query returns `None`, and the API responds with `404 Not Found`.

#### Rule 4: Super Admin Privacy Firewall
Cloud Technologies Super Admin manages subscription accounts, activates/suspends salons, and records verified payments. However, the Super Admin is **physically prohibited** by the backend dependency injection layer from accessing:
* `/api/v1/customers` (Customer profiles & mobile numbers)
* `/api/v1/pos/invoices` (Sales transactions & bills)
* `/api/v1/appointments` (Client schedules)
* `/api/v1/staff/{id}/commissions` (Stylist earnings & payout records)
* `/api/v1/reports` (Operating profit & expense breakdowns)

---

### 3. Role-Based Access Control (RBAC) Matrix

| User Role | Dashboard & POS | Appointments | Customer CRM | Service Prices | Staff Mgmt | Packages | Expenses & Reports | Platform Super Admin |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **SUPER_ADMIN** | ❌ (Blocked) | ❌ (Blocked) | ❌ (Blocked) | ❌ (Blocked) | ❌ (Blocked) | ❌ (Blocked) | ❌ (Blocked) | ✅ (Full) |
| **OWNER** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **MANAGER** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **RECEPTIONIST** | ✅ | ✅ | ✅ | View Only | View Only | Redemptions | View Only | ❌ |
| **CASHIER** | ✅ | View Only | View Only | View Only | ❌ | Redemptions | ❌ | ❌ |
| **BEAUTICIAN** | ❌ | My Schedule | View History | View Only | ❌ | ❌ | ❌ | ❌ |
| **INVENTORY_MGR**| ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Inventory Only | ❌ |

---

### 4. Verification & Automated Test Coverage
The multi-tenant security architecture is verified by `backend/tests/test_multi_tenancy.py` covering:
1. `test_super_admin_governance_and_privacy_firewall` (403 on operational access)
2. `test_salon_onboarding_and_isolation` (Clean empty environment for new tenants)
3. `test_cross_tenant_direct_id_attack` (404 on cross-tenant document requests)
4. `test_scoped_unique_customer_phone_number` (Concurrent identical phone numbers)
5. `test_professional_plan_feature_gates_and_limits` (403 on staff/branch/package violations)
6. `test_subscription_suspension_lifecycle` (Immediate 403 on suspended accounts)
7. `test_simple_non_gst_launch_billing_mode` (Zero tax leakage)
