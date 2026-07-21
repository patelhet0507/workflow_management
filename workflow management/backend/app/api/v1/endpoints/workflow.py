from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.core.database import get_db
from app.models.workflow import WorkflowConfig, ApprovalStage
from app.models.booking import Booking, BookingStatus
from app.schemas.workflow import WorkflowConfigCreate, WorkflowConfigResponse

router = APIRouter(prefix="/workflows", tags=["Workflows"])


@router.post("", response_model=WorkflowConfigResponse)
async def create_workflow(req: WorkflowConfigCreate, user_id: str, db: AsyncSession = Depends(get_db)):
    wf = WorkflowConfig(
        project_id=req.project_id,
        name=req.name,
        stages=[s.model_dump() for s in req.stages],
        created_by=user_id,
    )
    db.add(wf)
    await db.flush()
    await db.refresh(wf)
    return wf


@router.get("", response_model=list[WorkflowConfigResponse])
async def list_workflows(project_id: str = "", db: AsyncSession = Depends(get_db)):
    query = select(WorkflowConfig).where(WorkflowConfig.is_active == True)
    if project_id:
        query = query.where(WorkflowConfig.project_id == project_id)
    result = await db.execute(query.order_by(WorkflowConfig.created_at.desc()))
    return result.scalars().all()


@router.get("/{workflow_id}", response_model=WorkflowConfigResponse)
async def get_workflow(workflow_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WorkflowConfig).where(WorkflowConfig.id == workflow_id))
    wf = result.scalar_one_or_none()
    if not wf:
        raise HTTPException(404, "Workflow not found")
    return wf


@router.delete("/{workflow_id}")
async def delete_workflow(workflow_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WorkflowConfig).where(WorkflowConfig.id == workflow_id))
    wf = result.scalar_one_or_none()
    if not wf:
        raise HTTPException(404, "Workflow not found")
    wf.is_active = False
    return {"message": "Workflow deactivated"}
