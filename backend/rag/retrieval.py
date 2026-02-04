import logging
import httpx
from typing import List, Dict, Any, Optional

from config import settings
from models.database import db

logger = logging.getLogger(__name__)


class RAGRetrieval:
    """RAG system for retrieving relevant learning materials."""
    
    def __init__(self):
        self.use_qubrid = False
        self._cache = {}  # (user_input, level) -> context
        self._cache_limit = 100
        
    async def initialize(self):
        """Initialize retrieval settings."""
        if settings.QUBRID_API_KEY:
            logger.info(f"Qubrid AI initialized with model: {settings.QUBRID_MODEL}")
            self.use_qubrid = True
        else:
            logger.warning("No Qubrid API key - using keyword-based retrieval only")

    async def _call_qubrid(self, prompt: str) -> Optional[str]:
        """Call Qubrid AI for semantic tasks with strict timeout."""
        if not settings.QUBRID_API_KEY:
            return None
            
        try:
            # lower timeout to 1.5s to ensure we don't breach Deepgram's 5s window
            async with httpx.AsyncClient(timeout=1.5) as client:
                response = await client.post(
                    settings.QUBRID_ENDPOINT,
                    headers={
                        "Authorization": f"Bearer {settings.QUBRID_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": settings.QUBRID_MODEL,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.1,
                        "max_tokens": 100
                    }
                )
                
                # Robust response check to fix "line 1 column 1" parse error
                if response.status_code == 200:
                    try:
                        data = response.json()
                        if 'choices' in data and len(data['choices']) > 0:
                            return data['choices'][0]['message']['content']
                        logger.warning(f"Unexpected Qubrid response format: {data}")
                        return None
                    except ValueError:
                        logger.error(f"Failed to parse Qubrid JSON response: {response.text[:100]}")
                        return None
                else:
                    logger.error(f"Qubrid AI error: {response.status_code} - {response.text[:100]}")
                    return None
        except httpx.TimeoutException:
            logger.warning("Qubrid AI call timed out (1.5s limit reached)")
            return None
        except Exception as e:
            logger.error(f"Qubrid AI call failed: {str(e)}")
            return None
    
    async def retrieve_context(
        self,
        user_input: str,
        level: str = "intermediate",
        limit: int = 3
    ) -> str:
        """Retrieve relevant learning materials for context in parallel."""
        # Simple cache check
        cache_key = (user_input.lower().strip(), level)
        if cache_key in self._cache:
            return self._cache[cache_key]
        
        # Parallelize independent retrieval tasks
        tasks = [
            self._get_relevant_grammar(user_input, level, limit),
            self._get_relevant_vocabulary(user_input, level, limit),
            self._get_pronunciation_guides(user_input, limit=2)
        ]
        
        try:
            # Use asyncio.gather for concurrent execution
            grammar_rules, vocabulary, pronunciation = await asyncio.gather(*tasks)
            
            context_parts = []
            
            if grammar_rules:
                context_parts.append("GRAMMAR TIPS:")
                for rule in grammar_rules:
                    context_parts.append(f"- {rule.get('topic', 'Grammar')}: {rule.get('content', '')}")
            
            if vocabulary:
                context_parts.append("\nVOCABULARY:")
                for vocab in vocabulary:
                    context_parts.append(
                        f"- {vocab.get('word', '')}: {vocab.get('definition', '')} "
                        f"(Example: {vocab.get('usage', '')})"
                    )
            
            if pronunciation:
                context_parts.append("\nPRONUNCIATION:")
                for pron in pronunciation:
                    context_parts.append(
                        f"- {pron.get('word', '')}: {pron.get('phonetic', '')} - {pron.get('tips', '')}"
                    )
            
            result = "\n".join(context_parts) if context_parts else ""
            
            # Update cache
            if len(self._cache) >= self._cache_limit:
                self._cache.pop(next(iter(self._cache))) # Simple FIFO
            self._cache[cache_key] = result
            
            return result
        except Exception as e:
            logger.error(f"Parallel retrieval failed: {e}")
            return "" # Fallback to no context rather than crashing
    

    async def _get_relevant_grammar(
        self, 
        user_input: str, 
        level: str,
        limit: int
    ) -> List[Dict[str, Any]]:
        """Get relevant grammar rules with semantic re-ranking."""
        # 1. Fetch initial candidate pool
        candidates = []
        
        # Keyword based pool
        grammar_keywords = {
            "tense": ["was", "were", "have", "had", "will", "going to", "did", "does"],
            "articles": ["a", "an", "the"],
            "prepositions": ["in", "on", "at", "to", "for", "with", "by"],
            "conditionals": ["if", "would", "could", "might"],
            "comparatives": ["more", "less", "better", "worse", "than"],
        }
        
        user_lower = user_input.lower()
        relevant_topics = [t for t, kws in grammar_keywords.items() if any(kw in user_lower for kw in kws)]
        
        if relevant_topics:
            cursor = db.db.grammar_rules.find({"level": level, "topic": {"$in": relevant_topics}}).limit(10)
            candidates.extend(await cursor.to_list(length=10))
            
        # Add diverse rules to pool if not enough
        if len(candidates) < 10:
            cursor = db.db.grammar_rules.find({"level": level}).limit(20)
            candidates.extend(await cursor.to_list(length=20))

        # 2. Semantic Re-ranking with Qubrid
        if self.use_qubrid and candidates:
            # Deduplicate by topic
            unique_candidates = {c['topic']: c for c in candidates}.values()
            rule_list = "\n".join([f"- {r.get('topic')}: {r.get('content')}" for r in unique_candidates])
            
            prompt = f"""Given the user speaking: "{user_input}"
Select the top {limit} most relevant grammar rules from this list to help them improve:
{rule_list}
Return ONLY the topics of the selected rules, separated by commas."""
            
            selected_topics_str = await self._call_qubrid(prompt)
            if selected_topics_str:
                selected_topics = [t.strip() for t in selected_topics_str.split(',')]
                # Re-order candidates based on LLM choice
                ranked = [c for c in unique_candidates if c['topic'] in selected_topics]
                if ranked:
                    return ranked[:limit]

        return candidates[:limit]

    async def _get_relevant_vocabulary(
        self,
        user_input: str,
        level: str,
        limit: int
    ) -> List[Dict[str, Any]]:
        """Get relevant vocabulary suggestions with semantic re-ranking."""
        # 1. Fetch initial candidate pool
        candidates = []
        
        # Keyword-based pool
        words = user_input.lower().split()
        topic_keywords = {
            "business": ["work", "job", "office", "meeting", "boss", "company"],
            "travel": ["trip", "travel", "fly", "hotel", "vacation", "visit"],
            "daily": ["eat", "sleep", "home", "family", "friend", "morning"],
            "academic": ["study", "learn", "school", "book", "read", "write"],
        }
        
        detected_topics = [t for t, kws in topic_keywords.items() if any(kw in words for kw in kws)]
        
        if detected_topics:
            cursor = db.db.vocabulary.find({"level": level, "topic": {"$in": detected_topics}}).limit(10)
            candidates.extend(await cursor.to_list(length=10))
            
        # Fill pool
        if len(candidates) < 10:
            cursor = db.db.vocabulary.find({"level": level}).limit(20)
            candidates.extend(await cursor.to_list(length=20))

        # 2. Semantic Re-ranking
        if self.use_qubrid and candidates:
            unique_candidates = {v['word']: v for v in candidates}.values()
            vocab_list = "\n".join([f"- {v.get('word')}: {v.get('definition')}" for v in unique_candidates])
            
            prompt = f"""Given the user speaking: "{user_input}"
Select the top {limit} most relevant vocabulary words from this list:
{vocab_list}
Return ONLY the words, separated by commas."""
            
            selected_words_str = await self._call_qubrid(prompt)
            if selected_words_str:
                selected_words = [w.strip() for w in selected_words_str.split(',')]
                ranked = [v for v in unique_candidates if v['word'] in selected_words]
                if ranked:
                    return ranked[:limit]
        
        return candidates[:limit]
    
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
        result = await db.db[collection].insert_one(material)
        return str(result.inserted_id)


# Singleton instance
rag_retrieval = RAGRetrieval()
