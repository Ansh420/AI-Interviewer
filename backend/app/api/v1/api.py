from fastapi import APIRouter
from app.api.v1.endpoints import interview, resume

api_router = APIRouter()
api_router.include_router(interview.router, tags=["interview"], prefix="/ws")
api_router.include_router(resume.router, tags=["resume"])
