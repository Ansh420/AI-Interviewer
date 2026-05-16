import base64
import os
from elevenlabs.client import ElevenLabs
from dotenv import load_dotenv

load_dotenv()
el_client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))

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
