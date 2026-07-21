from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Boolean, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from database import Base
import enum


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    SALES_EXEC = "sales_exec"
    CRM = "crm"
    MANAGEMENT = "management"
    FINANCE = "finance"


class BookingStatus(str, enum.Enum):
    BOOKING_CREATED = "booking_created"
    SALES_CONFIRMATION = "sales_confirmation"
    MANAGEMENT_APPROVAL = "management_approval"
    KYC_VERIFICATION = "kyc_verification"
    CRM_APPROVAL = "crm_approval"
    ATS_APPROVAL = "ats_approval"
    SALE_DEED_APPROVAL = "sale_deed_approval"
    PRINT_REQUEST = "print_request"
    COMPLETED = "completed"
    REJECTED = "rejected"


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default=UserRole.SALES_EXEC.value)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    bookings = relationship("Booking", back_populates="sales_exec")
    approval_actions = relationship("ApprovalAction", back_populates="user")


class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    # Client details
    client_name = Column(String, nullable=False)
    client_phone = Column(String, nullable=False)
    client_email = Column(String)
    client_pan = Column(String)
    client_aadhar = Column(String)
    client_address = Column(Text)
    client_occupation = Column(String)
    client_nationality = Column(String)
    # Property details
    project_name = Column(String, nullable=False)
    tower = Column(String)
    floor_no = Column(String)
    unit_no = Column(String, nullable=False)
    property_type = Column(String)
    area = Column(Float)
    price = Column(Float)
    sd_value = Column(Float)
    payment_plan = Column(String)
    booking_source = Column(String)
    reference = Column(String)
    # Payment details
    booking_amount = Column(Float)
    payment_mode = Column(String)
    transaction_id = Column(String)
    bank_name = Column(String)
    # Status
    status = Column(String, default=BookingStatus.BOOKING_CREATED.value)
    remarks = Column(Text)
    # FK
    sales_exec_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    is_deleted = Column(Boolean, default=False)

    sales_exec = relationship("User", back_populates="bookings")
    approval_actions = relationship("ApprovalAction", back_populates="booking", order_by="ApprovalAction.created_at")


class ApprovalAction(Base):
    __tablename__ = "approval_actions"
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)  # approve / reject / request_changes
    stage = Column(String, nullable=False)
    comment = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    booking = relationship("Booking", back_populates="approval_actions")
    user = relationship("User", back_populates="approval_actions")
