from fastapi import APIRouter
from app.api.v1.endpoints import auth, bookings, workflow, dashboard, documents, notifications, projects, users

router = APIRouter(prefix="/api/v1")
router.include_router(auth.router)
router.include_router(bookings.router)
router.include_router(workflow.router)
router.include_router(dashboard.router)
router.include_router(documents.router)
router.include_router(notifications.router)
router.include_router(projects.router)
router.include_router(users.router)
