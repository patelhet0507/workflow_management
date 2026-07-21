from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from app.core.database import get_db
from app.models.booking import Booking, BookingStatus
from app.models.workflow import BookingApproval, ApprovalAction
from app.models.notification import AuditLog

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    today = datetime.now(timezone.utc).date()
    today_start = datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc)

    today_bookings = await db.execute(
        select(func.count(Booking.id)).where(Booking.created_at >= today_start, Booking.is_deleted == False)
    )

    pending_approvals = await db.execute(
        select(func.count(BookingApproval.id)).where(
            BookingApproval.status == ApprovalAction.PENDING,
            BookingApproval.is_current == True,
        )
    )

    status_counts = await db.execute(
        select(Booking.status, func.count(Booking.id)).where(Booking.is_deleted == False).group_by(Booking.status)
    )

    return {
        "today_bookings": today_bookings.scalar() or 0,
        "pending_approvals": pending_approvals.scalar() or 0,
        "status_breakdown": {row[0]: row[1] for row in status_counts.all()},
    }


@router.get("/recent-activity")
async def get_recent_activity(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AuditLog).order_by(AuditLog.created_at.desc()).limit(20)
    )
    return result.scalars().all()
