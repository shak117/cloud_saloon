import requests
import json
import sys

BASE_URL = "http://127.0.0.1:5174/api/v1"

def run_tests():
    print("=" * 60)
    print("  CLOUD SALON - COMPLETE AUTHENTICATION FLOW VERIFICATION")
    print("=" * 60)
    
    results = {}

    # TEST 1: Valid SK Relax owner login
    print("\n[TEST 1] Valid SK Relax Owner Login (salma@skrelax.com)...")
    res1 = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "salma@skrelax.com",
        "password": "Salma@2026"
    })
    print(f"Status: {res1.status_code}")
    data1 = res1.json()
    assert res1.status_code == 200, f"Expected 200, got {res1.status_code}"
    assert "access_token" in data1, "Missing access_token"
    assert data1["user"]["email"] == "salma@skrelax.com"
    assert data1["user"]["role"] == "SALON_OWNER", f"Expected SALON_OWNER, got {data1['user']['role']}"
    assert data1["user"]["tenant_id"] == "sk-relax-satara"
    assert data1["user"]["is_active"] == True
    print(f"  ✓ Authenticated as {data1['user']['full_name']} (Role: {data1['user']['role']}, Tenant: {data1['user']['tenant_id']})")
    results["Test 1: Valid SK Relax Owner Login"] = "PASSED"
    salma_token = data1["access_token"]

    # TEST 2: Invalid password
    print("\n[TEST 2] Invalid Password Rejection...")
    res2 = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "salma@skrelax.com",
        "password": "WrongPassword@999"
    })
    print(f"Status: {res2.status_code}")
    data2 = res2.json()
    assert res2.status_code == 401, f"Expected 401, got {res2.status_code}"
    assert data2.get("detail") == "Invalid email or password.", f"Unexpected detail: {data2.get('detail')}"
    print(f"  ✓ Correctly rejected with 401: '{data2.get('detail')}'")
    results["Test 2: Invalid Password"] = "PASSED"

    # TEST 3: Non-existent email
    print("\n[TEST 3] Non-Existent Email Rejection...")
    res3 = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "ghost_user@doesnotexist.com",
        "password": "Password@123"
    })
    print(f"Status: {res3.status_code}")
    data3 = res3.json()
    assert res3.status_code == 401, f"Expected 401, got {res3.status_code}"
    assert data3.get("detail") == "Invalid email or password.", f"Unexpected detail: {data3.get('detail')}"
    print(f"  ✓ Correctly rejected with 401: '{data3.get('detail')}'")
    results["Test 3: Non-Existent Email"] = "PASSED"

    # TEST 4: Super Admin login
    print("\n[TEST 4] Super Admin Login (admin@cloudtechnologies.in)...")
    res4 = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@cloudtechnologies.in",
        "password": "CloudAdmin@2026"
    })
    print(f"Status: {res4.status_code}")
    data4 = res4.json()
    assert res4.status_code == 200, f"Expected 200, got {res4.status_code}"
    assert "access_token" in data4
    assert data4["user"]["email"] == "admin@cloudtechnologies.in"
    assert data4["user"]["role"] == "PLATFORM_SUPER_ADMIN", f"Expected PLATFORM_SUPER_ADMIN, got {data4['user']['role']}"
    assert data4["user"]["tenant_id"] is None
    print(f"  ✓ Authenticated as {data4['user']['full_name']} (Role: {data4['user']['role']}, Tenant: None)")
    results["Test 4: Super Admin Login"] = "PASSED"
    admin_token = data4["access_token"]

    # TEST 5: Salon owner access to salon workspace APIs (/app)
    print("\n[TEST 5] Salon Owner Access to Salon Workspace APIs...")
    res5 = requests.get(
        f"{BASE_URL}/dashboard/summary?range_type=today",
        headers={"Authorization": f"Bearer {salma_token}"}
    )
    print(f"Status: {res5.status_code}")
    assert res5.status_code == 200, f"Expected 200, got {res5.status_code}"
    dash_data = res5.json()
    assert "kpis" in dash_data
    print(f"  ✓ Successfully accessed salon dashboard. Today's appointments: {dash_data['kpis'].get('today_appointments')}")
    results["Test 5: Salon Owner Access to /app"] = "PASSED"

    # TEST 6: Salon owner rejection from platform-admin APIs
    print("\n[TEST 6] Salon Owner Rejection from Platform Admin APIs...")
    res6 = requests.get(
        f"{BASE_URL}/super-admin/salons",
        headers={"Authorization": f"Bearer {salma_token}"}
    )
    print(f"Status: {res6.status_code}")
    data6 = res6.json()
    assert res6.status_code == 403, f"Expected 403 Forbidden, got {res6.status_code}"
    print(f"  ✓ Blocked with 403: {data6.get('detail')}")
    results["Test 6: Salon Owner Rejection from /platform-admin"] = "PASSED"

    # TEST 7: Super Admin access to platform-admin APIs
    print("\n[TEST 7] Super Admin Access to Platform Admin APIs...")
    res7 = requests.get(
        f"{BASE_URL}/super-admin/salons",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    print(f"Status: {res7.status_code}")
    assert res7.status_code == 200, f"Expected 200, got {res7.status_code}"
    salons_list = res7.json()
    assert isinstance(salons_list, list)
    print(f"  ✓ Super Admin access granted. Total registered salons: {len(salons_list)}")
    results["Test 7: Super Admin Access to /platform-admin"] = "PASSED"

    print("\n" + "=" * 60)
    print("  ALL 7 TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)
    for test_name, status in results.items():
        print(f"  {test_name}: {status}")

if __name__ == "__main__":
    run_tests()
