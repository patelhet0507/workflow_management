from datetime import datetime, timezone
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from database import init_db, get_db
from models import User, Booking, ApprovalAction, BookingStatus
from auth import hash_password, verify_password, create_token, get_current_user, require_role

init_db()

app = FastAPI(title="Real Estate CRM", docs_url="/api/docs")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


# ─── Schemas ───

class LoginRequest(BaseModel):
    email: str
    password: str

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

class ApprovalReq(BaseModel):
    action: str  # approve / reject / request_changes
    comment: Optional[str] = None


# ─── CRM Flow ───

CRM_STAGES = [
    BookingStatus.BOOKING_CREATED,
    BookingStatus.KYC_VERIFICATION,
    BookingStatus.CRM_APPROVAL,
    BookingStatus.COMPLETED,
]

def next_stage(current: str) -> str:
    for i, s in enumerate(CRM_STAGES):
        if s.value == current and i < len(CRM_STAGES) - 1:
            return CRM_STAGES[i + 1].value
    return current


# ─── Auth ───

@app.post("/api/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email, User.is_deleted == False).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user.id, user.role)
    return {"token": token, "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role}}

@app.get("/api/auth/me")
def me(user: User = Depends(get_current_user)):
    return {"id": user.id, "name": user.name, "email": user.email, "role": user.role}


# ─── Bookings ───

@app.post("/api/bookings", status_code=201)
def create_booking(req: BookingCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in ("sales_exec", "super_admin"):
        raise HTTPException(status_code=403, detail="Only sales executives can create bookings")
    booking = Booking(**req.model_dump(), sales_exec_id=user.id, status=BookingStatus.BOOKING_CREATED.value)
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking

@app.get("/api/bookings")
def list_bookings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(Booking).filter(Booking.is_deleted == False)
    if user.role == "sales_exec":
        q = q.filter(Booking.sales_exec_id == user.id)
    return q.order_by(Booking.created_at.desc()).all()

@app.get("/api/bookings/{bid}")
def get_booking(bid: int, db: Session = Depends(get_db)):
    b = db.query(Booking).filter(Booking.id == bid, Booking.is_deleted == False).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")
    return b


# ─── Approvals ───

@app.post("/api/bookings/{bid}/approve")
def approve_booking(bid: int, req: ApprovalReq, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    b = db.query(Booking).filter(Booking.id == bid, Booking.is_deleted == False).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")
    if user.role not in ("crm", "super_admin"):
        raise HTTPException(status_code=403, detail="Only CRM team can approve in this flow")
    if b.status == BookingStatus.REJECTED.value or b.status == BookingStatus.COMPLETED.value:
        raise HTTPException(status_code=400, detail=f"Booking is already {b.status}")

    db.add(ApprovalAction(booking_id=b.id, user_id=user.id, action=req.action, stage=b.status, comment=req.comment))

    if req.action == "approve":
        b.status = next_stage(b.status)
    elif req.action == "reject":
        b.status = BookingStatus.REJECTED.value
    elif req.action == "request_changes":
        b.remarks = req.comment

    b.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(b)
    return b

@app.get("/api/bookings/{bid}/history")
def booking_history(bid: int, db: Session = Depends(get_db)):
    actions = db.query(ApprovalAction).filter(ApprovalAction.booking_id == bid).order_by(ApprovalAction.created_at).all()
    result = []
    for a in actions:
        u = db.query(User).filter(User.id == a.user_id).first()
        result.append({
            "id": a.id, "action": a.action, "stage": a.stage, "comment": a.comment,
            "user_name": u.name if u else "Unknown", "created_at": a.created_at.isoformat(),
        })
    return result


# ─── Dashboard ───

@app.get("/api/dashboard")
def dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    base = db.query(Booking).filter(Booking.is_deleted == False)
    if user.role == "sales_exec":
        base = base.filter(Booking.sales_exec_id == user.id)
    total = base.count()
    pending = base.filter(Booking.status.notin_([BookingStatus.COMPLETED.value, BookingStatus.REJECTED.value])).count()
    completed = base.filter(Booking.status == BookingStatus.COMPLETED.value).count()
    rejected = base.filter(Booking.status == BookingStatus.REJECTED.value).count()
    return {"total_bookings": total, "pending_approvals": pending, "completed": completed, "rejected": rejected}

@app.get("/api/users")
def list_users(db: Session = Depends(get_db), _=Depends(require_role("super_admin"))):
    return db.query(User).filter(User.is_deleted == False).all()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
