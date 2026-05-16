import fitz  # PyMuPDF
from fastapi import UploadFile

# In-memory storage for simplicity
resume_context = {}

async def process_resume(file: UploadFile):
    """Extracts text from uploaded PDF and stores it for the session."""
    try:
        content = await file.read()
        doc = fitz.open(stream=content, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        
        resume_context["current_resume"] = text
        return {"message": "Resume uploaded and processed successfully", "preview": text[:200]}
    except Exception as e:
        return {"error": f"Failed to process PDF: {str(e)}"}

def get_resume_text():
    return resume_context.get("current_resume", "No resume provided.")
