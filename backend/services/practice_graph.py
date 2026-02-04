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
    ai_response: str = Field(description="The natural conversational response to the user's message")
    grammar_corrections: List[Dict[str, str]] = Field(
        default_factory=list,
        description="List of corrections with 'original', 'corrected', and 'explanation'"
    )
    vocab_suggestions: List[Dict[str, str]] = Field(
        default_factory=list,
        description="List of suggestions with 'word', 'definition', and 'usage'"
    )
    follow_up_question: str = Field(description="The specific follow-up question at the end of the response")
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
        workflow.add_node("generate_and_analyze", self.generate_and_analyze)
        
        # Define edges
        workflow.set_entry_point("retrieve_context")
        workflow.add_edge("retrieve_context", "generate_and_analyze")
        workflow.add_edge("generate_and_analyze", END)
        
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

    @traceable(name="generate_and_analyze")
    async def generate_and_analyze(self, state: PracticeState):
        """Node: Generate response and feedback in a single structured call."""
        system_prompt = self._build_system_prompt(state["level"], state["topic"], state["context"])
        
        # Add a hint for structured output
        prompt_with_instructions = f"""{system_prompt}

As you generate your response, also identify any grammar mistakes or vocabulary improvements for the user's last message.
"""
        messages = [SystemMessage(content=prompt_with_instructions)] + list(state["messages"])
        
        try:
            # Single call to get everything
            output: FeedbackOutput = await self.structured_llm.ainvoke(messages)
            
            # AIMessage for the messages list (full conversational text)
            full_text = f"{output.ai_response} {output.follow_up_question}"
            ai_message = AIMessage(content=full_text)
            
            return {
                "messages": [ai_message],
                "ai_response": output.ai_response,
                "follow_up_question": output.follow_up_question,
                "grammar_corrections": output.grammar_corrections,
                "vocab_suggestions": output.vocab_suggestions
            }
        except Exception as e:
            logger.error(f"Error in generate_and_analyze node: {e}")
            return {
                "messages": [AIMessage(content="That's interesting! Keep going.")],
                "follow_up_question": "What else is on your mind?",
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
