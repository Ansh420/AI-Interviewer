from fastapi import APIRouter, UploadFile, File
from app.services.resume_processor import process_resume

router = APIRouter()

@router.post("/upload_resume")
async def upload_resume_route(file: UploadFile = File(...)):
    return await process_resume(file)
