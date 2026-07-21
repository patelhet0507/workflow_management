from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.booking import Project, Tower, Unit

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("")
async def list_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.is_active == True))
    return result.scalars().all()


@router.get("/{project_id}/towers")
async def list_towers(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tower).where(Tower.project_id == project_id))
    return result.scalars().all()


@router.get("/towers/{tower_id}/units")
async def list_units(tower_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Unit).where(Unit.tower_id == tower_id))
    return result.scalars().all()
