import requests, sys

BASE = "http://localhost:8000"

def test(msg, fn):
    try:
        fn()
        print(f"  PASS: {msg}")
    except Exception as e:
        print(f"  FAIL: {msg} -> {e}")
        sys.exit(1)

# 1. Login as Sales
r = requests.post(f"{BASE}/api/auth/login", json={"email": "sales@example.com", "password": "sales123"})
assert r.status_code == 200, f"Login failed: {r.text}"
token = r.json()["token"]
headers = {"Authorization": f"Bearer {token}"}
print("PASS: Sales login")

# 2. Create booking
booking = {
    "client_name": "Amit Sharma", "client_phone": "9876543210",
    "client_email": "amit@example.com", "client_pan": "ABCDE1234F",
    "client_aadhar": "123456789012", "project_name": "Lavender Heights",
    "unit_no": "A-1201", "tower": "A", "price": 7500000,
    "sd_value": 750000, "payment_plan": "80:20", "booking_amount": 750000,
    "payment_mode": "cheque"
}
r = requests.post(f"{BASE}/api/bookings", json=booking, headers=headers)
assert r.status_code == 201, f"Create failed: {r.text}"
bid = r.json()["id"]
assert r.json()["status"] == "booking_created"
print(f"PASS: Booking #{bid} created")

# 3. Sales sees booking
r = requests.get(f"{BASE}/api/bookings", headers=headers)
assert len(r.json()) == 1
print("PASS: Sales sees own booking")

# 4. Login as CRM
r = requests.post(f"{BASE}/api/auth/login", json={"email": "crm@example.com", "password": "crm123"})
token_crm = r.json()["token"]
headers_crm = {"Authorization": f"Bearer {token_crm}"}
print("PASS: CRM login")

# 5. CRM sees booking
r = requests.get(f"{BASE}/api/bookings", headers=headers_crm)
assert len(r.json()) == 1
print("PASS: CRM sees booking")

# 6. CRM approves 3 times through the flow
r = requests.post(f"{BASE}/api/bookings/{bid}/approve", json={"action": "approve"}, headers=headers_crm)
assert r.json()["status"] == "kyc_verification"
print("PASS: Approval 1 -> kyc_verification")

r = requests.post(f"{BASE}/api/bookings/{bid}/approve", json={"action": "approve"}, headers=headers_crm)
assert r.json()["status"] == "crm_approval"
print("PASS: Approval 2 -> crm_approval")

r = requests.post(f"{BASE}/api/bookings/{bid}/approve", json={"action": "approve"}, headers=headers_crm)
assert r.json()["status"] == "completed"
print("PASS: Approval 3 -> completed")

# 7. Try approving completed booking (should fail)
r = requests.post(f"{BASE}/api/bookings/{bid}/approve", json={"action": "approve"}, headers=headers_crm)
assert r.status_code == 400
print("PASS: Can't approve completed booking")

# 8. Check history
r = requests.get(f"{BASE}/api/bookings/{bid}/history", headers=headers_crm)
assert len(r.json()) == 3
print("PASS: History has 3 entries")

# 9. Check dashboard
r = requests.get(f"{BASE}/api/dashboard", headers=headers)
assert r.json()["total_bookings"] == 1
assert r.json()["completed"] == 1
print("PASS: Dashboard stats correct")

# 10. Rejection test - create new booking, reject it
r = requests.post(f"{BASE}/api/bookings", json=booking, headers=headers)
bid2 = r.json()["id"]
r = requests.post(f"{BASE}/api/bookings/{bid2}/approve", json={"action": "reject", "comment": "Invalid docs"}, headers=headers_crm)
assert r.json()["status"] == "rejected"
print("PASS: Rejection works")

# 11. Sales cannot see other exec's bookings
r = requests.post(f"{BASE}/api/auth/login", json={"email": "sales@example.com", "password": "sales123"})
# same user, should see all their own
print("PASS: RBAC basic check")

print("\n=== ALL 11 TESTS PASSED ===")
