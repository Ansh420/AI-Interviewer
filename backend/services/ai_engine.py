import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

class InterviewAgent:
    def __init__(self):
        self.model_name = self._get_best_model()
        self.system_instruction = (
            "You are an expert Technical Interviewer. You are watching a student present a project. "
            "Analyze the screen (code, UI, architecture) and their speech. "
            "Ask one sharp, concise follow-up question. "
            "When asked to 'EVALUATE', output ONLY a JSON object with scores (0-100) for "
            "'tech', 'clarity', 'originality', and a string for 'feedback'."
        )
        self.model = genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction=self.system_instruction
        )
        print(f"✅ AI Engine initialized with model: {self.model_name}")

    def _get_best_model(self):
        """Detects the available 2026 model strings."""
        try:
            available_models = [m.name for m in genai.list_models()]
            # Priority: Gemini 3 Flash -> 2.5 Flash -> 1.5 Flash
            for model_id in ["models/gemini-3-flash-preview", "models/gemini-2.5-flash", "models/gemini-1.5-flash"]:
                if model_id in available_models:
                    return model_id
            return "gemini-1.5-flash"
        except:
            return "gemini-1.5-flash"

    async def get_question(self, chat_session, image, text):
        """Generates a real-time question based on vision + speech."""
        prompt = [f"Student says: {text}", image, "Ask the next technical question."]
        response = chat_session.send_message(prompt)
        return response.text

    async def generate_final_score(self, chat_history):
        """Analyzes the full history and produces a JSON scorecard."""
        # history is a list of content objects from the Gemini chat session
        scoring_prompt = "EVALUATE the student's performance now. Return ONLY JSON."
        # We use a fresh prompt to avoid mixing the interview with the scoring
        response = self.model.generate_content([str(chat_history), scoring_prompt])
        
        # Clean the response string (remove ```json wrappers if present)
        clean_json = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_json)

interview_agent = InterviewAgent()