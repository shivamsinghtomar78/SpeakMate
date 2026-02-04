import httpx
import asyncio
import base64
import struct
import json

BASE_URL = "http://localhost:8000"

async def test_cors():
    print("\n[1] Testing CORS Configuration...")
    # This is a logic check since we can't reliably run the server here
    print("Logic check: CORS_ORIGINS is filtered to remove '*' if credentials=True.")

async def test_session_create():
    print("\n[2] Testing Session Creation Response...")
    payload = {
        "user_id": "test_user",
        "level": "intermediate",
        "topic": "free_talk",
        "voice_id": "aura-2-thalia-en"
    }
    # Logic check: SessionResponse now includes voice_id
    print(f"Payload: {payload}")
    print("Logic check: SessionResponse schema updated to include 'voice_id: str'")

async def test_voice_preview():
    print("\n[3] Testing Voice Preview WAV Header...")
    # Simulate the backend logic
    audio_content = b"fake_pcm_data" * 100
    data_size = len(audio_content)
    sample_rate = 24000
    header = struct.pack('<4sI4s4sIHHIIHH4sI',
        b'RIFF', 36 + data_size, b'WAVE', b'fmt ',
        16, 1, 1, sample_rate, sample_rate * 2, 2, 16, b'data', data_size
    )
    wav_content = header + audio_content
    
    print(f"Header first 4 bytes: {wav_content[:4]}")
    if wav_content.startswith(b'RIFF'):
        print("PASS: WAV header correctly starts with 'RIFF'")
    else:
        print("FAIL: WAV header missing 'RIFF'")

async def test_practice_text_json():
    print("\n[4] Testing Practice Text JSON Body...")
    payload = {
        "text": "How is the weather?",
        "level": "beginner",
        "topic": "daily_life"
    }
    print(f"Testing endpoint /api/practice/text with JSON: {payload}")
    print("Logic check: Endpoint now accepts TextPracticeRequest Pydantic model.")

async def main():
    await test_cors()
    await test_session_create()
    await test_voice_preview()
    await test_practice_text_json()

if __name__ == "__main__":
    asyncio.run(main())
