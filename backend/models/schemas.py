"""Pydantic schemas for API request/response models."""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ProficiencyLevel(str, Enum):
    """User proficiency levels."""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class ConversationTopic(str, Enum):
    """Available conversation topics."""
    DAILY_LIFE = "daily_life"
    BUSINESS = "business"
    TRAVEL = "travel"
    ACADEMIC = "academic"
    FREE_TALK = "free_talk"


# ============ Session Schemas ============

class SessionCreate(BaseModel):
    """Request model for creating a new practice session."""
    user_id: Optional[str] = Field(default=None, description="User ID if authenticated")
    level: ProficiencyLevel = Field(default=ProficiencyLevel.INTERMEDIATE)
    topic: ConversationTopic = Field(default=ConversationTopic.FREE_TALK)
    voice_id: str = Field(default="aura-2-thalia-en", description="Deepgram TTS voice ID")


class SessionResponse(BaseModel):
    """Response model for session creation."""
    session_id: str
    user_id: Optional[str]
    level: ProficiencyLevel
    topic: ConversationTopic
    voice_id: str
    created_at: datetime
    status: str = "active"


# ============ Transcript Schemas ============

class WordConfidence(BaseModel):
    """Word-level confidence from transcription."""
    word: str
    confidence: float
    start: float
    end: float


class TranscriptMessage(BaseModel):
    """Real-time transcript message."""
    type: str = Field(..., description="interim_transcript or final_transcript")
    text: str
    confidence: Optional[float] = None
    is_final: bool = False
    words: Optional[List[WordConfidence]] = None


# ============ Feedback Schemas ============

class GrammarCorrection(BaseModel):
    """Grammar correction feedback."""
    original: str
    corrected: str
    explanation: str
    rule: Optional[str] = None


class VocabularySuggestion(BaseModel):
    """Vocabulary improvement suggestion."""
    word: str
    definition: str
    usage_example: str
    level: ProficiencyLevel


class PronunciationTip(BaseModel):
    """Pronunciation improvement tip."""
    word: str
    phonetic: str
    tip: str
    confidence_score: float


class FeedbackResponse(BaseModel):
    """Complete feedback response from LLM."""
    type: str = "feedback"
    text: str  # Natural language feedback
    grammar_corrections: List[GrammarCorrection] = Field(default_factory=list)
    vocabulary_suggestions: List[VocabularySuggestion] = Field(default_factory=list)
    pronunciation_tips: List[PronunciationTip] = Field(default_factory=list)
    follow_up_question: Optional[str] = None


# ============ Progress Schemas ============

class SessionProgress(BaseModel):
    """Progress metrics for a single session."""
    session_id: str
    duration_seconds: int
    turns_count: int
    avg_confidence: float
    grammar_mistakes: int
    vocabulary_learned: List[str]
    topics_practiced: List[str]


class UserAnalytics(BaseModel):
    """Overall user analytics."""
    user_id: str
    total_sessions: int
    total_practice_time_seconds: int
    avg_confidence_trend: List[float]
    common_mistakes: List[str]
    vocabulary_mastered: List[str]
    improvement_score: float


# ============ Learning Material Schemas ============

class GrammarRule(BaseModel):
    """Grammar rule for RAG context."""
    topic: str
    level: ProficiencyLevel
    content: str
    examples: List[str]
    common_mistakes: List[str]


class VocabularyItem(BaseModel):
    """Vocabulary item for RAG context."""
    word: str
    definition: str
    level: ProficiencyLevel
    usage: str
    pronunciation: str


class TextPracticeRequest(BaseModel):
    """Request model for text practice endpoint."""
    text: str
    session_id: Optional[str] = None
    level: ProficiencyLevel = ProficiencyLevel.INTERMEDIATE
    topic: ConversationTopic = ConversationTopic.FREE_TALK


class PronunciationGuide(BaseModel):
    """Pronunciation guide for RAG context."""
    word: str
    phonetic: str
    common_mistakes: str
    tips: str


# ============ WebSocket Schemas ============

class WSMessage(BaseModel):
    """Generic WebSocket message."""
    type: str
    data: dict


class WSAudioChunk(BaseModel):
    """Audio chunk from client."""
    type: str = "audio"
    audio: str  # Base64 encoded audio


class WSControlMessage(BaseModel):
    """Control message for WebSocket."""
    type: str  # start, stop, pause, resume
    session_id: Optional[str] = None
    settings: Optional[dict] = None

class ErrorDetail(BaseModel):
    message: str
    code: Optional[str] = None
    field: Optional[str] = None

class ErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail
    request_id: Optional[str] = None
