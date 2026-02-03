"""RAG retrieval system for learning materials."""
import logging
from typing import List, Dict, Any, Optional
import google.generativeai as genai

from config import settings
from models.database import db

logger = logging.getLogger(__name__)


class RAGRetrieval:
    """RAG system for retrieving relevant learning materials."""
    
    def __init__(self):
        self.embedding_model = None
        
    async def initialize(self):
        """Initialize the embedding model."""
        try:
            if settings.GEMINI_API_KEY:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self.embedding_model = "models/embedding-001"
                logger.info("Gemini embedding model initialized")
            else:
                logger.warning("No Gemini API key - using keyword-based retrieval")
        except Exception as e:
            logger.error(f"Failed to initialize embeddings: {e}")
    
    async def get_embedding(self, text: str) -> Optional[List[float]]:
        """Generate embeddings for text using Gemini."""
        if not self.embedding_model:
            return None
            
        try:
            result = genai.embed_content(
                model=self.embedding_model,
                content=text,
                task_type="retrieval_query",
            )
            return result['embedding']
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            return None
    
    async def retrieve_context(
        self,
        user_input: str,
        level: str = "intermediate",
        limit: int = 3
    ) -> str:
        """Retrieve relevant learning materials for context."""
        
        context_parts = []
        
        # First, try to get relevant grammar rules
        grammar_rules = await self._get_relevant_grammar(user_input, level, limit)
        if grammar_rules:
            context_parts.append("GRAMMAR TIPS:")
            for rule in grammar_rules:
                context_parts.append(f"- {rule.get('topic', 'Grammar')}: {rule.get('content', '')}")
        
        # Get relevant vocabulary
        vocabulary = await self._get_relevant_vocabulary(user_input, level, limit)
        if vocabulary:
            context_parts.append("\nVOCABULARY:")
            for vocab in vocabulary:
                context_parts.append(
                    f"- {vocab.get('word', '')}: {vocab.get('definition', '')} "
                    f"(Example: {vocab.get('usage', '')})"
                )
        
        # Get pronunciation guides if needed
        pronunciation = await self._get_pronunciation_guides(user_input, limit=2)
        if pronunciation:
            context_parts.append("\nPRONUNCIATION:")
            for pron in pronunciation:
                context_parts.append(
                    f"- {pron.get('word', '')}: {pron.get('phonetic', '')} - {pron.get('tips', '')}"
                )
        
        return "\n".join(context_parts) if context_parts else ""
    
    async def _search_vector(
        self,
        query_text: str,
        collection_name: str,
        level: Optional[str] = None,
        limit: int = 3
    ) -> List[Dict[str, Any]]:
        """Perform vector search using embeddings."""
        if not self.embedding_model or not settings.VECTOR_SEARCH_ENABLED:
            return []
            
        query_embedding = await self.get_embedding(query_text)
        if not query_embedding:
            return []
            
        try:
            # MongoDB Atlas Vector Search Pipeline
            pipeline = [
                {
                    "$vectorSearch": {
                        "index": "vector_index",
                        "path": "embedding",
                        "queryVector": query_embedding,
                        "numCandidates": 100,
                        "limit": limit
                    }
                }
            ]
            
            if level:
                # Add filter for level if provided
                # Note: Atlas Vector Search filter requires specific index configuration
                pipeline.append({"$match": {"level": level}})
            
            cursor = db.db[collection_name].aggregate(pipeline)
            results = await cursor.to_list(length=limit)
            return results
        except Exception as e:
            logger.warning(f"Vector search failed (likely index not configured): {e}")
            # Fallback will be handled by the caller
            return []

    async def _get_relevant_grammar(
        self, 
        user_input: str, 
        level: str,
        limit: int
    ) -> List[Dict[str, Any]]:
        """Get relevant grammar rules."""
        # 1. Try Vector Search first if enabled
        if settings.VECTOR_SEARCH_ENABLED:
            vector_results = await self._search_vector(user_input, "grammar_rules", level, limit)
            if vector_results:
                return vector_results

        # 2. Fallback to Keyword Search
        grammar_keywords = {
            "tense": ["was", "were", "have", "had", "will", "going to", "did", "does"],
            "articles": ["a", "an", "the"],
            "prepositions": ["in", "on", "at", "to", "for", "with", "by"],
            "conditionals": ["if", "would", "could", "might"],
            "comparatives": ["more", "less", "better", "worse", "than"],
        }
        
        user_lower = user_input.lower()
        relevant_topics = []
        
        for topic, keywords in grammar_keywords.items():
            if any(kw in user_lower for kw in keywords):
                relevant_topics.append(topic)
        
        if relevant_topics:
            query = {"level": level, "topic": {"$in": relevant_topics}}
            cursor = db.db.grammar_rules.find(query).limit(limit)
            rules = await cursor.to_list(length=limit)
            if rules:
                return rules
        
        # 3. Default rules for the level
        return await db.get_grammar_rules(level=level)
    
    async def _get_relevant_vocabulary(
        self,
        user_input: str,
        level: str,
        limit: int
    ) -> List[Dict[str, Any]]:
        """Get relevant vocabulary suggestions."""
        # 1. Try Vector Search first if enabled
        if settings.VECTOR_SEARCH_ENABLED:
            vector_results = await self._search_vector(user_input, "vocabulary", level, limit)
            if vector_results:
                return vector_results

        # 2. Extract words from user input for keyword matching
        words = user_input.lower().split()
        topic_keywords = {
            "business": ["work", "job", "office", "meeting", "boss", "company"],
            "travel": ["trip", "travel", "fly", "hotel", "vacation", "visit"],
            "daily": ["eat", "sleep", "home", "family", "friend", "morning"],
            "academic": ["study", "learn", "school", "book", "read", "write"],
        }
        
        detected_topics = []
        for topic, keywords in topic_keywords.items():
            if any(kw in words for kw in keywords):
                detected_topics.append(topic)
        
        if detected_topics:
            query = {"level": level, "topic": {"$in": detected_topics}}
            cursor = db.db.vocabulary.find(query).limit(limit)
            vocab = await cursor.to_list(length=limit)
            if vocab:
                return vocab
        
        # 3. Get generic vocabulary for level
        return await db.get_vocabulary(level=level, limit=limit)
    
    async def _get_pronunciation_guides(
        self,
        user_input: str,
        limit: int
    ) -> List[Dict[str, Any]]:
        """Get pronunciation guides for potentially difficult words."""
        # Common difficult words for non-native speakers
        difficult_patterns = [
            "th", "ough", "tion", "sion", "ight", "ble", "ness"
        ]
        
        words = user_input.lower().split()
        potential_words = []
        
        for word in words:
            for pattern in difficult_patterns:
                if pattern in word:
                    potential_words.append(word)
                    break
        
        if potential_words and db.db:
            cursor = db.db.pronunciation.find(
                {"word": {"$in": potential_words}}
            ).limit(limit)
            guides = await cursor.to_list(length=limit)
            return guides
        
        return []
    
    async def add_learning_material(
        self,
        collection: str,
        material: Dict[str, Any]
    ) -> str:
        """Add new learning material to the database."""
        # Generate embedding for the content if available
        content = material.get("content", "") or material.get("definition", "")
        if content and self.embedding_model:
            embedding = await self.get_embedding(content)
            if embedding:
                material["embedding"] = embedding
        
        result = await db.db[collection].insert_one(material)
        return str(result.inserted_id)


# Singleton instance
rag_retrieval = RAGRetrieval()
