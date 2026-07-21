import uuid
from datetime import datetime, timezone, date
from decimal import Decimal
from sqlalchemy import String, Text, DateTime, ForeignKey, Numeric, Date, Enum as SAEnum, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
import enum


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


class PaymentMode(str, enum.Enum):
    CASH = "cash"
    CHEQUE = "cheque"
    BANK_TRANSFER = "bank_transfer"
    ONLINE = "online"
    DD = "demand_draft"


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    towers: Mapped[list["Tower"]] = relationship("Tower", back_populates="project")


class Tower(Base):
    __tablename__ = "towers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"))
    name: Mapped[str] = mapped_column(String(255))
    total_floors: Mapped[int | None] = mapped_column(default=None)

    project: Mapped[Project] = relationship("Project", back_populates="towers")
    units: Mapped[list["Unit"]] = relationship("Unit", back_populates="tower")


class Unit(Base):
    __tablename__ = "units"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tower_id: Mapped[str] = mapped_column(String(36), ForeignKey("towers.id"))
    unit_number: Mapped[str] = mapped_column(String(50))
    floor: Mapped[str | None] = mapped_column(String(50), nullable=True)
    property_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    area: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    price: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    sd_value: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    is_booked: Mapped[bool] = mapped_column(Boolean, default=False)

    tower: Mapped[Tower] = relationship("Tower", back_populates="units")


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    pan: Mapped[str | None] = mapped_column(String(20), nullable=True)
    aadhar: Mapped[str | None] = mapped_column(String(20), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    occupation: Mapped[str | None] = mapped_column(String(255), nullable=True)
    nationality: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    bookings: Mapped[list["Booking"]] = relationship("Booking", back_populates="client")


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_number: Mapped[str] = mapped_column(String(50), unique=True)
    client_id: Mapped[str] = mapped_column(String(36), ForeignKey("clients.id"))
    unit_id: Mapped[str] = mapped_column(String(36), ForeignKey("units.id"))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"))
    sales_executive_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    status: Mapped[BookingStatus] = mapped_column(SAEnum(BookingStatus), default=BookingStatus.BOOKING_CREATED)
    booking_amount: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    payment_mode: Mapped[PaymentMode | None] = mapped_column(SAEnum(PaymentMode), nullable=True)
    transaction_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    bank_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    payment_plan: Mapped[str | None] = mapped_column(String(255), nullable=True)
    booking_source: Mapped[str | None] = mapped_column(String(255), nullable=True)
    reference_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    onboarding_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    client_confirmation_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    qr_code: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    client: Mapped[Client] = relationship("Client", back_populates="bookings")
    unit: Mapped[Unit] = relationship("Unit")
    project: Mapped[Project] = relationship("Project")
    sales_executive: Mapped["User"] = relationship("User")
    payments: Mapped[list["Payment"]] = relationship("Payment", back_populates="booking")
    documents: Mapped[list["Document"]] = relationship("Document", back_populates="booking")
    approvals: Mapped[list["BookingApproval"]] = relationship("BookingApproval", back_populates="booking")
    timeline: Mapped[list["TimelineEvent"]] = relationship("TimelineEvent", back_populates="booking")


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_id: Mapped[str] = mapped_column(String(36), ForeignKey("bookings.id"))
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2))
    payment_date: Mapped[date] = mapped_column(Date)
    payment_mode: Mapped[PaymentMode] = mapped_column(SAEnum(PaymentMode))
    transaction_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    bank_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    receipt_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verified_by: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    booking: Mapped[Booking] = relationship("Booking", back_populates="payments")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_id: Mapped[str] = mapped_column(String(36), ForeignKey("bookings.id"))
    document_type: Mapped[str] = mapped_column(String(100))
    file_url: Mapped[str] = mapped_column(String(500))
    file_name: Mapped[str] = mapped_column(String(255))
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verified_by: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    uploaded_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    booking: Mapped[Booking] = relationship("Booking", back_populates="documents")
