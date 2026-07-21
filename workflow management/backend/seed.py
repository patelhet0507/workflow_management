from database import SessionLocal, engine, Base
from models import User
from auth import hash_password

Base.metadata.create_all(bind=engine)

db = SessionLocal()

users = [
    {"email": "admin@example.com", "name": "Super Admin", "password": "admin123", "role": "super_admin"},
    {"email": "sales@example.com", "name": "Rahul Sales", "password": "sales123", "role": "sales_exec"},
    {"email": "crm@example.com", "name": "Priya CRM", "password": "crm123", "role": "crm"},
    {"email": "mgmt@example.com", "name": "Anita Management", "password": "mgmt123", "role": "management"},
    {"email": "finance@example.com", "name": "Vikas Finance", "password": "finance123", "role": "finance"},
]

for u in users:
    existing = db.query(User).filter(User.email == u["email"]).first()
    if not existing:
        db.add(User(
            email=u["email"],
            name=u["name"],
            hashed_password=hash_password(u["password"]),
            role=u["role"],
        ))

db.commit()
db.close()
print("Seeded users:")
for u in users:
    print(f"  {u['email']} / {u['password']}  -> {u['role']}")
