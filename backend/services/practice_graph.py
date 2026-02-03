"""LangGraph service for SpeakMate conversation and feedback flow."""
import operator
import json
import logging
from typing import Annotated, Sequence, TypedDict, Dict, Any, List, Optional

from langchain_groq import ChatGroq
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.graph import StateGraph, END
from langsmith import traceable

from config import settings
from rag.retrieval import rag_retrieval
from models.schemas import ProficiencyLevel

logger = logging.getLogger(__name__)

from pydantic import BaseModel, Field

class PracticeState(TypedDict):
    """State for the English practice LangGraph."""
    messages: Annotated[Sequence[BaseMessage], operator.add]
    level: str
    topic: str
    context: str
    grammar_corrections: List[Dict[str, str]]
    vocab_suggestions: List[Dict[str, str]]
    follow_up_question: Optional[str]

class FeedbackOutput(BaseModel):
    """Structured feedback from the AI partner."""
    grammar_corrections: List[Dict[str, str]] = Field(
        default_factory=list,
        description="List of corrections with 'original', 'corrected', and 'explanation'"
    )
    vocab_suggestions: List[Dict[str, str]] = Field(
        default_factory=list,
        description="List of suggestions with 'word', 'definition', and 'usage'"
    )
    follow_up_question: str = Field(description="The follow-up question to keep the conversation going")
    fluency_score: int = Field(description="A score from 0-100 indicating the user's fluency in this turn")

class PracticeGraph:
    """Orchestrates English practice sessions using LangGraph."""
    
    def __init__(self):
        self.llm = ChatGroq(
            api_key=settings.GROQ_API_KEY,
            model=settings.GROQ_MODEL,
            temperature=settings.TEMPERATURE,
            max_tokens=settings.MAX_TOKENS,
        )
        
        # Specialized LLM for structural extraction
        self.structured_llm = self.llm.with_structured_output(FeedbackOutput)
        
        # Build the graph
        workflow = StateGraph(PracticeState)
        
        # Add nodes
        workflow.add_node("retrieve_context", self.retrieve_context)
        workflow.add_node("generate_response", self.generate_response)
        workflow.add_node("analyze_feedback", self.analyze_feedback)
        
        # Define edges
        workflow.set_entry_point("retrieve_context")
        workflow.add_edge("retrieve_context", "generate_response")
        workflow.add_edge("generate_response", "analyze_feedback")
        workflow.add_edge("analyze_feedback", END)
        
        self.app = workflow.compile()

    @traceable(name="retrieve_context")
    async def retrieve_context(self, state: PracticeState):
        """Node: Fetch relevant RAG materials."""
        # Get last user message
        user_messages = [m for m in state["messages"] if isinstance(m, HumanMessage)]
        if not user_messages:
            return {"context": ""}
            
        last_message = user_messages[-1].content
        context = await rag_retrieval.retrieve_context(last_message, level=state["level"])
        return {"context": context}

    @traceable(name="generate_response")
    async def generate_response(self, state: PracticeState):
        """Node: Generate the AI partner's response."""
        system_prompt = self._build_system_prompt(state["level"], state["topic"], state["context"])
        
        # Filter messages for context window if needed
        messages = [SystemMessage(content=system_prompt)] + list(state["messages"])
        
        try:
            response = await self.llm.ainvoke(messages)
            return {"messages": [response]}
        except Exception as e:
            logger.error(f"Error in generate_response node: {e}")
            return {"messages": [AIMessage(content="I'm sorry, I'm having trouble thinking right now. Let's try again!")]}

    @traceable(name="analyze_feedback")
    async def analyze_feedback(self, state: PracticeState):
        """Node: Extract feedback and follow-up from the response using structured output."""
        last_ai_message = state["messages"][-1].content
        
        # Find the last user message to compare for feedback
        user_messages = [m for m in state["messages"] if isinstance(m, HumanMessage)]
        last_user_input = user_messages[-1].content if user_messages else ""
        
        prompt = f"""You are an English linguistic analyst. 
Based on the conversation and the AI's response, extract structured feedback.

USER SAID: {last_user_input}
AI RESPONDED: {last_ai_message}

Extract:
1. Any grammar corrections the AI made or should have made.
2. Any useful vocabulary suggestions.
3. The specific follow-up question the AI asked.
4. An estimated fluency score (0-100) based on the user's input.
"""
        try:
            feedback = await self.structured_llm.ainvoke(prompt)
            return {
                "follow_up_question": feedback.follow_up_question,
                "grammar_corrections": feedback.grammar_corrections,
                "vocab_suggestions": feedback.vocab_suggestions
            }
        except Exception as e:
            logger.error(f"Error in analyze_feedback node: {e}")
            # Fallback to simple extraction
            follow_up = last_ai_message.split('?')[-2].strip() + '?' if '?' in last_ai_message else None
            return {
                "follow_up_question": follow_up,
                "grammar_corrections": [],
                "vocab_suggestions": []
            }

    def _build_system_prompt(self, level: str, topic: str, context: str) -> str:
        """Create a targeted system prompt."""
        level_instructions = {
            "beginner": "Speak slowly and use simple vocabulary. Keep sentences short.",
            "intermediate": "Use natural conversation speed with moderate vocabulary.",
            "advanced": "Use complex vocabulary, idioms, and natural speech patterns.",
        }
        
        prompt = f"""You are SpeakMate, an AI English speaking practice partner.
Your goal is to have a natural conversation while helping the user improve.

USER LEVEL: {level.upper()}
TOPIC: {topic}

INSTRUCTIONS:
1. {level_instructions.get(level.lower(), level_instructions['intermediate'])}
2. Gently correct mistakes if you notice them.
3. Be encouraging and supportive.
4. Keep responses concise (1-3 sentences).
5. Always end with a follow-up question to keep the conversation going."""

        if context:
            prompt += f"\n\nUSE THESE MATERIALS IF RELEVANT:\n{context}"
            
        return prompt

    @traceable(name="PracticeGraph.run")
    async def run(self, user_input: str, history: List[BaseMessage], level: str, topic: str, session_id: Optional[str] = None) -> Dict[str, Any]:
        """Run the graph for a single turn."""
        # Set up metadata for tracing
        metadata = {
            "session_id": session_id,
            "level": level,
            "topic": topic
        }
        
        initial_state = {
            "messages": history + [HumanMessage(content=user_input)],
            "level": level,
            "topic": topic,
            "context": "",
            "grammar_corrections": [],
            "vocab_suggestions": [],
            "follow_up_question": None
        }
        
        final_state = await self.app.ainvoke(initial_state)
        return final_state

# Singleton instance
practice_graph = PracticeGraph()
