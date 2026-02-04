"""Authentication middleware for SpeakMate."""
import logging
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import settings

logger = logging.getLogger(__name__)
security = HTTPBearer()

async def get_current_user(auth: HTTPAuthorizationCredentials = Security(security)):
    """
    Validate the authentication token.
    For now, this implements a shared secret check.
    In production, this would verify Firebase/Auth0 tokens.
    """
    token = auth.credentials
    
    # Check against a shared secret for now
    # We use DEEPGRAM_API_KEY as a placeholder for a shared secret if no specific AUTH_SECRET exists
    expected_secret = getattr(settings, "AUTH_SECRET", settings.DEEPGRAM_API_KEY[:10])
    
    if token != expected_secret:
        logger.warning(f"Unauthorized access attempt with token: {token[:4]}...")
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return {"id": "default_user", "authenticated": True}

async def verify_deepgram_request(request_id: str = None):
    """
    Optional verification for Deepgram callbacks.
    Ensures that requests to /api/llm/think come from a trusted source.
    """
    # Placeholder for Deepgram-specific signature verification
    return True
