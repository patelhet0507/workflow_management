import requests

BASE = "http://localhost:8000"

# Login as Sales
r = requests.post(f"{BASE}/api/auth/login", json={"email": "sales@example.com", "password": "sales123"})
token = r.json()["token"]
headers = {"Authorization": f"Bearer {token}"}

# Create booking
booking = {
    "client_name": "Amit Sharma", "client_phone": "9876543210",
    "client_email": "amit@example.com", "client_pan": "ABCDE1234F",
    "client_aadhar": "123456789012", "project_name": "Lavender Heights",
    "unit_no": "A-1201", "tower": "A", "price": 7500000,
    "sd_value": 750000, "payment_plan": "80:20", "booking_amount": 750000,
    "payment_mode": "cheque"
}
r = requests.post(f"{BASE}/api/bookings", json=booking, headers=headers)
bid = r.json()["id"]
print(f"Created booking #{bid} -> status: {r.json()['status']}")

# Sales dashboard
r = requests.get(f"{BASE}/api/dashboard", headers=headers)
print(f"Sales dashboard: {r.json()}")

# Login as CRM
r = requests.post(f"{BASE}/api/auth/login", json={"email": "crm@example.com", "password": "crm123"})
token_crm = r.json()["token"]
headers_crm = {"Authorization": f"Bearer {token_crm}"}

# CRM approves 3 times (booking_created -> kyc -> crm_approval -> completed)
for i in range(3):
    r = requests.post(f"{BASE}/api/bookings/{bid}/approve", json={"action": "approve"}, headers=headers_crm)
    print(f"Approval {i+1}: {r.json()['status']}")

# History
r = requests.get(f"{BASE}/api/bookings/{bid}/history", headers=headers_crm)
print("Approval history:")
for h in r.json():
    print(f"  {h['user_name']} - {h['action']} - {h['stage']}")

print("\n=== Full flow works! ===")
