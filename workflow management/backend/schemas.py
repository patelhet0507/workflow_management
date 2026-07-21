from pydantic import BaseModel, EmailStr
from typing import Optional


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    role: str

    model_config = {"from_attributes": True}


class BookingCreate(BaseModel):
    client_name: str
    client_phone: str
    client_email: Optional[str] = None
    client_pan: Optional[str] = None
    client_aadhar: Optional[str] = None
    client_address: Optional[str] = None
    client_occupation: Optional[str] = None
    client_nationality: Optional[str] = None
    project_name: str
    tower: Optional[str] = None
    floor_no: Optional[str] = None
    unit_no: str
    property_type: Optional[str] = None
    area: Optional[float] = None
    price: Optional[float] = None
    sd_value: Optional[float] = None
    payment_plan: Optional[str] = None
    booking_source: Optional[str] = None
    reference: Optional[str] = None
    booking_amount: Optional[float] = None
    payment_mode: Optional[str] = None
    transaction_id: Optional[str] = None
    bank_name: Optional[str] = None


class BookingOut(BaseModel):
    id: int
    client_name: str
    client_phone: str
    client_email: Optional[str] = None
    client_pan: Optional[str] = None
    client_aadhar: Optional[str] = None
    client_address: Optional[str] = None
    client_occupation: Optional[str] = None
    client_nationality: Optional[str] = None
    project_name: str
    tower: Optional[str] = None
    floor_no: Optional[str] = None
    unit_no: str
    property_type: Optional[str] = None
    area: Optional[float] = None
    price: Optional[float] = None
    sd_value: Optional[float] = None
    payment_plan: Optional[str] = None
    booking_source: Optional[str] = None
    reference: Optional[str] = None
    booking_amount: Optional[float] = None
    payment_mode: Optional[str] = None
    transaction_id: Optional[str] = None
    bank_name: Optional[str] = None
    status: str
    remarks: Optional[str] = None
    sales_exec_id: int
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class ApprovalActionOut(BaseModel):
    id: int
    booking_id: int
    user_id: int
    user_name: Optional[str] = None
    action: str
    stage: str
    comment: Optional[str] = None
    created_at: str

    model_config = {"from_attributes": True}


class ApprovalRequest(BaseModel):
    action: str  # approve / reject / request_changes
    comment: Optional[str] = None
