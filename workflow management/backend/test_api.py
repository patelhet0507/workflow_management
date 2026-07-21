import requests

try:
    r = requests.post("http://localhost:8000/api/auth/login", json={"email": "sales@example.com", "password": "sales123"})
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text}")
except Exception as e:
    print(f"Error: {e}")
