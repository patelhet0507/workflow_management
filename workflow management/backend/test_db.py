from database import init_db, get_db
from models import User
from auth import verify_password

init_db()
db = next(get_db())
user = db.query(User).filter(User.email == 'sales@example.com').first()
print(f'User: {user.name}, role: {user.role}')
print(f'Verify: {verify_password("sales123", user.hashed_password)}')
