import os
from elevenlabs.client import ElevenLabs

class TTSEngine:
    def __init__(self):
        self.client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))
        # Using Flash v2.5 for sub-100ms latency
        self.model_id = "eleven_flash_v2_5"
        self.voice_id = "JBFqnCBv7vXPZ7WpL6th" # Your copied Voice ID

    def generate_audio(self, text: str):
        # We generate the full audio chunk for simplicity in this demo
        audio = self.client.generate(
            text=text,
            voice=self.voice_id,
            model=self.model_id
        )
        return audio

tts_engine = TTSEngine()