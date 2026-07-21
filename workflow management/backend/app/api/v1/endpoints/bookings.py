import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.booking import Booking, Client, Project, Unit, Tower, Document, Payment, BookingStatus
from app.models.workflow import BookingApproval, TimelineEvent, ApprovalAction, WorkflowConfig, ApprovalStage
from app.models.user import User
from app.schemas.booking import BookingCreate, BookingResponse, BookingListResponse, ApprovalActionRequest

router = APIRouter(prefix="/bookings", tags=["Bookings"])


def generate_booking_number():
    return f"BK-{datetime.now().strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"


@router.post("", response_model=BookingResponse)
async def create_booking(req: BookingCreate, user_id: str = "", db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Client).where(
        Client.phone == req.client.phone
    ))
    client = result.scalar_one_or_none()
    if not client:
        client = Client(**req.client.model_dump())
        db.add(client)
        await db.flush()

    unit_result = await db.execute(select(Unit).where(Unit.id == req.unit_id))
    unit = unit_result.scalar_one_or_none()
    if not unit:
        raise HTTPException(404, "Unit not found")

    booking = Booking(
        booking_number=generate_booking_number(),
        client_id=client.id,
        unit_id=req.unit_id,
        project_id=req.project_id,
        sales_executive_id=user_id or "system",
        booking_amount=req.booking_amount,
        payment_mode=req.payment_mode,
        transaction_id=req.transaction_id,
        bank_name=req.bank_name,
        payment_plan=req.payment_plan,
        booking_source=req.booking_source,
        reference_by=req.reference_by,
        remarks=req.remarks,
        onboarding_date=req.onboarding_date,
        client_confirmation_date=req.client_confirmation_date,
    )
    db.add(booking)
    await db.flush()

    timeline = TimelineEvent(
        booking_id=booking.id,
        event_type="booking_created",
        title="Booking Created",
        description=f"Booking {booking.booking_number} created",
        user_id=user_id or None,
    )
    db.add(timeline)

    # create initial approval stages from workflow config
    wf_result = await db.execute(
        select(WorkflowConfig).where(
            WorkflowConfig.is_active == True,
            (WorkflowConfig.project_id == req.project_id) | (WorkflowConfig.project_id.is_(None))
        ).order_by(WorkflowConfig.created_at.desc()).limit(1)
    )
    wf_config = wf_result.scalar_one_or_none()
    if wf_config:
        stages = wf_config.stages
        for i, stage in enumerate(stages):
            approval = BookingApproval(
                booking_id=booking.id,
                stage_name=stage.get("stage_name"),
                stage_order=stage.get("stage_order", i),
                status=ApprovalAction.PENDING,
                is_current=(i == 0),
            )
            db.add(approval)

    await db.refresh(booking, ["client"])
    return booking


@router.get("", response_model=BookingListResponse)
async def list_bookings(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str = "",
    status: str = "",
    project_id: str = "",
    user_id: str = "",
    db: AsyncSession = Depends(get_db),
):
    query = select(Booking).where(Booking.is_deleted == False).options(selectinload(Booking.client))

    if search:
        query = query.join(Client).where(
            or_(
                Client.name.ilike(f"%{search}%"),
                Client.phone.ilike(f"%{search}%"),
                Booking.booking_number.ilike(f"%{search}%"),
            )
        )
    if status:
        query = query.where(Booking.status == status)
    if project_id:
        query = query.where(Booking.project_id == project_id)
    if user_id:
        query = query.where(Booking.sales_executive_id == user_id)

    total = await db.execute(select(func.count()).select_from(query.subquery()))
    total_count = total.scalar() or 0

    query = query.order_by(Booking.created_at.desc()).offset((page - 1) * size).limit(size)
    result = await db.execute(query)
    bookings = result.scalars().all()

    return BookingListResponse(items=list(bookings), total=total_count, page=page, size=size)


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(booking_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Booking).where(Booking.id == booking_id, Booking.is_deleted == False)
        .options(selectinload(Booking.client), selectinload(Booking.approvals), selectinload(Booking.timeline))
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(404, "Booking not found")
    return booking


@router.post("/{booking_id}/approve")
async def approve_stage(booking_id: str, req: ApprovalActionRequest, user_id: str, ip: str = "", db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(BookingApproval).where(
            BookingApproval.booking_id == booking_id,
            BookingApproval.is_current == True,
            BookingApproval.status == ApprovalAction.PENDING,
        )
    )
    approval = result.scalar_one_or_none()
    if not approval:
        raise HTTPException(400, "No pending approval found")

    approval.action = req.action
    approval.approved_by = user_id
    approval.comments = req.comments
    approval.signature = req.signature
    approval.ip_address = ip
    approval.status = ApprovalAction(req.action) if req.action in ("approved", "rejected", "request_changes") else ApprovalAction.PENDING
    approval.is_current = False
    approval.completed_at = datetime.now(timezone.utc)

    # find next stage
    next_stage = await db.execute(
        select(BookingApproval).where(
            BookingApproval.booking_id == booking_id,
            BookingApproval.stage_order == approval.stage_order + 1,
        )
    )
    next_s = next_stage.scalar_one_or_none()

    booking = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = booking.scalar_one_or_none()

    if req.action == "rejected":
        booking.status = BookingStatus.REJECTED
        event_type = "booking_rejected"
        event_title = "Booking Rejected"
    elif req.action == "request_changes":
        event_type = "changes_requested"
        event_title = "Changes Requested"
    else:
        if next_s:
            next_s.is_current = True
            booking.status = BookingStatus(next_s.stage_name.lower().replace(" ", "_"))
        else:
            booking.status = BookingStatus.COMPLETED
        event_type = f"stage_{req.action}"
        event_title = f"Stage {req.action.title()}"

    timeline = TimelineEvent(
        booking_id=booking_id,
        event_type=event_type,
        title=event_title,
        description=f"{approval.stage_name} - {req.action} by {user_id}",
        user_id=user_id,
    )
    db.add(timeline)
    return {"message": "Approval recorded", "status": req.action}
