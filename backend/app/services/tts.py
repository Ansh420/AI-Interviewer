import base64
import os
import io
import asyncio
import edge_tts
from dotenv import load_dotenv

load_dotenv()

async def generate_voice(text: str):
    """Generates audio bytes via Microsoft Edge TTS (Free & Neural)."""
    try:
        # Voice options: en-US-GuyNeural, en-US-AriaNeural, en-GB-SoniaNeural
        voice = "en-US-AriaNeural"
        communicate = edge_tts.Communicate(text, voice)
        
        audio_data = b""
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data += chunk["data"]
        
        if not audio_data:
            return None
            
        return base64.b64encode(audio_data).decode('utf-8')
    except Exception as e:
        print(f"TTS Error (Edge): {e}")
        return None
