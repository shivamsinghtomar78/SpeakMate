"""Progress tracking and analytics for user learning."""
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from collections import defaultdict

from models.database import db

logger = logging.getLogger(__name__)


class ProgressTracker:
    """Track and analyze user learning progress."""
    
    async def start_session(
        self,
        user_id: Optional[str],
        level: str,
        topic: str,
        voice_id: str = "aura-2-thalia-en"
    ) -> str:
        """Start a new practice session."""
        session_data = {
            "user_id": user_id,
            "level": level,
            "topic": topic,
            "voice_id": voice_id,
            "started_at": datetime.utcnow(),
            "turns": [],
            "metrics": {
                "total_words": 0,
                "avg_confidence": 0.0,
                "grammar_mistakes": 0,
                "vocabulary_used": [],
            }
        }
        
        session_id = await db.create_session(session_data)
        logger.info(f"Started session: {session_id}")
        return session_id
    
    async def record_turn(
        self,
        session_id: str,
        user_text: str,
        confidence_scores: List[Dict[str, Any]],
        feedback: Dict[str, Any]
    ):
        """Record a conversation turn atomically."""
        avg_conf = self._calculate_avg_confidence(confidence_scores)
        
        turn_data = {
            "user_text": user_text,
            "word_count": len(user_text.split()),
            "avg_confidence": avg_conf,
            "low_confidence_words": [
                w for w in confidence_scores 
                if w.get("confidence", 1.0) < 0.8
            ],
            "grammar_corrections": len(feedback.get("grammar_corrections", [])),
            "feedback_given": feedback.get("text", ""),
        }
        
        # Atomic update in DB
        await db.add_turn_to_session(session_id, turn_data)
        
        # Update session average confidence in metrics (optional, for fast access)
        # Note: True average calculation over all turns would be done on end_session
        await db.update_session(session_id, {
            "metrics.last_avg_confidence": avg_conf
        })
    
    async def end_session(self, session_id: str) -> Dict[str, Any]:
        """End a session and generate summary."""
        await db.end_session(session_id)
        session = await db.get_session(session_id)
        
        if not session:
            return {"error": "Session not found"}
        
        # Fetch turns from separate collection
        transcripts = await db.get_session_transcripts(session_id)
        
        # Calculate session statistics
        started_at = session.get("started_at", datetime.utcnow())
        ended_at = session.get("ended_at", datetime.utcnow())
        duration = (ended_at - started_at).total_seconds()
        
        metrics = session.get("metrics", {})
        
        # Recalculate true average confidence if needed
        all_conf = [t.get("avg_confidence", 0) for t in transcripts]
        avg_confidence = sum(all_conf) / len(all_conf) if all_conf else 100.0
        
        summary = {
            "session_id": session_id,
            "duration_seconds": int(duration),
            "duration_formatted": self._format_duration(duration),
            "turns_count": len(transcripts),
            "total_words_spoken": metrics.get("total_words", 0),
            "avg_confidence": round(avg_confidence, 1),
            "grammar_mistakes": metrics.get("grammar_mistakes", 0),
            "improvement_areas": self._identify_improvement_areas(transcripts),
        }
        
        # Save progress record
        await db.save_progress({
            "session_id": session_id,
            "user_id": session.get("user_id"),
            "summary": summary,
        })
        
        return summary
    
    async def get_user_analytics(
        self,
        user_id: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """Get comprehensive analytics for a user."""
        progress_list = await db.get_user_progress(user_id, limit=100)
        
        if not progress_list:
            return {
                "user_id": user_id,
                "total_sessions": 0,
                "message": "No practice sessions found. Start practicing!",
            }
        
        # Aggregate data
        total_sessions = len(progress_list)
        total_time = sum(
            p.get("summary", {}).get("duration_seconds", 0) 
            for p in progress_list
        )
        total_words = sum(
            p.get("summary", {}).get("total_words_spoken", 0) 
            for p in progress_list
        )
        
        # Confidence trend
        confidence_scores = [
            p.get("summary", {}).get("avg_confidence", 0) 
            for p in progress_list
        ]
        confidence_trend = self._calculate_trend(confidence_scores)
        
        # Common mistakes
        all_mistakes = []
        for p in progress_list:
            areas = p.get("summary", {}).get("improvement_areas", [])
            all_mistakes.extend(areas)
        
        mistake_counts = defaultdict(int)
        for mistake in all_mistakes:
            mistake_counts[mistake] += 1
        
        common_mistakes = sorted(
            mistake_counts.items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:5]
        
        return {
            "user_id": user_id,
            "total_sessions": total_sessions,
            "total_practice_time": self._format_duration(total_time),
            "total_words_spoken": total_words,
            "avg_confidence": round(sum(confidence_scores) / len(confidence_scores), 1),
            "confidence_trend": confidence_trend,
            "recent_scores": confidence_scores[:10],
            "common_improvement_areas": [m[0] for m in common_mistakes],
            "improvement_score": self._calculate_improvement_score(progress_list),
        }
    
    def _calculate_avg_confidence(self, scores: List[Dict[str, Any]]) -> float:
        """Calculate average confidence from word scores (0-100)."""
        if not scores:
            return 100.0
        
        confidences = [s.get("confidence", 1.0) for s in scores]
        avg = sum(confidences) / len(confidences)
        return round(avg * 100, 1)
    
    def _format_duration(self, seconds: float) -> str:
        """Format duration in human-readable form."""
        if seconds < 60:
            return f"{int(seconds)} seconds"
        elif seconds < 3600:
            minutes = int(seconds / 60)
            secs = int(seconds % 60)
            return f"{minutes}m {secs}s"
        else:
            hours = int(seconds / 3600)
            minutes = int((seconds % 3600) / 60)
            return f"{hours}h {minutes}m"
    
    def _identify_improvement_areas(self, turns: List[Dict[str, Any]]) -> List[str]:
        """Identify areas for improvement based on session data."""
        areas = []
        
        # Check for low confidence words
        low_conf_words = []
        for turn in turns:
            low_conf_words.extend(turn.get("low_confidence_words", []))
        
        if low_conf_words:
            areas.append("pronunciation")
        
        # Check for grammar mistakes
        total_grammar = sum(t.get("grammar_corrections", 0) for t in turns)
        if total_grammar > 2:
            areas.append("grammar")
        
        # Check for short responses
        avg_words = sum(t.get("word_count", 0) for t in turns) / max(len(turns), 1)
        if avg_words < 5:
            areas.append("sentence_length")
        
        return areas
    
    def _calculate_trend(self, scores: List[float]) -> str:
        """Calculate trend direction from scores."""
        if len(scores) < 2:
            return "stable"
        
        recent = scores[:5]
        older = scores[5:10] if len(scores) > 5 else scores[:len(scores)//2]
        
        if not older:
            return "stable"
        
        recent_avg = sum(recent) / len(recent)
        older_avg = sum(older) / len(older)
        
        diff = recent_avg - older_avg
        
        if diff > 5:
            return "improving"
        elif diff < -5:
            return "declining"
        else:
            return "stable"
    
    def _calculate_improvement_score(self, progress_list: List[Dict[str, Any]]) -> float:
        """Calculate overall improvement score (0-100)."""
        if len(progress_list) < 2:
            return 50.0  # Neutral starting point
        
        # Compare recent vs older sessions
        recent = progress_list[:5]
        older = progress_list[-5:]
        
        recent_conf = sum(
            p.get("summary", {}).get("avg_confidence", 50) 
            for p in recent
        ) / len(recent)
        
        older_conf = sum(
            p.get("summary", {}).get("avg_confidence", 50) 
            for p in older
        ) / len(older)
        
        # Calculate improvement
        improvement = recent_conf - older_conf
        
        # Scale to 0-100
        score = 50 + improvement
        return max(0, min(100, round(score, 1)))


# Singleton instance
progress_tracker = ProgressTracker()
