import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

class InterviewAgent:
    def __init__(self):
        self.model_id = "gemini-2.0-flash-lite" 
        self.client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

        self.system_instruction = (
            "You are an expert Technical Interviewer. You are watching a student present a project. "
            "Analyze the screen (code, UI, architecture) and their speech. "
            "Ask one sharp, concise follow-up question. "
            "When asked to 'EVALUATE', output ONLY a JSON object with scores (0-100) for "
            "'tech', 'clarity', 'originality', and a string for 'feedback'."
        )
        print(f"✅ AI Engine initialized with model: {self.model_id}")

    def start_chat(self, custom_instruction=None):
        """Creates a new chat session."""
        instr = custom_instruction or self.system_instruction
        return self.client.chats.create(
            model=self.model_id,
            config=types.GenerateContentConfig(
                system_instruction=instr
            )
        )

    async def get_question(self, chat_session, image, text, code=None):
        """Generates a real-time question based on vision + speech + code."""
        prompt_parts = [f"Student says: {text}"]
        if code:
            prompt_parts.append(f"CURRENT CODE IN EDITOR:\n{code}")
        prompt_parts.extend([image, "Ask the next technical question based on what you see and hear."])
        
        response = chat_session.send_message(message=prompt_parts)
        return response.text

    async def generate_final_score(self, chat_history):
        """Analyzes the full history and produces a JSON scorecard."""
        scoring_prompt = "EVALUATE the student's performance now. Return ONLY JSON."
        response = self.client.models.generate_content(
            model=self.model_id,
            contents=[*chat_history, scoring_prompt],
            config=types.GenerateContentConfig(
                system_instruction=self.system_instruction
            )
        )
        
        clean_json = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_json)

interview_agent = InterviewAgent()
