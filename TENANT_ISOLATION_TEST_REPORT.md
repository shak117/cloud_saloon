# Cloud Salon – Tenant Isolation & Multi-Tenancy Test Report
**Testing Framework:** `pytest` (with `TestClient` and `SQLAlchemy`)  
**Database:** PostgreSQL 18 (`cloud_billing`), Schema: `salon`  
**Execution Date:** November 16, 2026  
**Result:** 13 Passed, 0 Failed (100% Pass Rate)  
**Execution Time:** 11.57 seconds  

---

## 1. Test Execution Summary

The Cloud Salon multi-tenant test suite rigorously tests security boundaries, privacy firewalls, cross-tenant attack resilience, subscription lifecycles, and salon operational workflows.

```text
============================= test session starts =============================
platform win32 -- Python 3.11.9, pytest-8.3.3, pluggy-1.7.0
rootdir: C:\Users\Admin1\OneDrive\Desktop\cloud saloon
configfile: pytest.ini
testpaths: backend/tests
collected 13 items

backend/tests/test_multi_tenancy.py::test_super_admin_governance_and_privacy_firewall PASSED [  7%]
backend/tests/test_multi_tenancy.py::test_salon_onboarding_and_isolation PASSED [ 15%]
backend/tests/test_multi_tenancy.py::test_cross_tenant_direct_id_attack PASSED [ 23%]
backend/tests/test_multi_tenancy.py::test_scoped_unique_customer_phone_number PASSED [ 30%]
backend/tests/test_multi_tenancy.py::test_professional_plan_feature_gates_and_limits PASSED [ 38%]
backend/tests/test_multi_tenancy.py::test_subscription_suspension_lifecycle PASSED [ 46%]
backend/tests/test_multi_tenancy.py::test_simple_non_gst_launch_billing_mode PASSED [ 53%]
backend/tests/test_salon_workflows.py::test_health_check PASSED          [ 61%]
backend/tests/test_salon_workflows.py::test_auth_login PASSED            [ 69%]
backend/tests/test_salon_workflows.py::test_dashboard_summary PASSED     [ 76%]
backend/tests/test_salon_workflows.py::test_staff_conflict_detection PASSED [ 84%]
backend/tests/test_salon_workflows.py::test_b2c_pos_checkout_flow PASSED [ 92%]
backend/tests/test_salon_workflows.py::test_package_purchase_and_redemption PASSED [100%]

====================== 13 passed, 17 warnings in 11.57s =======================
```

---

## 2. Detailed Test Case Analysis

### Test 1: Super Admin Governance & Privacy Firewall
- **File:** `test_multi_tenancy.py::test_super_admin_governance_and_privacy_firewall`
- **Objective:** Verify that Cloud Technologies Super Admin can access platform metrics and tenant lists, but is blocked from directly reading or modifying salon operational records.
- **Assertion:** Super Admin accessing `/api/v1/invoices` without tenant scoping is rejected with HTTP `403 Forbidden`.

### Test 2: Salon Onboarding & Data Isolation
- **File:** `test_multi_tenancy.py::test_salon_onboarding_and_isolation`
- **Objective:** Onboard a new tenant (`elegance-hair-studio`) under Plan A (Professional). Verify that Elegance Studio sees 0 records and cannot see SK Relax Studio's services, appointments, or customers.
- **Assertion:** Services list returns only newly created services; SK Relax records are strictly isolated.

### Test 3: Cross-Tenant Direct Object Reference (IDOR) Attack
- **File:** `test_multi_tenancy.py::test_cross_tenant_direct_id_attack`
- **Objective:** A malicious user authenticated as Tenant B directly requests an invoice ID belonging to Tenant A (`/api/v1/billing/invoices/{tenant_a_invoice_id}`).
- **Assertion:** Backend returns `404 Not Found` or `403 Forbidden`. The attacker is unable to confirm the existence of or view the other salon's invoice.

### Test 4: Scoped Unique Customer Phone Numbers
- **File:** `test_multi_tenancy.py::test_scoped_unique_customer_phone_number`
- **Objective:** Verify that two independent salons can register the exact same customer mobile number (`+91 9822334455`) without unique constraint violation.
- **Assertion:** Both customer records are created successfully with different `tenant_id`s.

### Test 5: Professional Plan Feature Gates & Limits
- **File:** `test_multi_tenancy.py::test_professional_plan_feature_gates_and_limits`
- **Objective:** Verify plan limit enforcement for Plan A (Professional):
  - 1 Branch location maximum.
  - 3 Staff accounts maximum.
- **Assertion:** Attempting to create a second branch or a 4th staff account is rejected with HTTP `403 Forbidden: Staff limit reached for your subscription plan`.

### Test 6: Subscription Suspension Lifecycle
- **File:** `test_multi_tenancy.py::test_subscription_suspension_lifecycle`
- **Objective:** Super Admin suspends a salon for non-payment.
- **Assertion:** The salon's login attempts return `403 Forbidden: Your salon subscription has been suspended`. Re-activation immediately restores access.

### Test 7: Simple Non-GST Launch Billing Mode
- **File:** `test_multi_tenancy.py::test_simple_non_gst_launch_billing_mode`
- **Objective:** Verifies that when a salon operates in non-GST mode (`gst_enabled = False`), POS checkout generates clean invoices with ₹0.00 CGST and SGST and total amount matching the gross subtotal.
- **Assertion:** Total invoice amount equals ₹450.00 with ₹0.00 tax.

### Tests 8-13: Core Salon Workflows
- **Health Check:** API server operational, PostgreSQL schema connected.
- **Auth Login:** JWT access and refresh tokens returned with correct claims.
- **Dashboard Summary:** Aggregates today's revenue, customer counts, and staff leaderboard.
- **Staff Conflict Detection:** Accurately flags double-booking collisions for stylists at the same time slot.
- **B2C POS Checkout:** Automatically decrements inventory stock for retail items, creates invoice items, records split payments, and logs staff commissions.
- **Package Purchase & Redemption:** Debits prepaid session count and logs redemption timestamp.
