"""Configuration settings for SpeakMate backend."""
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    """Application settings loaded from environment variables."""
    
    # API Keys
    DEEPGRAM_API_KEY: str = os.getenv("DEEPGRAM_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    # Qubrid AI (for RAG semantic selection)
    QUBRID_API_KEY: str = os.getenv("QUBRID_API_KEY", "")
    QUBRID_MODEL: str = os.getenv("QUBRID_MODEL", "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16")
    QUBRID_ENDPOINT: str = os.getenv("QUBRID_ENDPOINT", "https://platform.qubrid.com/api/v1/qubridai/chat/completions")
    
    # MongoDB
    MONGODB_URI: str = os.getenv("MONGODB_URI", "")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "SpeakMate")
    VECTOR_SEARCH_ENABLED: bool = os.getenv("VECTOR_SEARCH_ENABLED", "false").lower() == "true"
    
    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # Deepgram Settings
    DEEPGRAM_MODEL: str = "nova-3"
    DEEPGRAM_LANGUAGE: str = "en-US"
    DEEPGRAM_SMART_FORMAT: bool = True
    DEEPGRAM_PUNCTUATE: bool = True
    
    # Voice Settings
    TTS_VOICE: str = "aura-asteria-en"  
    
    # LLM Settings
    GROQ_MODEL: str = "llama-3.3-70b-versatile"  
    MAX_TOKENS: int = 1024
    TEMPERATURE: float = 0.7
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # LangChain / LangSmith
    LANGCHAIN_TRACING_V2: bool = os.getenv("LANGCHAIN_TRACING_V2", "false").lower() == "true"
    LANGCHAIN_ENDPOINT: str = os.getenv("LANGCHAIN_ENDPOINT", "https://api.smith.langchain.com")
    LANGCHAIN_API_KEY: str = os.getenv("LANGCHAIN_API_KEY", "")
    LANGCHAIN_PROJECT: str = os.getenv("LANGCHAIN_PROJECT", "SpeakMate")

settings = Settings()
