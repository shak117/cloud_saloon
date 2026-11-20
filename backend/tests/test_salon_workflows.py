import pytest
from decimal import Decimal
from datetime import date, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.services.demo_seeder import seed_demo_tenant
from app.models.product import Product

client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    db = SessionLocal()
    from app.models.appointment import Appointment
    # Refresh appointments to today's date across midnight runs
    db.query(Appointment).filter(Appointment.tenant_id == "sk-relax-satara").delete()
    db.commit()
    seed_demo_tenant(db, "sk-relax-satara")
    db.close()

@pytest.fixture(scope="session")
def auth_headers():
    res = client.post("/api/v1/auth/login", json={
        "email": "salma@skrelax.com",
        "password": "Salma@2026",
        "tenant_id": "sk-relax-satara"
    })
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_health_check():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "service" in data

def test_auth_login():
    res = client.post("/api/v1/auth/login", json={
        "email": "salma@skrelax.com",
        "password": "Salma@2026",
        "tenant_id": "sk-relax-satara"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["full_name"] == "Salma Attar"
    assert data["user"]["role"] in ("SALON_OWNER", "OWNER")

def test_dashboard_summary(auth_headers):
    res = client.get("/api/v1/dashboard/summary?range_type=today", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "kpis" in data
    assert "revenue_trends" in data
    assert "service_breakdown" in data
    assert "staff_performance" in data
    assert data["kpis"]["today_appointments"] >= 1

def test_staff_conflict_detection(auth_headers):
    today = date.today().isoformat()
    staff_res = client.get("/api/v1/staff", headers=auth_headers)
    assert staff_res.status_code == 200
    pooja = next(s for s in staff_res.json() if s["name"] == "Pooja Shinde")
    
    conflict_res = client.post("/api/v1/appointments/check-conflict", json={
        "staff_id": pooja["id"],
        "appointment_date": today,
        "start_time": "14:30",
        "end_time": "15:00"
    }, headers=auth_headers)
    
    assert conflict_res.status_code == 200
    assert conflict_res.json()["conflict"] == True

def test_b2c_pos_checkout_flow(auth_headers):
    # 1. Fetch a service & retail product
    services = client.get("/api/v1/services", headers=auth_headers).json()
    haircut = next(s for s in services if "Haircut" in s["name"])
    
    products = client.get("/api/v1/inventory/products?product_type=RETAIL", headers=auth_headers).json()
    shampoo = products[0]
    
    staff_members = client.get("/api/v1/staff", headers=auth_headers).json()
    stylist = staff_members[0]

    initial_stock = shampoo["current_stock"]

    # 2. Checkout walk-in customer with split UPI & Cash (Simple Non-GST Launch Mode)
    checkout_payload = {
        "invoice_type": "B2C",
        "customer_name": "Walk-in Guest Test",
        "customer_phone": "+91 9988776655",
        "discount_amount": 0.0,
        "items": [
            {
                "item_type": "SERVICE",
                "service_id": haircut["id"],
                "staff_id": stylist["id"],
                "item_name": haircut["name"],
                "quantity": 1.0,
                "unit_price": float(haircut["price"]),
                "discount": 0.0,
                "gst_rate": float(haircut["gst_rate"])
            },
            {
                "item_type": "PRODUCT",
                "product_id": shampoo["id"],
                "staff_id": stylist["id"],
                "item_name": shampoo["name"],
                "quantity": 1.0,
                "unit_price": float(shampoo["retail_price"]),
                "discount": 0.0,
                "gst_rate": float(shampoo["gst_rate"])
            }
        ],
        "payments": [
            {
                "amount": float(haircut["price"]),
                "payment_method": "UPI",
                "transaction_reference": "UPI/TEST/001"
            },
            {
                "amount": float(shampoo["retail_price"]),
                "payment_method": "CASH"
            }
        ]
    }

    res = client.post("/api/v1/pos/checkout", json=checkout_payload, headers=auth_headers)
    assert res.status_code == 200
    inv = res.json()
    assert inv["payment_status"] == "PAID"
    assert len(inv["items"]) == 2
    assert len(inv["payments"]) == 2
    
    # Verify non-GST launch mode: taxes are 0.00
    assert float(inv["cgst_amount"]) == 0.0
    assert float(inv["sgst_amount"]) == 0.0

    # Verify retail stock was decremented
    updated_products = client.get("/api/v1/inventory/products?product_type=RETAIL", headers=auth_headers).json()
    updated_shampoo = next(p for p in updated_products if p["id"] == shampoo["id"])
    assert float(updated_shampoo["current_stock"]) == float(initial_stock) - 1.0

    # 3. Verify PDF generation
    pdf_res = client.get(f"/api/v1/pos/invoices/{inv['id']}/pdf", headers=auth_headers)
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert len(pdf_res.content) > 1000

    # 4. Verify Thermal receipt generation
    thermal_res = client.get(f"/api/v1/pos/invoices/{inv['id']}/thermal", headers=auth_headers)
    assert thermal_res.status_code == 200
    assert thermal_res.headers["content-type"] == "application/pdf"
    assert len(thermal_res.content) > 500

def test_package_purchase_and_redemption(auth_headers):
    # Fetch a customer and a package
    cust = client.get("/api/v1/customers", headers=auth_headers).json()[0]
    packages = client.get("/api/v1/packages", headers=auth_headers).json()
    pkg = packages[0]

    # Purchase package
    purchase_res = client.post("/api/v1/packages/purchase", json={
        "customer_id": cust["id"],
        "package_id": pkg["id"],
        "payment_method": "UPI",
        "transaction_reference": "UPI/PKG/TEST"
    }, headers=auth_headers)
    assert purchase_res.status_code == 200
    cp_id = purchase_res.json()["customer_package_id"]

    # Redeem 1 session
    services = client.get("/api/v1/services", headers=auth_headers).json()
    redeem_res = client.post("/api/v1/packages/redeem", json={
        "customer_package_id": cp_id,
        "service_id": services[0]["id"]
    }, headers=auth_headers)
    assert redeem_res.status_code == 200
    assert redeem_res.json()["remaining_sessions"] == pkg["total_sessions"] - 1
    assert redeem_res.json()["used_sessions"] == 1
