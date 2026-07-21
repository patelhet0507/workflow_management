import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, ForeignKey, Boolean, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
import enum


class NotificationType(str, enum.Enum):
    APPROVAL_PENDING = "approval_pending"
    BOOKING_REJECTED = "booking_rejected"
    DOCUMENTS_MISSING = "documents_missing"
    KYC_APPROVED = "kyc_approved"
    AGREEMENT_GENERATED = "agreement_generated"
    SALE_DEED_READY = "sale_deed_ready"
    PRINT_READY = "print_ready"
    COMMENT_ADDED = "comment_added"
    STATUS_CHANGED = "status_changed"


class AuditAction(str, enum.Enum):
    CREATED = "created"
    EDITED = "edited"
    APPROVED = "approved"
    REJECTED = "rejected"
    LOGIN = "login"
    DOCUMENT_UPLOAD = "document_upload"
    PRINT_REQUEST = "print_request"
    DOWNLOAD = "download"
    DELETED = "deleted"


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    type: Mapped[NotificationType] = mapped_column(SAEnum(NotificationType))
    title: Mapped[str] = mapped_column(String(255))
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    booking_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("bookings.id"), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship("User", back_populates="notifications")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    action: Mapped[AuditAction] = mapped_column(SAEnum(AuditAction))
    resource_type: Mapped[str] = mapped_column(String(100))
    resource_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    details: Mapped[dict | None] = mapped_column(nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship("User", back_populates="audit_logs")


class DigitalSignature(Base):
    __tablename__ = "digital_signatures"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    signature_data: Mapped[str] = mapped_column(Text)  # base64 encoded
    signature_type: Mapped[str] = mapped_column(String(50))  # uploaded, drawn
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class PrintRequest(Base):
    __tablename__ = "print_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_id: Mapped[str] = mapped_column(String(36), ForeignKey("bookings.id"))
    document_type: Mapped[str] = mapped_column(String(100))  # ats, sale_deed, booking_form, receipt
    requested_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    approved_by: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="requested")  # requested, approved, printing, printed, collected, delivered
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
