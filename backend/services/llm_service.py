"""LLM service for generating English learning feedback using Groq."""
import logging
import json
from typing import Optional, List, Dict, Any
from groq import AsyncGroq

from config import settings
from services.practice_graph import practice_graph
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from models.schemas import (
    ProficiencyLevel,
    GrammarCorrection,
    VocabularySuggestion,
    PronunciationTip,
    FeedbackResponse,
)

logger = logging.getLogger(__name__)


class LLMService:
    """Groq LLM service for generating English learning feedback."""
    
    def __init__(self):
        self.client: Optional[AsyncGroq] = None
        
    async def initialize(self):
        """Initialize Groq client."""
        try:
            self.client = AsyncGroq(api_key=settings.GROQ_API_KEY)
            logger.info("Groq LLM client initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Groq: {e}")
            raise
    
    def _build_system_prompt(self, level: ProficiencyLevel, topic: str = "general") -> str:
        """Build system prompt based on user level and topic."""
        level_instructions = {
            ProficiencyLevel.BEGINNER: """
- Use simple vocabulary and short sentences
- Explain grammar concepts in very basic terms
- Give lots of encouragement
- Provide simple example corrections
- Focus on basic sentence structure
- Use common everyday words
""",
            ProficiencyLevel.INTERMEDIATE: """
- Use moderate vocabulary complexity
- Explain grammar rules with clear examples
- Balance corrections with positive feedback
- Introduce idioms and phrasal verbs occasionally
- Focus on improving fluency and accuracy
""",
            ProficiencyLevel.ADVANCED: """
- Use sophisticated vocabulary when appropriate
- Discuss nuanced grammar and style
- Focus on native-like expressions
- Introduce advanced idioms and collocations
- Emphasize precision and natural flow
- Challenge the learner with complex constructions
""",
        }
        
        return f"""You are a friendly, encouraging English conversation partner and teacher.
Your role is to help the learner improve their English speaking skills.

LEARNER LEVEL: {level.value.upper()}
CONVERSATION TOPIC: {topic}

LEVEL-SPECIFIC APPROACH:
{level_instructions.get(level, level_instructions[ProficiencyLevel.INTERMEDIATE])}

RESPONSE GUIDELINES:
1. Respond naturally to what the learner said
2. Gently correct any grammar or vocabulary mistakes
3. Explain why corrections are needed (briefly)
4. Note any pronunciation issues based on confidence scores
5. Suggest alternative ways to express the same idea
6. Always end with a follow-up question to continue the conversation
7. Be warm, patient, and encouraging

RESPONSE FORMAT:
- Keep responses conversational and not too long (2-4 sentences for feedback)
- If there are mistakes, address 1-2 main ones, don't overwhelm
- Use a natural, friendly tone
- After feedback, ask an engaging follow-up question

IMPORTANT: You are having a real conversation. Make it feel natural, not like a test."""
    
    async def generate_feedback(
        self,
        user_text: str,
        confidence_scores: List[Dict[str, Any]],
        level: ProficiencyLevel,
        topic: str = "general",
        rag_context: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> FeedbackResponse:
        """Generate comprehensive feedback for user's speech using LangGraph."""
        
        # Map conversation_history to LangChain messages
        history = []
        if conversation_history:
            for msg in conversation_history:
                if msg["role"] == "user":
                    history.append(HumanMessage(content=msg["content"]))
                else:
                    history.append(AIMessage(content=msg["content"]))
        
        try:
            # Run LangGraph
            result = await practice_graph.run(
                user_input=user_text,
                history=history,
                level=level.value,
                topic=topic
            )
            
            last_message = result["messages"][-1].content
            
            # Map result back to FeedbackResponse
            return FeedbackResponse(
                text=last_message,
                grammar_corrections=result.get("grammar_corrections", []),
                pronunciation_tips=self._extract_pronunciation_tips(low_confidence_words := [
                    w for w in confidence_scores if w.get("confidence", 1.0) < 0.8
                ]),
                follow_up_question=result.get("follow_up_question"),
            )
            
        except Exception as e:
            logger.error(f"LangGraph execution failed: {e}")
            return FeedbackResponse(
                text="That's interesting! Keep going.",
                follow_up_question="What else would you like to talk about?",
            )
    
    async def generate_quick_response(
        self,
        user_text: str,
        level: ProficiencyLevel,
        topic: str = "general"
    ) -> str:
        """Generate a quick conversational response without detailed analysis."""
        
        prompt = f"""You are an English conversation partner. Respond naturally to: "{user_text}"

Keep your response brief (1-2 sentences) and ask a follow-up question.
Be friendly and encouraging. Match the {level.value} proficiency level."""
        
        try:
            response = await self.client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8,
                max_tokens=150,
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Quick response generation failed: {e}")
            return "That's interesting! Tell me more."
    
    def _extract_grammar_corrections(
        self, 
        original_text: str, 
        feedback_text: str
    ) -> List[GrammarCorrection]:
        """Extract grammar corrections from feedback (simple heuristic)."""
        corrections = []
        
        # Simple patterns to detect corrections
        # In production, use structured output or function calling
        correction_indicators = [
            "should be",
            "instead of",
            "correct form is",
            "properly say",
        ]
        
        feedback_lower = feedback_text.lower()
        for indicator in correction_indicators:
            if indicator in feedback_lower:
                # Found a potential correction
                corrections.append(GrammarCorrection(
                    original=original_text,
                    corrected="(see feedback)",
                    explanation="See the feedback for details",
                ))
                break
        
        return corrections
    
    def _extract_pronunciation_tips(
        self, 
        low_confidence_words: List[Dict[str, Any]]
    ) -> List[PronunciationTip]:
        """Generate pronunciation tips for low-confidence words."""
        tips = []
        
        for word_data in low_confidence_words[:3]:  # Top 3 issues
            word = word_data.get("word", "")
            confidence = word_data.get("confidence", 0.0)
            
            if word and confidence < 0.7:
                tips.append(PronunciationTip(
                    word=word,
                    phonetic="",  # Would need pronunciation API
                    tip=f"This word may need clearer pronunciation",
                    confidence_score=confidence,
                ))
        
        return tips
    
    def _extract_follow_up(self, feedback_text: str) -> Optional[str]:
        """Extract follow-up question from feedback."""
        # Simple heuristic: find the last question
        sentences = feedback_text.split("?")
        if len(sentences) > 1:
            # Get the sentence before the last "?"
            question = sentences[-2].split(".")[-1].strip()
            if question:
                return question + "?"
        return None


# Singleton service instance
llm_service = LLMService()
