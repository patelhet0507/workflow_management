from datetime import datetime
from pydantic import BaseModel


class WorkflowStageConfig(BaseModel):
    stage_order: int
    stage_name: str
    role_id: str
    booking_status: str
    requires_signature: bool = True
    auto_escalate_minutes: int | None = None


class WorkflowConfigCreate(BaseModel):
    project_id: str | None = None
    name: str
    stages: list[WorkflowStageConfig]


class WorkflowConfigResponse(BaseModel):
    id: str
    name: str
    stages: list
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ApprovalResponse(BaseModel):
    id: str
    booking_id: str
    stage_name: str
    stage_order: int
    status: str
    action: str | None = None
    approved_by: str | None = None
    comments: str | None = None
    completed_at: datetime | None = None

    class Config:
        from_attributes = True


class TimelineEventResponse(BaseModel):
    id: str
    event_type: str
    title: str
    description: str | None = None
    user_id: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
