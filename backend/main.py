"""Main FastAPI application for SpeakMate."""
import asyncio
import base64
import json
import logging
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Dict, Any, Optional, List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uuid
import time

from config import settings
from models.database import db, get_database
from models.schemas import (
    SessionCreate,
    SessionResponse,
    ProficiencyLevel,
    ConversationTopic,
    FeedbackResponse,
    TextPracticeRequest,
)
from services.voice_agent import voice_agent, DeepgramVoiceAgent, TranscriptResult
from services.llm_service import llm_service
from rag.retrieval import rag_retrieval
from rag.learning_materials import initialize_default_materials
from analytics.progress_tracker import progress_tracker
from middleware.auth import get_current_user, verify_deepgram_request
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events for the FastAPI application."""
    logger.info("=== Starting SpeakMate Backend ===")
    
    # Track initialization status
    status = {
        "database": False,
        "rag": False,
        "llm": False,
        "voice": False
    }
    
    try:
        # Initialize Database
        await db.connect()
        status["database"] = True
        logger.info("✓ Database connected")
        
        # Initialize Services
        await rag_retrieval.initialize()
        status["rag"] = True
        logger.info("✓ RAG retrieval initialized")
        
        await llm_service.initialize()
        status["llm"] = True
        logger.info("✓ LLM service initialized")
        
        await voice_agent.initialize()
        status["voice"] = True
        logger.info("✓ Voice agent initialized")
        
        # Load default materials
        await initialize_default_materials(db)
        
        app.state.initialization_status = status
        
    except Exception as e:
        logger.error(f"Critical startup failure: {e}")
        # Allow degraded mode
        app.state.initialization_status = status

    yield
    
    # Shutdown
    logger.info("Shutting down...")
    await db.disconnect()
    logger.info("=== SpeakMate Backend Shutdown ===")


# Create FastAPI app
app = FastAPI(
    title="SpeakMate",
    description="Real-time English speaking practice with AI feedback",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
# Check if CORS_ORIGINS is "*" and allow_credentials is True, which is invalid
origins = settings.CORS_ORIGINS
if "*" in origins:
    if True: # allow_credentials=True requires specific origins
        origins = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://speak-mate.vercel.app" # Placeholder for production
        ]
        logger.warning("CORS: Wildcard origin detected with credentials enabled. Falling back to specific origins.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Request-ID"],
)


# ============ Middleware ============

@app.middleware("http")
async def add_request_id_header(request: Request, call_next):
    """Add request ID to request state and response headers."""
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = str(process_time)
    
    # Simple summary log (could be more descriptive, but keeping it brief)
    logger.info(f"REQ: {request_id} | {request.method} {request.url.path} | {response.status_code} | {process_time:.3f}s")
    
    return response


# ============ Error Handlers ============

from models.schemas import ErrorResponse, ErrorDetail

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for all unhandled errors."""
    request_id = getattr(request.state, "request_id", "unknown")
    logger.error(f"ERR: {request_id} | Unhandled error: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error=ErrorDetail(message="An internal server error occurred", code="INTERNAL_ERROR"),
            request_id=request_id
        ).dict()
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Exception handler for HTTPExceptions."""
    request_id = getattr(request.state, "request_id", "unknown")
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error=ErrorDetail(message=exc.detail, code="HTTP_ERROR"),
            request_id=request_id
        ).dict()
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
    """Detailed health check endpoint."""
    status = getattr(app.state, "initialization_status", {
        "database": "unknown",
        "rag": "unknown",
        "llm": "unknown",
        "voice": "unknown"
    })
    
    all_ok = all(s is True for s in status.values())
    
    return {
        "status": "healthy" if all_ok else "degraded",
        "timestamp": datetime.utcnow().isoformat(),
        "services": status
    }


# ============ Session Endpoints ============

@app.post("/api/sessions", response_model=SessionResponse)
async def create_session(session_data: SessionCreate, user: dict = Depends(get_current_user)):
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
            voice_id=session_data.voice_id,
            created_at=session.get("created_at", datetime.utcnow()),
            status="active",
        )
        
    except Exception as e:
        logger.error(f"Failed to create session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sessions/{session_id}/progress")
async def get_session_progress(session_id: str, user: dict = Depends(get_current_user)):
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
async def end_session(session_id: str, user: dict = Depends(get_current_user)):
    """End a practice session and get summary."""
    try:
        summary = await progress_tracker.end_session(session_id)
        return summary
        
    except Exception as e:
        logger.error(f"Failed to end session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ User Analytics ============

@app.get("/api/user/{user_id}/analytics")
async def get_user_analytics(user_id: str, days: int = 30, user: dict = Depends(get_current_user)):
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
        
        # Add WAV header
        import struct
        data_size = len(audio_content)
        sample_rate = 24000
        header = struct.pack('<4sI4s4sIHHIIHH4sI',
            b'RIFF', 36 + data_size, b'WAVE', b'fmt ',
            16, 1, 1, sample_rate, sample_rate * 2, 2, 16, b'data', data_size
        )
        wav_content = header + audio_content
        
        # Return as base64
        import base64
        return {
            "get_audio_url": False, # Flag for frontend
            "audio": base64.b64encode(wav_content).decode("utf-8"),
            "format": "audio/wav",
            "sample_rate": sample_rate
        }
    except Exception as e:
        logger.error(f"Voice preview failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ WebSocket Voice Endpoint with Deepgram Voice Agent ============

@app.websocket("/ws/voice")
async def voice_websocket(websocket: WebSocket):
    """WebSocket endpoint for voice practice using Deepgram Voice Agent API."""
    token = websocket.query_params.get("token")
    
    # Simple token validation for WebSocket
    expected_secret = getattr(settings, "AUTH_SECRET", settings.DEEPGRAM_API_KEY[:10])
    if not token or token != expected_secret:
        logger.warning(f"Unauthorized WebSocket attempt. Token: {token}")
        await websocket.accept() # Accept then close with error for better client handling
        await websocket.send_json({"type": "error", "message": "Unauthorized"})
        await websocket.close(code=4001)
        return

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
                    
                elif data.get("type") == "text":
                    # Handle text message
                    text = data.get("text")
                    if text and agent:
                        # Forward to the voice agent's output callbacks directly by simulating agent text
                        # or better, let the voice agent think about this text.
                        # Deepgram Voice Agent V1 doesn't have a direct "InjectText" in its binary protocol easily visible here,
                        # but we can call the practice graph ourselves.
                        
                        # Add to transcript
                        await websocket.send_json({
                            "type": "final_transcript",
                            "text": text,
                            "confidence": 1.0,
                            "is_final": True,
                        })
                        
                        # Run graph
                        from services.practice_graph import practice_graph
                        # Get current history (simplistic for now)
                        result = await practice_graph.run(
                            user_input=text,
                            history=[], # In a real app, we'd pull history from DB/state
                            level=level,
                            topic=topic
                        )
                        
                        ai_response = result["messages"][-1].content
                        
                        # Send text response
                        await websocket.send_json({
                            "type": "feedback",
                            "text": ai_response,
                            "grammar_corrections": [],
                            "vocabulary_suggestions": [],
                            "pronunciation_tips": [],
                            "follow_up_question": None,
                        })
                        
                        # Generate TTS and send
                        audio_chunk = await voice_agent.text_to_speech_with_voice(ai_response, voice_id)
                        audio_b64 = base64.b64encode(audio_chunk).decode("utf-8")
                        await websocket.send_json({
                            "type": "audio",
                            "audio": audio_b64,
                            "format": "linear16",
                            "sample_rate": 24000,
                        })
    
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
async def text_practice(request: TextPracticeRequest):
    """Text-based practice endpoint (for testing or no-mic scenarios)."""
    try:
        text = request.text
        level = request.level
        topic = request.topic
        
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
async def llm_think(request: Dict[str, Any], verified: bool = Depends(verify_deepgram_request)):
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
        
        for msg in messages_raw[:-1]:
            role = msg.get("role")
            content = msg.get("content", "")
            if role == "user":
                history.append(HumanMessage(content=content))
            elif role == "assistant":
                history.append(AIMessage(content=content))
                
        if messages_raw:
            last_msg = messages_raw[-1]
            if last_msg.get("role") == "user":
                user_input = last_msg.get("content", "")
            else:
                user_input = ""
                history.append(AIMessage(content=last_msg.get("content", "")))
                
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
