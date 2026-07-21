import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, ForeignKey, Integer, Boolean, JSON, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.booking import BookingStatus
import enum


class ApprovalAction(str, enum.Enum):
    APPROVED = "approved"
    REJECTED = "rejected"
    REQUEST_CHANGES = "request_changes"
    PENDING = "pending"


class WorkflowConfig(Base):
    __tablename__ = "workflow_configs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("projects.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(255))
    stages: Mapped[dict] = mapped_column(JSON)  # ordered list of stage configs
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class ApprovalStage(Base):
    __tablename__ = "approval_stages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workflow_config_id: Mapped[str] = mapped_column(String(36), ForeignKey("workflow_configs.id"))
    stage_order: Mapped[int] = mapped_column(Integer)
    stage_name: Mapped[str] = mapped_column(String(100))
    role_id: Mapped[str] = mapped_column(String(36), ForeignKey("roles.id"))
    booking_status: Mapped[BookingStatus] = mapped_column(SAEnum(BookingStatus))
    requires_signature: Mapped[bool] = mapped_column(Boolean, default=True)
    auto_escalate_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    conditional_rules: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class BookingApproval(Base):
    __tablename__ = "booking_approvals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_id: Mapped[str] = mapped_column(String(36), ForeignKey("bookings.id"))
    stage_name: Mapped[str] = mapped_column(String(100))
    stage_order: Mapped[int] = mapped_column(Integer)
    status: Mapped[ApprovalAction] = mapped_column(SAEnum(ApprovalAction), default=ApprovalAction.PENDING)
    action: Mapped[ApprovalAction | None] = mapped_column(SAEnum(ApprovalAction), nullable=True)
    approved_by: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    comments: Mapped[str | None] = mapped_column(Text, nullable=True)
    signature: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    booking: Mapped["Booking"] = relationship("Booking", back_populates="approvals")
    approver: Mapped["User"] = relationship("User", foreign_keys=[approved_by])


class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_id: Mapped[str] = mapped_column(String(36), ForeignKey("bookings.id"))
    event_type: Mapped[str] = mapped_column(String(100))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    booking: Mapped["Booking"] = relationship("Booking", back_populates="timeline")
    user: Mapped["User"] = relationship("User")
