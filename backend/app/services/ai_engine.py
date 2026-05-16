import os
import json
import base64
import io
import asyncio
import re
# from google import genai
# from google.genai import types
import ollama
from dotenv import load_dotenv

load_dotenv()

class InterviewAgent:
    def __init__(self):
        # Gemini Configuration (Commented out)
        # self.model_id = "gemini-2.0-flash-lite" 
        # self.client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        
        # Ollama Configuration
        # Using 'moondream' - a very small (<1GB) model for systems with low disk space/RAM
        self.ollama_model = "moondream" 
        self.vision_model = "moondream" 
        
        self.system_instruction = (
            "You are an expert Technical Interviewer. You are looking directly at the student's screen. "
            "Your PRIMARY focus is to analyze what you SEE on the shared screen: the code logic, folder structure, UI layout, or architectural diagrams. "
            "Use visual evidence from the image to ask deep, sharp follow-up questions. "
            "When asked to 'EVALUATE', output ONLY a JSON object with scores (0-100) for "
            "'tech', 'clarity', 'originality', and a string for 'feedback'."
        )
        print(f"✅ AI Engine initialized with Ollama model: {self.ollama_model}")

    def start_chat(self, custom_instruction=None):
        """Initializes conversation state."""
        return {
            "history": [],
            "instruction": custom_instruction or self.system_instruction
        }

    async def get_question(self, chat_session, image, text, code=None):
        """Generates a real-time question using Ollama focused on visual analysis."""
        prompt = (
            f"STUDENT SPEECH: {text}\n"
            "Analyze the PROVIDED IMAGE (the student's screen) carefully. "
            "Identify a specific technical detail visible in the image (like a function, a UI component, or a design choice). "
            "Ask ONE concise follow-up question based specifically on what you see."
        )
        if code:
            prompt += f"\nEDITOR CONTENT:\n{code}"

        # Convert PIL Image to bytes for Ollama
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='JPEG')
        img_bytes = img_byte_arr.getvalue()

        # Update History
        chat_session["history"].append({"role": "user", "content": prompt, "images": [img_bytes]})

        # Call Ollama (llava/moondream for vision support)
        # We run this in a thread to avoid blocking the event loop
        response = await asyncio.to_thread(
            ollama.chat,
            model=self.vision_model,
            messages=[
                {"role": "system", "content": chat_session["instruction"]},
                *chat_session["history"]
            ]
        )
        
        ai_message = response['message']['content']
        chat_session["history"].append({"role": "assistant", "content": ai_message})
        return ai_message

    async def generate_final_score(self, chat_history):
        """Analyzes the full history and produces a JSON scorecard using Ollama."""
        
        # Prepare a concise summary of the interview for the small model
        history_text = ""
        for msg in chat_history:
            role = "Student" if msg['role'] == "user" else "Interviewer"
            # Strip images and long code blocks to save context space
            content = msg['content']
            if len(content) > 500: content = content[:500] + "..."
            history_text += f"{role}: {content}\n"

        scoring_prompt = (
            f"INTERVIEW HISTORY:\n{history_text}\n\n"
            "TASK: Evaluate this student. Provide a unique technical critique based on the history above. "
            "Return ONLY a JSON object with this structure:\n"
            "{\n"
            "  \"tech\": 0-100,\n"
            "  \"clarity\": 0-100,\n"
            "  \"originality\": 0-100,\n"
            "  \"feedback\": \"### 🚀 Skills\\n- Detail 1\\n- Detail 2\"\n"
            "}\n"
            "Do not use placeholders. Use real data from the text above."
        )
        
        response = await asyncio.to_thread(
            ollama.chat,
            model=self.ollama_model,
            messages=[
                {"role": "system", "content": "You are a grading assistant. Be specific and honest."},
                {"role": "user", "content": scoring_prompt}
            ],
            format="json"
        )
        content = response['message']['content']
        print(f"DEBUG: Raw AI Evaluation content: {content}")

        def normalize_score(s):
            try:
                val = float(s)
                # If model returns 0.78 instead of 78, multiply by 100
                if 0 < val <= 1:
                    return int(val * 100)
                return int(val)
            except:
                return 70

        try:
            data = json.loads(content)
            data['tech'] = normalize_score(data.get('tech', 70))
            data['clarity'] = normalize_score(data.get('clarity', 70))
            data['originality'] = normalize_score(data.get('originality', 70))
            return data
        except:
            # Defensive parsing for smaller models like moondream
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                try:
                    data = json.loads(json_match.group())
                    data['tech'] = normalize_score(data.get('tech', 70))
                    data['clarity'] = normalize_score(data.get('clarity', 70))
                    data['originality'] = normalize_score(data.get('originality', 70))
                    return data
                except:
                    pass

            # Regex Fallback
            tech_m = re.search(r'"tech":\s*([\d.]+)', content)
            clarity_m = re.search(r'"clarity":\s*([\d.]+)', content)
            orig_m = re.search(r'"originality":\s*([\d.]+)', content)
            fb_m = re.search(r'"feedback":\s*"(.*?)"', content, re.DOTALL)

            return {
                "tech": normalize_score(tech_m.group(1)) if tech_m else 70,
                "clarity": normalize_score(clarity_m.group(1)) if clarity_m else 70,
                "originality": normalize_score(orig_m.group(1)) if orig_m else 70,
                "feedback": fb_m.group(1) if fb_m else f"Technical evaluation complete.\n\n### Summary\n{content[:300]}..."
            }


    async def chat(self, chat_session, message):
        """Generates a response for text-only messages."""
        chat_session["history"].append({"role": "user", "content": message})
        
        response = await asyncio.to_thread(
            ollama.chat,
            model=self.ollama_model,
            messages=[
                {"role": "system", "content": chat_session["instruction"]},
                *chat_session["history"]
            ]
        )
        
        ai_message = response['message']['content']
        chat_session["history"].append({"role": "assistant", "content": ai_message})
        return ai_message

interview_agent = InterviewAgent()
