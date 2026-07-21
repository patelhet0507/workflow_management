from main import app
from fastapi.testclient import TestClient

client = TestClient(app)

r = client.post("/api/auth/login", json={"email": "sales@example.com", "password": "sales123"})
print(f"Status: {r.status_code}")
print(f"Response: {r.text}")
print(f"Headers: {r.headers}")
