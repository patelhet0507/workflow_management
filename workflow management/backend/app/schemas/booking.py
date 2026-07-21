from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel


class ClientCreate(BaseModel):
    name: str
    phone: str
    email: str | None = None
    pan: str | None = None
    aadhar: str | None = None
    address: str | None = None
    occupation: str | None = None
    nationality: str | None = None


class ClientResponse(BaseModel):
    id: str
    name: str
    phone: str
    email: str | None = None
    pan: str | None = None
    aadhar: str | None = None

    class Config:
        from_attributes = True


class PaymentCreate(BaseModel):
    amount: Decimal
    payment_date: date
    payment_mode: str
    transaction_id: str | None = None
    bank_name: str | None = None


class BookingCreate(BaseModel):
    client: ClientCreate
    project_id: str
    tower_id: str
    unit_id: str
    booking_amount: Decimal | None = None
    payment_mode: str | None = None
    transaction_id: str | None = None
    bank_name: str | None = None
    payment_plan: str | None = None
    booking_source: str | None = None
    reference_by: str | None = None
    remarks: str | None = None
    onboarding_date: date | None = None
    client_confirmation_date: date | None = None


class BookingResponse(BaseModel):
    id: str
    booking_number: str
    client: ClientResponse
    status: str
    project_id: str
    booking_amount: Decimal | None = None
    payment_plan: str | None = None
    booking_source: str | None = None
    sales_executive_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class BookingListResponse(BaseModel):
    items: list[BookingResponse]
    total: int
    page: int
    size: int


class ApprovalActionRequest(BaseModel):
    action: str
    comments: str | None = None
    signature: str | None = None
