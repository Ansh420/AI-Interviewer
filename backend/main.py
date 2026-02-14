import base64
import io
import os
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
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

        return base64.b64encode(audio).decode('utf-8')
    except Exception as e:
        print(f"TTS Error: {e}")
        return None

# 3. WebSocket Endpoint
@app.websocket("/ws/interview")
async def interview_handler(websocket: WebSocket):
    await websocket.accept()
    # Start a stateful chat session
    chat_session = interview_agent.model.start_chat(history=[])
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
                    
                    # Get AI Question
                    question = await interview_agent.get_question(chat_session, img, data['text'])
                    
                    # Generate Voice
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