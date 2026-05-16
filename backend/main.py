import base64
import io
import os
import uvicorn
import fitz  # PyMuPDF
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from elevenlabs.client import ElevenLabs
from dotenv import load_dotenv
# Local Imports
from services.ai_engine import interview_agent
from database import SessionLocal, InterviewReport

# 1. Setup
load_dotenv()
app = FastAPI()
el_client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))

# Global storage for resume context (In-memory for simplicity in this version)
resume_context = {}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. TTS Helper
def generate_voice(text: str):
    """Generates audio bytes via ElevenLabs Flash v2.5."""
    try:
        audio = el_client.generate(
            text=text,
            voice="JBFqnCBv7vXPZ7WpL6th", # Adam (Professional)
            model="eleven_flash_v2_5"
        )
        audio_bytes = b"".join(list(audio))

        return base64.b64encode(audio_bytes).decode('utf-8')
    except Exception as e:
        print(f"TTS Error: {e}")
        return None

# 3. Resume Upload Endpoint
@app.post("/upload_resume")
async def upload_resume(file: UploadFile = File(...)):
    """Extracts text from uploaded PDF and stores it for the session."""
    try:
        content = await file.read()
        doc = fitz.open(stream=content, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        
        # Store resume text (simplified: one global resume for now)
        resume_context["current_resume"] = text
        return {"message": "Resume uploaded and processed successfully", "preview": text[:200]}
    except Exception as e:
        return {"error": f"Failed to process PDF: {str(e)}"}

# 4. WebSocket Endpoint
@app.websocket("/ws/interview")
async def interview_handler(websocket: WebSocket):
    await websocket.accept()
    
    # Check if we have a resume context to tailor the interview
    resume_text = resume_context.get("current_resume", "No resume provided.")
    
    # Start a stateful chat session with tailored instructions
    custom_instruction = interview_agent.system_instruction
    if resume_text != "No resume provided.":
        custom_instruction += f"\n\nCANDIDATE RESUME:\n{resume_text}\n\nTailor your questions to their experience and projects mentioned in the resume."

    chat_session = interview_agent.start_chat(custom_instruction=custom_instruction)
    # Send the resume context as the first hidden message to the AI
    chat_session.send_message(message=f"SYSTEM: Use the resume provided in system instructions to tailor the interview.")
    
    db = SessionLocal()
    
    print("🚀 Session Started")

    try:
        while True:
            data = await websocket.receive_json()

            # Case A: Student finishes presentation
            if data.get("type") == "FINISH":
                print("📊 Generating Final Evaluation...")
                eval_results = await interview_agent.generate_final_score(chat_session.history)
                
                # Save to SQL
                report = InterviewReport(
                    tech_score=eval_results.get('tech', 0),
                    clarity_score=eval_results.get('clarity', 0),
                    originality_score=eval_results.get('originality', 0),
                    feedback=eval_results.get('feedback', "N/A")
                )
                db.add(report)
                db.commit()
                db.refresh(report)

                await websocket.send_json({
                    "type": "FINAL_REPORT", 
                    "report_id": report.id,
                    "scores": eval_results
                })
                break

            # Case B: Standard Interview Step
            else:
                try:
                    # Process Frame
                    img_b64 = data['frame'].split(",")[1]
                    img = Image.open(io.BytesIO(base64.b64decode(img_b64)))
                    
                    # Performance: Downscale image for faster AI vision processing
                    img.thumbnail((720, 720)) 
                    
                    # Get AI Question
                    question = await interview_agent.get_question(
                        chat_session, 
                        img, 
                        data['text'],
                        code=data.get('code')
                    )
                    
                    # Generate Voice (Performance: Skip if response is too long or handle errors gracefully)
                    audio_b64 = None
                    if len(question) < 500:
                        audio_b64 = generate_voice(question)

                    await websocket.send_json({
                        "type": "AI_RESPONSE",
                        "text": question,
                        "audio": audio_b64
                    })
                except Exception as loop_err:
                    print(f"⚠️ Loop Error: {loop_err}")
                    await websocket.send_json({
                        "type": "AI_RESPONSE",
                        "text": "I missed that last bit. Could you continue?",
                        "audio": None
                    })

    except WebSocketDisconnect:
        print("🔌 Session Closed")
    finally:
        db.close()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)