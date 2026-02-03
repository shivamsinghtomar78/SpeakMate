"""Main FastAPI application for SpeakMate."""
import asyncio
import base64
import json
import logging
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Dict, Any, Optional, List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from models.database import db, get_database
from models.schemas import (
    SessionCreate,
    SessionResponse,
    ProficiencyLevel,
    ConversationTopic,
    FeedbackResponse,
)
from services.voice_agent import voice_agent, DeepgramVoiceAgent, TranscriptResult
from services.llm_service import llm_service
from rag.retrieval import rag_retrieval
from rag.learning_materials import initialize_default_materials
from analytics.progress_tracker import progress_tracker
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    logger.info("Starting SpeakMate...")
    
    try:
        # Connect to database
        await db.connect()
        
        # Initialize services
        await voice_agent.initialize()
        await llm_service.initialize()
        await rag_retrieval.initialize()
        
        # Load default learning materials
        await initialize_default_materials(db)
        
        logger.info("All services initialized successfully")
        
    except Exception as e:
        logger.error(f"Startup failed: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    await db.disconnect()


# Create FastAPI app
app = FastAPI(
    title="SpeakMate",
    description="Real-time English speaking practice with AI feedback",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS + ["*"],  # Allow all for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ Health Check ============

@app.get("/")
async def root():
    """Root endpoint for health checks."""
    return {
        "message": "SpeakMate API is running",
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "database": "connected" if db.client else "disconnected",
            "voice_agent": "ready" if voice_agent.client else "not_initialized",
            "llm": "ready" if llm_service.client else "not_initialized",
        }
    }


# ============ Session Endpoints ============

@app.post("/api/sessions", response_model=SessionResponse)
async def create_session(session_data: SessionCreate):
    """Create a new practice session."""
    try:
        session_id = await progress_tracker.start_session(
            user_id=session_data.user_id,
            level=session_data.level.value,
            topic=session_data.topic.value,
            voice_id=session_data.voice_id
        )
        
        session = await db.get_session(session_id)
        
        return SessionResponse(
            session_id=session_id,
            user_id=session_data.user_id,
            level=session_data.level,
            topic=session_data.topic,
            created_at=session.get("created_at", datetime.utcnow()),
            status="active",
        )
        
    except Exception as e:
        logger.error(f"Failed to create session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sessions/{session_id}/progress")
async def get_session_progress(session_id: str):
    """Get progress for a specific session."""
    try:
        session = await db.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {
            "session_id": session_id,
            "status": session.get("status", "unknown"),
            "level": session.get("level"),
            "topic": session.get("topic"),
            "metrics": session.get("metrics", {}),
            "turns_count": len(session.get("turns", [])),
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get session progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/sessions/{session_id}/end")
async def end_session(session_id: str):
    """End a practice session and get summary."""
    try:
        summary = await progress_tracker.end_session(session_id)
        return summary
        
    except Exception as e:
        logger.error(f"Failed to end session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ User Analytics ============

@app.get("/api/user/{user_id}/analytics")
async def get_user_analytics(user_id: str, days: int = 30):
    """Get overall user analytics."""
    try:
        analytics = await progress_tracker.get_user_analytics(user_id, days)
        return analytics
        
    except Exception as e:
        logger.error(f"Failed to get user analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ Learning Materials ============

@app.get("/api/materials/grammar")
async def get_grammar_rules(level: Optional[str] = None):
    """Get grammar rules, optionally filtered by level."""
    try:
        rules = await db.get_grammar_rules(level=level)
        return {"grammar_rules": rules}
    except Exception as e:
        logger.error(f"Failed to get grammar rules: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/materials/vocabulary")
async def get_vocabulary(level: Optional[str] = None, limit: int = 20):
    """Get vocabulary items, optionally filtered by level."""
    try:
        vocab = await db.get_vocabulary(level=level, limit=limit)
        return {"vocabulary": vocab}
    except Exception as e:
        logger.error(f"Failed to get vocabulary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/voice/preview")
async def voice_preview(data: dict):
    """Generate a short audio preview for a voice."""
    try:
        voice_id = data.get("voice_id", settings.TTS_VOICE)
        text = data.get("text", "Hello! I am your English practice partner. Let's talk!")
        
        # Use existing legacy TTS method which uses REST API
        audio_content = await voice_agent.text_to_speech_with_voice(text, voice_id)
        
        # Return as base64 to avoid issues with raw bytes in JSON or just return audio/wav
        import base64
        return {
            "audio": base64.b64encode(audio_content).decode("utf-8"),
            "format": "linear16",
            "sample_rate": 24000
        }
    except Exception as e:
        logger.error(f"Voice preview failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ WebSocket Voice Endpoint with Deepgram Voice Agent ============

@app.websocket("/ws/voice")
async def voice_websocket(websocket: WebSocket):
    """WebSocket endpoint for voice practice using Deepgram Voice Agent API."""
    await websocket.accept()
    
    session_id = None
    agent: Optional[DeepgramVoiceAgent] = None
    
    try:
        # Wait for session initialization
        init_data = await websocket.receive_json()
        
        if init_data.get("type") != "init":
            await websocket.send_json({"type": "error", "message": "Expected init message"})
            await websocket.close()
            return
        
        level = init_data.get("level", "intermediate")
        topic = init_data.get("topic", "free_talk")
        voice_id = init_data.get("voice_id", "aura-2-thalia-en")
        user_id = init_data.get("user_id")
        
        # Create session in database
        session_id = await progress_tracker.start_session(
            user_id=user_id,
            level=level,
            topic=topic,
            voice_id=voice_id
        )
        
        logger.info(f"Started session {session_id} for user {user_id} (level={level}, topic={topic})")
        
        # Send session confirmation
        await websocket.send_json({
            "type": "session_started",
            "session_id": session_id,
            "level": level,
            "topic": topic,
        })
        
        # Create Deepgram Voice Agent
        agent = DeepgramVoiceAgent()
        
        # Define callbacks
        async def on_transcript(result: TranscriptResult):
            """Handle user transcript."""
            logger.info(f"User said: {result.text}")
            await websocket.send_json({
                "type": "final_transcript",
                "text": result.text,
                "confidence": result.confidence,
                "is_final": True,
            })
            
            # Record in progress tracker
            await progress_tracker.record_turn(
                session_id=session_id,
                user_text=result.text,
                confidence_scores=[],
                feedback={}
            )
        
        async def on_agent_text(text: str):
            """Handle agent text response."""
            logger.info(f"Agent said: {text}")
            await websocket.send_json({
                "type": "feedback",
                "text": text,
                "grammar_corrections": [],
                "vocabulary_suggestions": [],
                "pronunciation_tips": [],
                "follow_up_question": None,
            })
        
        async def on_agent_audio(audio_chunk: bytes):
            """Handle agent audio response."""
            audio_b64 = base64.b64encode(audio_chunk).decode("utf-8")
            await websocket.send_json({
                "type": "audio",
                "audio": audio_b64,
                "format": "linear16",
                "sample_rate": 24000,
            })
        
        async def on_error(error: Exception):
            """Handle errors."""
            logger.error(f"Voice Agent error: {error}")
            await websocket.send_json({
                "type": "error",
                "message": str(error)
            })
        
        # Connect to Deepgram Voice Agent
        connected = await agent.connect(
            level=level,
            topic=topic,
            on_transcript=on_transcript,
            on_agent_text=on_agent_text,
            on_agent_audio=on_agent_audio,
            on_error=on_error,
            voice_id=voice_id
        )
        
        if not connected:
            await websocket.send_json({"type": "error", "message": "Failed to connect to voice agent"})
            await websocket.close()
            return
        
        logger.info("Voice Agent connected, starting audio stream...")
        
        # Main message loop - forward audio to Voice Agent
        while True:
            message = await websocket.receive()
            
            if message["type"] == "websocket.disconnect":
                break
            
            if "bytes" in message:
                # Raw audio data - forward to Voice Agent
                await agent.send_audio(message["bytes"])
                
            elif "text" in message:
                data = json.loads(message["text"])
                
                if data.get("type") == "audio":
                    # Base64 encoded audio
                    audio_bytes = base64.b64decode(data["audio"])
                    await agent.send_audio(audio_bytes)
                    
                elif data.get("type") == "stop":
                    # Stop session
                    break
    
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {session_id}")
        
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except:
            pass
    
    finally:
        # Cleanup
        if agent:
            await agent.disconnect()
        
        if session_id:
            try:
                await progress_tracker.end_session(session_id)
            except:
                pass


# ============ Text-based Practice Endpoint ============

@app.post("/api/practice/text")
async def text_practice(
    text: str,
    session_id: Optional[str] = None,
    level: ProficiencyLevel = ProficiencyLevel.INTERMEDIATE,
    topic: ConversationTopic = ConversationTopic.FREE_TALK,
):
    """Text-based practice endpoint (for testing or no-mic scenarios)."""
    try:
        # Get RAG context
        context = await rag_retrieval.retrieve_context(text, level=level.value)
        
        # Generate feedback
        feedback = await llm_service.generate_feedback(
            user_text=text,
            confidence_scores=[],
            level=level,
            topic=topic.value,
            rag_context=context,
        )
        
        return {
            "user_input": text,
            "feedback": feedback.text,
            "grammar_corrections": [c.dict() for c in feedback.grammar_corrections],
            "follow_up_question": feedback.follow_up_question,
        }
        
    except Exception as e:
        logger.error(f"Text practice failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/llm/think")
async def llm_think(request: Dict[str, Any]):
    """
    OpenAI-compatible endpoint for Deepgram Voice Agent to use LangGraph.
    This allows the Voice Agent to benefit from RAG and LangSmith tracing.
    """
    try:
        messages_raw = request.get("messages", [])
        
        # Extract metadata from system prompt or defaults
        level = "intermediate"
        topic = "free_talk"
        
        history = []
        user_input = ""
        
        for msg in messages_raw:
            role = msg.get("role")
            content = msg.get("content", "")
            if role == "system":
                # Try to extract level and topic from our own prompt format
                if "USER LEVEL: BEGINNER" in content: level = "beginner"
                elif "USER LEVEL: ADVANCED" in content: level = "advanced"
                
                if "TOPIC: daily_life" in content: topic = "daily_life"
                elif "TOPIC: business" in content: topic = "business"
                elif "TOPIC: travel" in content: topic = "travel"
                elif "TOPIC: academic" in content: topic = "academic"
            elif role == "user":
                user_input = content
            elif role == "assistant":
                history.append(AIMessage(content=content))
                
        # Run LangGraph
        from services.practice_graph import practice_graph
        result = await practice_graph.run(
            user_input=user_input,
            history=history,
            level=level,
            topic=topic
        )
        
        ai_response = result["messages"][-1].content
        
        # Return OpenAI compatible format
        return {
            "id": f"chatcmpl-{datetime.utcnow().timestamp()}",
            "object": "chat.completion",
            "created": int(datetime.utcnow().timestamp()),
            "model": settings.GROQ_MODEL,
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": ai_response,
                    },
                    "finish_reason": "stop"
                }
            ],
            "usage": {
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_tokens": 0
            }
        }
    except Exception as e:
        logger.error(f"LangGraph think endpoint failed: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


# ============ Run Application ============

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
