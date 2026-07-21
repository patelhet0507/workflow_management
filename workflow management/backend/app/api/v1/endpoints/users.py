from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.user import User, Role
from app.schemas.user import UserResponse, RoleCreate, RoleResponse, UserCreate
from app.core.security import hash_password

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=list[UserResponse])
async def list_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.is_deleted == False))
    return result.scalars().all()


@router.post("", response_model=UserResponse)
async def create_user(req: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Email already exists")
    user = User(
        email=req.email,
        password_hash=hash_password(req.password) if req.password else None,
        full_name=req.full_name,
        phone=req.phone,
        role_id=req.role_id,
        department=req.department,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


@router.get("/roles", response_model=list[RoleResponse])
async def list_roles(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Role))
    return result.scalars().all()


@router.post("/roles", response_model=RoleResponse)
async def create_role(req: RoleCreate, db: AsyncSession = Depends(get_db)):
    role = Role(name=req.name, description=req.description)
    db.add(role)
    await db.flush()
    await db.refresh(role)
    return role
