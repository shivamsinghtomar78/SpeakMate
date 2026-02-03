"""Script to seed the database with initial learning materials and embeddings."""
import asyncio
import logging
import sys
import os

# Add parent directory to path to allow imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.database import db
from rag.retrieval import rag_retrieval
from config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GRAMMAR_RULES = [
    {
        "topic": "Present Continuous",
        "level": "beginner",
        "content": "Use 'am/is/are + verb-ing' for actions happening right now. Example: 'I am speaking English.'",
        "keywords": ["now", "currently", "happening", "moment"]
    },
    {
        "topic": "Past Simple",
        "level": "beginner",
        "content": "Use the past form of the verb for completed actions in the past. Example: 'I studied yesterday.'",
        "keywords": ["yesterday", "last night", "ago", "past"]
    },
    {
        "topic": "Present Perfect",
        "level": "intermediate",
        "content": "Use 'have/has + past participle' for life experiences or actions with current relevance. Example: 'I have visited London.'",
        "keywords": ["ever", "never", "already", "yet", "since", "for"]
    },
    {
        "topic": "Conditionals (Type 1)",
        "level": "intermediate",
        "content": "Use 'If + present simple, will + verb' for real possibilities. Example: 'If it rains, I will stay home.'",
        "keywords": ["if", "will", "possibility", "future"]
    },
    {
        "topic": "Passive Voice",
        "level": "advanced",
        "content": "Use 'be + past participle' to focus on the action rather than the doer. Example: 'The bridge was built in 1990.'",
        "keywords": ["by", "was done", "is being", "has been"]
    }
]

VOCABULARY = [
    {
        "word": "Metropolitan",
        "level": "advanced",
        "definition": "Relating to a large city or its surroundings.",
        "usage": "The metropolitan area is home to over 5 million people.",
        "topic": "business"
    },
    {
        "word": "Commute",
        "level": "intermediate",
        "definition": "To travel some distance between one's home and place of work on a regular basis.",
        "usage": "I commute to work by train every morning.",
        "topic": "daily_life"
    },
    {
        "word": "Itinerary",
        "level": "intermediate",
        "definition": "A planned route or journey.",
        "usage": "We have a very busy itinerary for nuestra trip.",
        "topic": "travel"
    },
    {
        "word": "Negotiate",
        "level": "advanced",
        "definition": "Try to reach an agreement or compromise by discussion with others.",
        "usage": "We need to negotiate a better deal with our suppliers.",
        "topic": "business"
    }
]

async def seed():
    """Seed the database."""
    logger.info("Connecting to database...")
    await db.connect()
    
    logger.info("Initializing RAG retrieval for embeddings...")
    await rag_retrieval.initialize()
    
    # 清空现有数据 (可选，这里先不删)
    # await db.db.grammar_rules.delete_many({})
    # await db.db.vocabulary.delete_many({})
    
    logger.info("Seeding grammar rules...")
    for rule in GRAMMAR_RULES:
        try:
            # Check if exists
            exists = await db.db.grammar_rules.find_one({"topic": rule["topic"], "level": rule["level"]})
            if not exists:
                await rag_retrieval.add_learning_material("grammar_rules", rule)
                logger.info(f"Added grammar rule: {rule['topic']}")
                await asyncio.sleep(2)  # Avoid rate limits
            else:
                logger.info(f"Skipping existing grammar rule: {rule['topic']}")
        except Exception as e:
            logger.error(f"Failed to add {rule['topic']}: {e}")
            
    logger.info("Seeding vocabulary...")
    for vocab in VOCABULARY:
        try:
            exists = await db.db.vocabulary.find_one({"word": vocab["word"]})
            if not exists:
                await rag_retrieval.add_learning_material("vocabulary", vocab)
                logger.info(f"Added vocabulary: {vocab['word']}")
                await asyncio.sleep(2)  # Avoid rate limits
            else:
                logger.info(f"Skipping existing vocabulary: {vocab['word']}")
        except Exception as e:
            logger.error(f"Failed to add {vocab['word']}: {e}")
    
    logger.info("Seeding complete!")
    await db.disconnect()

if __name__ == "__main__":
    asyncio.run(seed())
