import pytest
from decimal import Decimal
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.services.demo_seeder import seed_demo_tenant
from app.models.tenant import Tenant
from app.models.user import User

client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def setup_tenants():
    db = SessionLocal()
    from app.models import Branch, Customer, Invoice, Subscription
    db.query(Subscription).filter(Subscription.salon_id.like("elegance%")).delete(synchronize_session=False)
    db.query(Branch).filter(Branch.tenant_id.like("elegance%")).delete(synchronize_session=False)
    db.query(Customer).filter(Customer.tenant_id.like("elegance%")).delete(synchronize_session=False)
    db.query(Invoice).filter(Invoice.tenant_id.like("elegance%")).delete(synchronize_session=False)
    db.query(User).filter(User.tenant_id.like("elegance%")).delete(synchronize_session=False)
    db.query(Tenant).filter(Tenant.id.like("elegance%")).delete(synchronize_session=False)
    db.commit()

    seed_demo_tenant(db, "sk-relax-satara")
    db.close()

@pytest.fixture
def super_admin_headers():
    res = client.post("/api/v1/auth/login", json={
        "email": "admin@cloudtechnologies.in",
        "password": "CloudAdmin@2026"
    })
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def salon1_headers():
    res = client.post("/api/v1/auth/login", json={
        "email": "salma@skrelax.com",
        "password": "Salma@2026",
        "tenant_id": "sk-relax-satara"
    })
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_super_admin_governance_and_privacy_firewall(super_admin_headers):
    """
    Verifies that Cloud Technologies Super Admin can manage the SaaS platform
    but is strictly BLOCKED by the Privacy Firewall from accessing private salon operational data.
    """
    # 1. Super Admin can view platform metrics
    metrics_res = client.get("/api/v1/super-admin/metrics", headers=super_admin_headers)
    assert metrics_res.status_code == 200
    metrics = metrics_res.json()
    assert metrics["total_salons"] >= 1
    assert "platform_health" in metrics

    # 2. Super Admin can list salons and their high-level tiers
    salons_res = client.get("/api/v1/super-admin/salons", headers=super_admin_headers)
    assert salons_res.status_code == 200
    assert len(salons_res.json()) >= 1

    # 3. PRIVACY FIREWALL TEST:
    # Super Admin attempts to access private salon customers
    cust_res = client.get("/api/v1/customers", headers=super_admin_headers)
    assert cust_res.status_code == 403
    assert "Privacy Firewall" in cust_res.json()["detail"]

    # Super Admin attempts to access private salon invoices
    inv_res = client.get("/api/v1/pos/invoices", headers=super_admin_headers)
    assert inv_res.status_code == 403
    assert "Privacy Firewall" in inv_res.json()["detail"]

def test_salon_onboarding_and_isolation(super_admin_headers):
    """
    Tests registering a new salon tenant through Super Admin and verifies strict tenant isolation.
    """
    # Register Salon 2: Elegance Studio Pune under Professional plan
    reg_payload = {
        "salon_name": "Elegance Hair Studio",
        "owner_name": "Rahul Deshmukh",
        "owner_email": "rahul@elegancehairstudio.com",
        "owner_phone": "+91 9822334455",
        "owner_password": "ElegancePass@2026",
        "plan_id": "plan-professional",
        "is_trial": True,
        "city": "Pune",
        "state": "Maharashtra",
        "address": "FC Road, Deccan"
    }

    reg_res = client.post("/api/v1/super-admin/salons", json=reg_payload, headers=super_admin_headers)
    assert reg_res.status_code == 200
    new_tenant_id = reg_res.json()["tenant_id"]

    # Login as Salon 2 owner
    login_res = client.post("/api/v1/auth/login", json={
        "email": "rahul@elegancehairstudio.com",
        "password": "ElegancePass@2026"
    })
    assert login_res.status_code == 200
    salon2_token = login_res.json()["access_token"]
    salon2_headers = {"Authorization": f"Bearer {salon2_token}"}

    # Verify Salon 2 environment is clean and sees ZERO records from SK Relax Studio
    customers_res = client.get("/api/v1/customers", headers=salon2_headers)
    assert customers_res.status_code == 200
    assert len(customers_res.json()) == 0  # Completely empty / isolated!

    invoices_res = client.get("/api/v1/pos/invoices", headers=salon2_headers)
    assert invoices_res.status_code == 200
    assert len(invoices_res.json()) == 0  # Completely empty / isolated!

def test_cross_tenant_direct_id_attack(salon1_headers, super_admin_headers):
    """
    Tests that a salon user cannot access another salon's records by guessing/supplying their ID.
    """
    # Fetch Salon 1's invoice ID
    salon1_invoices = client.get("/api/v1/pos/invoices", headers=salon1_headers).json()
    assert len(salon1_invoices) > 0
    target_invoice_id = salon1_invoices[0]["id"]

    # Login as Salon 2 (Elegance)
    login_res = client.post("/api/v1/auth/login", json={
        "email": "rahul@elegancehairstudio.com",
        "password": "ElegancePass@2026"
    })
    assert login_res.status_code == 200
    salon2_token = login_res.json()["access_token"]
    salon2_headers = {"Authorization": f"Bearer {salon2_token}"}

    # Salon 2 directly requests Salon 1's invoice
    attack_res = client.get(f"/api/v1/pos/invoices/{target_invoice_id}", headers=salon2_headers)
    assert attack_res.status_code == 404  # Rejected! Not found in Salon 2's tenant scope

    # Salon 2 directly requests Salon 1's invoice PDF
    attack_pdf_res = client.get(f"/api/v1/pos/invoices/{target_invoice_id}/pdf", headers=salon2_headers)
    assert attack_pdf_res.status_code == 404

def test_scoped_unique_customer_phone_number(salon1_headers):
    """
    Verifies that two different salons can have customers with the identical phone number,
    but a single salon cannot duplicate customer phone numbers.
    """
    phone = "+91 9777888999"

    # Salon 1 creates customer with phone
    c1_res = client.post("/api/v1/customers", json={
        "full_name": "Neha Joshi",
        "mobile": phone
    }, headers=salon1_headers)
    assert c1_res.status_code in (200, 400)

    # Salon 2 logs in and creates customer with the SAME phone
    login_res = client.post("/api/v1/auth/login", json={
        "email": "rahul@elegancehairstudio.com",
        "password": "ElegancePass@2026"
    })
    assert login_res.status_code == 200
    salon2_headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

    c2_res = client.post("/api/v1/customers", json={
        "full_name": "Neha Joshi Pune",
        "mobile": phone
    }, headers=salon2_headers)
    assert c2_res.status_code == 200
    assert c2_res.json()["mobile"] == phone

    # Duplicate creation within the same salon is rejected
    c2_dup_res = client.post("/api/v1/customers", json={
        "full_name": "Duplicate Contact",
        "mobile": phone
    }, headers=salon2_headers)
    assert c2_dup_res.status_code == 400

def test_professional_plan_feature_gates_and_limits():
    """
    Verifies that the Professional Plan enforces:
    - Maximum 3 staff accounts (excluding owner)
    - 1 branch limit
    - Blocking access to Business-only features (packages) with upgrade prompts
    """
    login_res = client.post("/api/v1/auth/login", json={
        "email": "rahul@elegancehairstudio.com",
        "password": "ElegancePass@2026"
    })
    assert login_res.status_code == 200
    salon2_headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

    # Ensure clean staff state for limit testing
    db = SessionLocal()
    db.query(User).filter(User.tenant_id == "elegance-hair-studio", User.email.like("staff%")).delete(synchronize_session=False)
    db.commit()
    db.close()

    # 1. Add staff up to limit (3 staff accounts)
    for i in range(1, 4):
        s_res = client.post("/api/v1/auth/users", json={
            "full_name": f"Staff Member {i}",
            "email": f"staff{i}@elegancehairstudio.com",
            "password": "StaffPass@2026",
            "role": "BEAUTICIAN"
        }, headers=salon2_headers)
        assert s_res.status_code == 200

    # 2. Attempting to add a 4th staff account is blocked by backend
    blocked_staff = client.post("/api/v1/auth/users", json={
        "full_name": "Staff Member 4",
        "email": "staff4@elegancehairstudio.com",
        "password": "StaffPass@2026",
        "role": "BEAUTICIAN"
    }, headers=salon2_headers)
    assert blocked_staff.status_code == 403
    assert "Staff limit reached" in blocked_staff.json()["detail"]
    assert "Upgrade to Cloud Salon Business" in blocked_staff.json()["detail"]

    # 3. Attempting to create a branch is blocked for Professional (multi_branch is Business-only)
    branch_res = client.post("/api/v1/branches", json={
        "name": "Elegance Branch 2",
        "city": "Pune"
    }, headers=salon2_headers)
    assert branch_res.status_code == 403
    assert "Multi Branch is available exclusively in Cloud Salon Business" in branch_res.json()["detail"]

    # 4. Attempting to create a package is blocked for Professional (packages is Business-only)
    pkg_res = client.post("/api/v1/packages", json={
        "name": "10 Session Bridal Glow",
        "price": 8000.0,
        "total_sessions": 10,
        "validity_days": 180
    }, headers=salon2_headers)
    assert pkg_res.status_code == 403
    assert "Packages is available exclusively in Cloud Salon Business" in pkg_res.json()["detail"]

def test_subscription_suspension_lifecycle(super_admin_headers):
    """
    Verifies that suspended accounts are immediately blocked from operational actions and login,
    and reactivated accounts can resume operations.
    """
    db = SessionLocal()
    tenant = db.query(Tenant).filter(Tenant.name == "Elegance Hair Studio").first()
    salon2_id = tenant.id
    db.close()

    # 1. Grab token before suspension
    pre_login = client.post("/api/v1/auth/login", json={
        "email": "rahul@elegancehairstudio.com",
        "password": "ElegancePass@2026"
    })
    assert pre_login.status_code == 200
    pre_token = pre_login.json()["access_token"]
    pre_headers = {"Authorization": f"Bearer {pre_token}"}

    # 2. Super Admin suspends the salon
    susp_res = client.post(f"/api/v1/super-admin/salons/{salon2_id}/status", json={
        "status": "SUSPENDED",
        "reason": "Subscription grace period lapsed"
    }, headers=super_admin_headers)
    assert susp_res.status_code == 200

    # 3. Salon 2 attempts to perform POS checkout while suspended -> Blocked with 403
    checkout_res = client.post("/api/v1/pos/checkout", json={
        "items": [{"item_type": "SERVICE", "item_name": "Haircut", "unit_price": 300.0, "quantity": 1.0}],
        "payments": [{"amount": 300.0, "payment_method": "CASH"}]
    }, headers=pre_headers)
    assert checkout_res.status_code == 403
    assert any(term in checkout_res.json()["detail"].lower() for term in ("suspended", "deactivated"))

    # 4. Salon 2 attempts to login while suspended -> Blocked with 403
    login_suspended = client.post("/api/v1/auth/login", json={
        "email": "rahul@elegancehairstudio.com",
        "password": "ElegancePass@2026"
    })
    assert login_suspended.status_code == 403

    # 5. Super Admin records verified payment and reactivates the salon
    pay_res = client.post("/api/v1/super-admin/subscriptions/payment", json={
        "salon_id": salon2_id,
        "plan_id": "plan-professional",
        "amount": 999.0,
        "billing_cycle": "MONTHLY",
        "payment_reference": "UPI/RENEWAL/20261115",
        "duration_months": 1
    }, headers=super_admin_headers)
    assert pay_res.status_code == 200

    # 6. Salon 2 can now login again and checkout successfully
    post_login = client.post("/api/v1/auth/login", json={
        "email": "rahul@elegancehairstudio.com",
        "password": "ElegancePass@2026"
    })
    assert post_login.status_code == 200
    new_headers = {"Authorization": f"Bearer {post_login.json()['access_token']}"}

    checkout_res2 = client.post("/api/v1/pos/checkout", json={
        "items": [{"item_type": "SERVICE", "item_name": "Haircut", "unit_price": 300.0, "quantity": 1.0}],
        "payments": [{"amount": 300.0, "payment_method": "CASH"}]
    }, headers=new_headers)
    assert checkout_res2.status_code == 200
    assert checkout_res2.json()["payment_status"] == "PAID"

def test_simple_non_gst_launch_billing_mode():
    """
    Verifies that the default launch billing mode computes simple non-GST invoices:
    Services + Products - Discount = Net Total.
    Taxes are 0.00 and no GSTIN is required.
    """
    login_res = client.post("/api/v1/auth/login", json={
        "email": "rahul@elegancehairstudio.com",
        "password": "ElegancePass@2026"
    })
    assert login_res.status_code == 200
    headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

    # Example:
    # Haircut: ₹300, Facial: ₹800, Product: ₹400, Discount: ₹100 -> Final amount: ₹1,400
    # Customer pays ₹1,000 partial, ₹400 balance
    checkout_payload = {
        "invoice_type": "B2C",
        "customer_name": "Walk-in Guest",
        "customer_phone": "+91 9888877777",
        "discount_amount": 0.0,
        "items": [
            {"item_type": "SERVICE", "item_name": "Haircut", "unit_price": 300.0, "quantity": 1.0, "discount": 0.0},
            {"item_type": "SERVICE", "item_name": "Facial", "unit_price": 800.0, "quantity": 1.0, "discount": 0.0},
            {"item_type": "PRODUCT", "item_name": "Shampoo", "unit_price": 400.0, "quantity": 1.0, "discount": 100.0}
        ],
        "payments": [
            {"amount": 1000.0, "payment_method": "UPI", "transaction_reference": "UPI/GUEST/1000"}
        ]
    }

    res = client.post("/api/v1/pos/checkout", json=checkout_payload, headers=headers)
    assert res.status_code == 200
    inv = res.json()

    # Total must be exactly ₹1,400.00
    assert float(inv["subtotal"]) == 1500.0
    assert float(inv["total_amount"]) == 1400.0
    assert float(inv["paid_amount"]) == 1000.0
    assert float(inv["balance_amount"]) == 400.0
    assert inv["payment_status"] == "PARTIAL"

    # Strictly NO GST in default launch mode
    assert float(inv["cgst_amount"]) == 0.0
    assert float(inv["sgst_amount"]) == 0.0
    assert float(inv["igst_amount"]) == 0.0
