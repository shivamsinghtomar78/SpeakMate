"""Script to test all integrated APIs: MongoDB, Groq, Qubrid AI, and Deepgram."""
import asyncio
import logging
import sys
import os
import httpx

# Add parent directory to path to allow imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.database import db
from config import settings

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def test_mongodb():
    logger.info("Testing MongoDB connection...")
    try:
        await db.connect()
        await db.client.admin.command('ping')
        logger.info("✅ MongoDB: Connected successfully.")
        await db.disconnect()
        return True
    except Exception as e:
        logger.error(f"❌ MongoDB: Connection failed: {e}")
        return False

async def test_groq():
    logger.info("Testing Groq API...")
    if not settings.GROQ_API_KEY:
        logger.error("❌ Groq: API Key not found.")
        return False
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
                json={"model": settings.GROQ_MODEL, "messages": [{"role": "user", "content": "Hi"}], "max_tokens": 5}
            )
            if response.status_code == 200:
                logger.info("✅ Groq: API responded successfully.")
                return True
            else:
                logger.error(f"❌ Groq: API error {response.status_code}")
                return False
    except Exception as e:
        logger.error(f"❌ Groq: Test failed: {e}")
        return False

async def test_qubrid():
    logger.info("Testing Qubrid AI...")
    if not settings.QUBRID_API_KEY:
        logger.error("❌ Qubrid AI: API Key not found.")
        return False
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                settings.QUBRID_ENDPOINT,
                headers={
                    "Authorization": f"Bearer {settings.QUBRID_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": settings.QUBRID_MODEL,
                    "messages": [{"role": "user", "content": "Test connectivity"}],
                    "max_tokens": 10
                }
            )
            if response.status_code == 200:
                logger.info("✅ Qubrid AI: API responded successfully.")
                return True
            else:
                logger.error(f"❌ Qubrid AI: API error {response.status_code}: {response.text}")
                return False
    except Exception as e:
        logger.error(f"❌ Qubrid AI: Test failed: {e}")
        return False

async def test_deepgram():
    logger.info("Testing Deepgram API...")
    if not settings.DEEPGRAM_API_KEY:
        logger.error("❌ Deepgram: API Key not found.")
        return False
    # Use Speak API as a lightweight check
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.deepgram.com/v1/projects",
                headers={"Authorization": f"Token {settings.DEEPGRAM_API_KEY}"}
            )
            if response.status_code == 200:
                logger.info("✅ Deepgram: API authenticated successfully.")
                return True
            else:
                logger.error(f"❌ Deepgram: API error {response.status_code}")
                return False
    except Exception as e:
        logger.error(f"❌ Deepgram: Test failed: {e}")
        return False

async def test_langsmith():
    logger.info("Testing LangSmith connectivity...")
    if not settings.LANGCHAIN_API_KEY:
        logger.error("❌ LangSmith: API Key not found.")
        return False
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.LANGCHAIN_ENDPOINT}/info",
                headers={"x-api-key": settings.LANGCHAIN_API_KEY}
            )
            if response.status_code == 200:
                logger.info("✅ LangSmith: API connected successfully.")
                return True
            else:
                logger.error(f"❌ LangSmith: API error {response.status_code}")
                return False
    except Exception as e:
        logger.error(f"❌ LangSmith: Test failed: {e}")
        return False

async def run_all_tests():
    print("\n" + "="*50)
    print("🚀 STARTING API CONNECTIVITY TESTS")
    print("="*50 + "\n")
    results = await asyncio.gather(
        test_mongodb(), test_groq(), test_qubrid(), test_deepgram(), test_langsmith()
    )
    print("\n" + "="*50)
    print("📊 TEST SUMMARY")
    print("="*50)
    print(f"MongoDB:    {'PASS' if results[0] else 'FAIL'}")
    print(f"Groq:       {'PASS' if results[1] else 'FAIL'}")
    print(f"Qubrid AI:  {'PASS' if results[2] else 'FAIL'}")
    print(f"Deepgram:   {'PASS' if results[3] else 'FAIL'}")
    print(f"LangSmith:  {'PASS' if results[4] else 'FAIL'}")
    print("="*50 + "\n")

if __name__ == "__main__":
    asyncio.run(run_all_tests())
