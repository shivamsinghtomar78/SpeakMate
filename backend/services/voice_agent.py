"""Deepgram Voice Agent service using the Voice Agent V1 API for real-time conversation."""
import asyncio
import os
import json
import logging
import base64
import websockets
from typing import Optional, Callable, Any, Dict
from dataclasses import dataclass

from config import settings

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


@dataclass
class TranscriptResult:
    """Result from transcription."""
    text: str
    confidence: float
    is_final: bool
    words: list


@dataclass 
class AgentResponse:
    """Response from the AI agent."""
    text: str
    audio: Optional[bytes] = None


class DeepgramVoiceAgent:
    """Deepgram Voice Agent using V1 API for real-time conversation."""
    
    AGENT_URL = "wss://agent.deepgram.com/v1/agent/converse"
    
    def __init__(self):
        self.ws: Optional[websockets.WebSocketClientProtocol] = None
        self.is_connected = False
        
        # Callbacks
        self.on_transcript: Optional[Callable[[TranscriptResult], Any]] = None
        self.on_agent_text: Optional[Callable[[str], Any]] = None
        self.on_agent_audio: Optional[Callable[[bytes], Any]] = None
        self.on_error: Optional[Callable[[Exception], Any]] = None
        
        # Audio buffer for agent responses
        self.audio_buffer = bytearray()
        
        # Receive task
        self._receive_task: Optional[asyncio.Task] = None
        
    async def connect(
        self,
        level: str = "intermediate",
        topic: str = "free_talk",
        voice_id: str = "aura-2-thalia-en",
        on_transcript: Optional[Callable] = None,
        on_agent_text: Optional[Callable] = None,
        on_agent_audio: Optional[Callable] = None,
        on_error: Optional[Callable] = None,
    ):
        """Connect to Deepgram Voice Agent API."""
        self.on_transcript = on_transcript
        self.on_agent_text = on_agent_text
        self.on_agent_audio = on_agent_audio
        self.on_error = on_error
        
        try:
            # Connect to Deepgram Voice Agent WebSocket
            headers = {
                "Authorization": f"Token {settings.DEEPGRAM_API_KEY}",
            }
            
            self.ws = await websockets.connect(
                self.AGENT_URL,
                additional_headers=headers,
            )
            
            self.is_connected = True
            logger.info("Connected to Deepgram Voice Agent API")
            
            # Send settings configuration
            await self._send_settings(level, topic, voice_id)
            
            # Start receiving messages
            self._receive_task = asyncio.create_task(self._receive_loop())
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to Deepgram Voice Agent: {e}")
            self.is_connected = False
            if self.on_error:
                await self.on_error(e)
            return False
    
    async def _send_settings(self, level: str, topic: str, voice_id: str = "aura-2-thalia-en"):
        """Send settings configuration to the agent."""
        # Customize prompt based on level and topic
        level_prompts = {
            "beginner": "Speak slowly and use simple vocabulary. Keep sentences short.",
            "intermediate": "Use natural conversation speed with moderate vocabulary.",
            "advanced": "Use complex vocabulary, idioms, and natural speech patterns.",
        }
        
        topic_prompts = {
            "free_talk": "Have an open conversation about any topic the user wants.",
            "daily_life": "Focus on everyday situations like shopping, cooking, or daily routines.",
            "business": "Discuss professional topics like meetings, presentations, or workplace scenarios.",
            "travel": "Talk about travel experiences, destinations, and travel-related situations.",
            "academic": "Discuss educational topics, study habits, or academic subjects.",
        }
        
        system_prompt = f"""You are SpeakMate, an AI English speaking practice partner. Your role is to:
1. Have natural conversations to help the user practice English
2. {level_prompts.get(level, level_prompts['intermediate'])}
3. {topic_prompts.get(topic, topic_prompts['free_talk'])}
4. Gently correct grammar mistakes when appropriate
5. Encourage the user and keep the conversation flowing
6. Ask follow-up questions to keep them talking
7. Keep responses concise (1-3 sentences)

Be warm, patient, and supportive. Focus on helping them improve their English speaking skills."""

        # Use Groq as the LLM provider via custom endpoint
        settings_message = {
            "type": "Settings",
            "audio": {
                "input": {
                    "encoding": "linear16",
                    "sample_rate": 16000
                },
                "output": {
                    "encoding": "linear16",
                    "sample_rate": 24000,
                    "container": "none"
                }
            },
            "agent": {
                "language": "en",
                "listen": {
                    "provider": {
                        "type": "deepgram",
                        "model": settings.DEEPGRAM_MODEL
                    }
                },
                "think": {
                    "provider": {
                        "type": "groq",
                        "model": settings.GROQ_MODEL,
                        "temperature": 0.7
                    },
                    "endpoint": {
                        "url": f"{settings.APP_URL}/api/llm/think",
                        "headers": {
                            "Content-Type": "application/json"
                        }
                    },
                    "prompt": system_prompt
                },
                "speak": {
                    "provider": {
                        "type": "deepgram",
                        "model": voice_id or settings.TTS_VOICE
                    }
                },
                "greeting": self._get_greeting(level)
            }
        }
        
        await self.ws.send(json.dumps(settings_message))
        logger.info("Sent Voice Agent settings with Groq LLM")
        
        # Mask credentials in logs
        try:
            log_settings = json.loads(json.dumps(settings_message))
            if "agent" in log_settings and "think" in log_settings["agent"]:
                headers = log_settings["agent"]["think"].get("endpoint", {}).get("headers", {})
                if "Authorization" in headers:
                    headers["Authorization"] = "Bearer [MASKED]"
            logger.debug(f"Settings: {json.dumps(log_settings, indent=2)}")
        except Exception:
            logger.debug("Sent settings (masking failed)")
    
    def _get_greeting(self, level: str) -> str:
        """Get appropriate greeting based on level."""
        greetings = {
            "beginner": "Hello! I am here to help you practice English. Say hello to start!",
            "intermediate": "Hi there! I'm excited to practice English with you today. What would you like to talk about?",
            "advanced": "Welcome! I'm looking forward to having an engaging conversation with you. What's on your mind?",
        }
        return greetings.get(level, greetings["intermediate"])
    
    async def _receive_loop(self):
        """Receive and process messages from the Voice Agent."""
        try:
            while self.is_connected and self.ws:
                try:
                    message = await self.ws.recv()
                    
                    # Handle binary audio data
                    if isinstance(message, bytes):
                        logger.debug(f"Received audio chunk: {len(message)} bytes")
                        self.audio_buffer.extend(message)
                        
                        # Send audio chunks immediately for playback
                        if self.on_agent_audio:
                            await self.on_agent_audio(message)
                        continue
                    
                    # Handle JSON messages
                    data = json.loads(message)
                    msg_type = data.get("type", "Unknown")
                    
                    logger.info(f"Received event: {msg_type}")
                    logger.debug(f"Event data: {data}")
                    
                    if msg_type == "Welcome":
                        logger.info(f"Voice Agent welcome: {data}")
                        
                    elif msg_type == "SettingsApplied":
                        logger.info("Voice Agent settings applied successfully!")
                        
                    elif msg_type == "ConversationText":
                        role = data.get("role", "")
                        content = data.get("content", "")
                        logger.info(f"[{role}]: {content}")
                        
                        if role == "user" and self.on_transcript:
                            result = TranscriptResult(
                                text=content,
                                confidence=1.0,
                                is_final=True,
                                words=[]
                            )
                            await self.on_transcript(result)
                            
                        elif role == "assistant" and self.on_agent_text:
                            await self.on_agent_text(content)
                            
                    elif msg_type == "UserStartedSpeaking":
                        logger.info("User started speaking")
                        # Clear audio buffer for new response
                        self.audio_buffer = bytearray()
                        
                    elif msg_type == "AgentThinking":
                        logger.info("Agent is thinking...")
                        
                    elif msg_type == "AgentStartedSpeaking":
                        logger.info("Agent started speaking")
                        self.audio_buffer = bytearray()
                        
                    elif msg_type == "AgentAudioDone":
                        logger.info(f"Agent finished speaking ({len(self.audio_buffer)} bytes)")
                        
                    elif msg_type == "Interrupt":
                        logger.info("Conversation interrupted")
                        
                    elif msg_type == "Error":
                        error_msg = data.get("message", "Unknown error")
                        logger.error(f"Voice Agent error: {error_msg}")
                        if self.on_error:
                            await self.on_error(Exception(error_msg))
                            
                except websockets.exceptions.ConnectionClosed:
                    logger.info("Voice Agent connection closed")
                    break
                    
        except asyncio.CancelledError:
            logger.info("Receive loop cancelled")
        except Exception as e:
            logger.error(f"Error in receive loop: {e}")
            if self.on_error:
                await self.on_error(e)
        finally:
            self.is_connected = False
    
    async def send_audio(self, audio_data: bytes):
        """Send audio data to the Voice Agent."""
        if self.ws and self.is_connected:
            try:
                await self.ws.send(audio_data)
            except Exception as e:
                logger.error(f"Failed to send audio: {e}")
    
    async def disconnect(self):
        """Disconnect from the Voice Agent."""
        self.is_connected = False
        
        if self._receive_task:
            self._receive_task.cancel()
            try:
                await self._receive_task
            except asyncio.CancelledError:
                pass
            self._receive_task = None
        
        if self.ws:
            try:
                await self.ws.close()
            except:
                pass
            self.ws = None
        
        logger.info("Disconnected from Deepgram Voice Agent")


# Legacy compatibility wrapper
class VoiceAgentService:
    """Wrapper for backward compatibility with existing code."""
    
    def __init__(self):
        self.client = None
        self.is_connected = False
        self.agent: Optional[DeepgramVoiceAgent] = None
        
        self.on_transcript: Optional[Callable] = None
        self.on_error: Optional[Callable] = None
        
    async def initialize(self):
        """Initialize the service."""
        self.client = True  # Just a flag for health check
        logger.info("Deepgram client initialized")
    
    async def start_listening(
        self,
        on_transcript: Callable[[TranscriptResult], Any],
        on_error: Optional[Callable[[Exception], Any]] = None
    ):
        """Start listening - now uses Voice Agent API."""
        self.on_transcript = on_transcript
        self.on_error = on_error
        self.is_connected = True
        logger.info("Deepgram live transcription started")
    
    async def send_audio(self, audio_data: bytes):
        """Send audio - delegates to agent if connected."""
        if self.agent and self.agent.is_connected:
            await self.agent.send_audio(audio_data)
    
    async def stop_listening(self):
        """Stop listening."""
        self.is_connected = False
        logger.info("Deepgram live transcription stopped")
    
    async def text_to_speech(self, text: str) -> bytes:
        """Generate TTS using default voice."""
        return await self.text_to_speech_with_voice(text, settings.TTS_VOICE)

    async def text_to_speech_with_voice(self, text: str, voice_id: str) -> bytes:
        """Generate TTS using REST API with a specific voice ID."""
        import httpx
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.deepgram.com/v1/speak",
                params={
                    "model": voice_id,
                    "encoding": "linear16",
                    "sample_rate": "24000",
                },
                headers={
                    "Authorization": f"Token {settings.DEEPGRAM_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={"text": text},
            )
            
            if response.status_code == 200:
                return response.content
            else:
                raise Exception(f"TTS failed: {response.status_code} - {response.text}")


# Singleton instances
voice_agent = VoiceAgentService()
