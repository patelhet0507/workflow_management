from datetime import datetime
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    email: EmailStr
    password: str | None = None
    full_name: str
    phone: str | None = None
    role_id: str
    department: str | None = None


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: str | None = None
    avatar_url: str | None = None
    is_active: bool
    role_id: str
    department: str | None = None
    digital_signature: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class RoleCreate(BaseModel):
    name: str
    description: str | None = None
    permissions: list[str] = []


class RoleResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
    permissions: list[str] = []

    class Config:
        from_attributes = True
