from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.booking import Document
import aiofiles
import os

router = APIRouter(prefix="/documents", tags=["Documents"])

UPLOAD_DIR = "uploads"


@router.post("/upload/{booking_id}")
async def upload_document(booking_id: str, document_type: str, file: UploadFile = File(...), user_id: str = "", db: AsyncSession = Depends(get_db)):
    os.makedirs(f"{UPLOAD_DIR}/{booking_id}", exist_ok=True)
    file_path = f"{UPLOAD_DIR}/{booking_id}/{file.filename}"
    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    doc = Document(
        booking_id=booking_id,
        document_type=document_type,
        file_url=file_path,
        file_name=file.filename or "unknown",
        uploaded_by=user_id or "system",
    )
    db.add(doc)
    await db.flush()
    return {"message": "Document uploaded", "id": doc.id, "url": file_path}


@router.get("/{booking_id}")
async def get_documents(booking_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).where(Document.booking_id == booking_id))
    return result.scalars().all()
