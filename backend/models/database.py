"""MongoDB database connection and operations."""
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import IndexModel, ASCENDING, DESCENDING
from bson import ObjectId

from config import settings

logger = logging.getLogger(__name__)


class Database:
    """MongoDB database manager."""
    
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None
    
    async def connect(self):
        """Connect to MongoDB."""
        try:
            self.client = AsyncIOMotorClient(settings.MONGODB_URI)
            self.db = self.client[settings.DATABASE_NAME]
            
            # Test connection
            await self.client.admin.command('ping')
            logger.info(f"Connected to MongoDB: {settings.DATABASE_NAME}")
            
            # Create indexes
            await self._create_indexes()
            
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
    
    async def disconnect(self):
        """Disconnect from MongoDB."""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")
    
    async def _create_indexes(self):
        """Create database indexes for optimal performance."""
        # Sessions collection indexes
        await self.db.sessions.create_indexes([
            IndexModel([("user_id", ASCENDING)]),
            IndexModel([("created_at", DESCENDING)]),
            IndexModel([("status", ASCENDING)]),
        ])
        
        # Transcripts collection indexes
        await self.db.transcripts.create_indexes([
            IndexModel([("session_id", ASCENDING)]),
            IndexModel([("timestamp", ASCENDING)]),
        ])
        
        # Progress collection indexes
        await self.db.progress.create_indexes([
            IndexModel([("user_id", ASCENDING)]),
            IndexModel([("session_id", ASCENDING)]),
        ])
        
        await self.db.grammar_rules.create_indexes([
            IndexModel([("topic", ASCENDING)]),
            IndexModel([("level", ASCENDING)]),
            IndexModel([("topic", "text"), ("content", "text")]),
        ])
        
        await self.db.vocabulary.create_indexes([
            IndexModel([("word", ASCENDING)]),
            IndexModel([("level", ASCENDING)]),
            IndexModel([("word", "text"), ("definition", "text")]),
        ])
        
        logger.info("Database indexes created")
    
    # ============ Session Operations ============
    
    async def create_session(self, session_data: Dict[str, Any]) -> str:
        """Create a new practice session."""
        session_data["created_at"] = datetime.utcnow()
        session_data["updated_at"] = datetime.utcnow()
        session_data["status"] = "active"
        
        result = await self.db.sessions.insert_one(session_data)
        return str(result.inserted_id)
    
    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session by ID."""
        try:
            session = await self.db.sessions.find_one({"_id": ObjectId(session_id)})
            if session:
                session["_id"] = str(session["_id"])
            return session
        except Exception:
            return None
    
    async def update_session(self, session_id: str, update_data: Dict[str, Any]) -> bool:
        """Update session data."""
        update_data["updated_at"] = datetime.utcnow()
        result = await self.db.sessions.update_one(
            {"_id": ObjectId(session_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0
    
    async def end_session(self, session_id: str) -> bool:
        """End a practice session."""
        return await self.update_session(session_id, {
            "status": "completed",
            "ended_at": datetime.utcnow()
        })
    
    # ============ Transcript Operations ============
    
    async def save_transcript(self, transcript_data: Dict[str, Any]) -> str:
        """Save a transcript entry."""
        transcript_data["timestamp"] = datetime.utcnow()
        result = await self.db.transcripts.insert_one(transcript_data)
        return str(result.inserted_id)
    
    async def get_session_transcripts(self, session_id: str) -> List[Dict[str, Any]]:
        """Get all transcripts for a session."""
        cursor = self.db.transcripts.find({"session_id": session_id}).sort("timestamp", ASCENDING)
        transcripts = await cursor.to_list(length=None)
        for t in transcripts:
            t["_id"] = str(t["_id"])
        return transcripts
    
    # ============ Progress Operations ============
    
    async def save_progress(self, progress_data: Dict[str, Any]) -> str:
        """Save progress data."""
        progress_data["timestamp"] = datetime.utcnow()
        result = await self.db.progress.insert_one(progress_data)
        return str(result.inserted_id)
    
    async def get_user_progress(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get user progress history."""
        cursor = self.db.progress.find({"user_id": user_id}).sort("timestamp", DESCENDING).limit(limit)
        progress = await cursor.to_list(length=limit)
        for p in progress:
            p["_id"] = str(p["_id"])
        return progress
    
    async def get_session_progress(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get progress for a specific session."""
        progress = await self.db.progress.find_one({"session_id": session_id})
        if progress:
            progress["_id"] = str(progress["_id"])
        return progress
    
    # ============ Learning Materials Operations ============
    
    async def get_grammar_rules(self, level: str = None, topic: str = None) -> List[Dict[str, Any]]:
        """Get grammar rules, optionally filtered."""
        query = {}
        if level:
            query["level"] = level
        if topic:
            query["topic"] = {"$regex": topic, "$options": "i"}
        
        cursor = self.db.grammar_rules.find(query)
        rules = await cursor.to_list(length=50)
        for r in rules:
            r["_id"] = str(r["_id"])
        return rules
    
    async def get_vocabulary(self, level: str = None, limit: int = 20) -> List[Dict[str, Any]]:
        """Get vocabulary items, optionally filtered by level."""
        query = {}
        if level:
            query["level"] = level
        
        cursor = self.db.vocabulary.find(query).limit(limit)
        vocab = await cursor.to_list(length=limit)
        for v in vocab:
            v["_id"] = str(v["_id"])
        return vocab
    
    async def search_materials(self, query_text: str, collection: str = "grammar_rules") -> List[Dict[str, Any]]:
        """Text search in learning materials."""
        # Simple text search (for production, use vector search)
        search_query = {"$text": {"$search": query_text}}
        cursor = self.db[collection].find(search_query).limit(5)
        results = await cursor.to_list(length=5)
        for r in results:
            r["_id"] = str(r["_id"])
        return results


# Singleton database instance
db = Database()


async def get_database() -> Database:
    """Dependency to get database instance."""
    return db
