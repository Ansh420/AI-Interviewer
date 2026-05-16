import base64
import io
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from PIL import Image
from app.services.ai_engine import interview_agent
from app.services.tts import generate_voice
from app.services.resume_processor import get_resume_text
from app.db.session import SessionLocal
from app.models.interview import InterviewReport

router = APIRouter()

@router.websocket("/interview")
async def interview_handler(websocket: WebSocket):
    await websocket.accept()
    
    resume_text = get_resume_text()
    
    custom_instruction = interview_agent.system_instruction
    if resume_text != "No resume provided.":
        custom_instruction += f"\n\nCANDIDATE RESUME:\n{resume_text}\n\nTailor your questions to their experience."

    chat_session = interview_agent.start_chat(custom_instruction=custom_instruction)
    chat_session.send_message(message="SYSTEM: Use the resume provided in system instructions to tailor the interview.")
    
    db = SessionLocal()
    print("🚀 Session Started")

    try:
        while True:
            data = await websocket.receive_json()

            if data.get("type") == "FINISH":
                print("📊 Generating Final Evaluation...")
                eval_results = await interview_agent.generate_final_score(chat_session.history)
                
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

            else:
                try:
                    img_b64 = data['frame'].split(",")[1]
                    img = Image.open(io.BytesIO(base64.b64decode(img_b64)))
                    img.thumbnail((720, 720)) 
                    
                    question = await interview_agent.get_question(
                        chat_session, img, data['text'], code=data.get('code')
                    )
                    
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
