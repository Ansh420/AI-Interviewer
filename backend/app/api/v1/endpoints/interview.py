import base64
import io
import time
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from PIL import Image
from app.services.ai_engine import interview_agent
from app.services.tts import generate_voice
from app.services.resume_processor import get_resume_text
from app.services.sandbox import execute_code
from app.db.session import SessionLocal
from app.models.interview import InterviewReport

router = APIRouter()

@router.websocket("/interview")
async def interview_handler(websocket: WebSocket):
    await websocket.accept()
    
    resume_text = get_resume_text()
    session_start_time = time.time()
    timeline_events = [] # [{timestamp, type, content, marker}]
    
    custom_instruction = interview_agent.system_instruction
    if resume_text != "No resume provided.":
        custom_instruction += f"\n\nCANDIDATE RESUME:\n{resume_text}\n\nTailor your questions to their experience."

    chat_session = interview_agent.start_chat(custom_instruction=custom_instruction)
    # Gemini specific: chat_session.send_message(message="SYSTEM: Start the interview. Use the resume context if available.")
    
    db = SessionLocal()
    print("🚀 Session Started")

    try:
        while True:
            data = await websocket.receive_json()
            current_timestamp = round(time.time() - session_start_time, 2)

            if data.get("type") == "FINISH":
                print("📊 Generating Final Evaluation...")
                eval_results = await interview_agent.generate_final_score(chat_session['history'])
                
                report = InterviewReport(
                    tech_score=eval_results.get('tech', 0),
                    clarity_score=eval_results.get('clarity', 0),
                    originality_score=eval_results.get('originality', 0),
                    feedback=eval_results.get('feedback', "N/A"),
                    timeline_events=timeline_events
                )
                db.add(report)
                db.commit()
                db.refresh(report)

                await websocket.send_json({
                    "type": "FINAL_REPORT", 
                    "report_id": report.id,
                    "scores": eval_results,
                    "timeline": timeline_events
                })
                break

            elif data.get("type") == "EXECUTE_CODE":
                result = await execute_code(data.get("language"), data.get("code"))
                output = result.get('output') or result.get('error') or "No output from execution."
                stderr = result.get('stderr') or ""
                
                # AI analyzes the execution result
                analysis_prompt = f"The student executed their code. Output:\n{output}\nAnalyze if this is correct or if there are bugs. Give a 1-sentence critique."
                ai_comment = await interview_agent.chat(chat_session, analysis_prompt)
                
                timeline_events.append({
                    "timestamp": current_timestamp,
                    "type": "CODE_EXECUTION",
                    "content": output,
                    "marker": "red" if result.get('error') or "error" in output.lower() or "exception" in output.lower() or stderr else "green",
                    "ai_comment": ai_comment
                })
                
                await websocket.send_json({
                    "type": "EXECUTION_RESULT",
                    "result": {"output": output, "stderr": stderr},
                    "ai_comment": ai_comment
                })

            else:
                try:
                    img_b64 = data['frame'].split(",")[1]
                    img = Image.open(io.BytesIO(base64.b64decode(img_b64)))
                    img.thumbnail((720, 720)) 
                    
                    question = await interview_agent.get_question(
                        chat_session, img, data['text'], code=data.get('code')
                    )
                    
                    timeline_events.append({
                        "timestamp": current_timestamp,
                        "type": "QUESTION",
                        "content": question
                    })

                    audio_b64 = None
                    if len(question) < 500:
                        audio_b64 = await generate_voice(question)

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
