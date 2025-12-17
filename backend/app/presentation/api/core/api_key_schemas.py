"""
API Key schemas for external system integration
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class APIKeyCreate(BaseModel):
    """API key creation schema"""
    name: str
    description: str = ""
    expires_in_days: Optional[int] = None
    permissions: List[str] = []


class APIKeyResponse(BaseModel):
    """API key response schema"""
    key_id: str
    name: str
    description: str
    created_at: datetime
    expires_at: Optional[datetime] = None
    is_active: bool
    permissions: List[str]
    last_used_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class APIKeyCreatedResponse(BaseModel):
    """Response when API key is created (includes plain text key)"""
    api_key: str  # Plain text key - shown only once
    key_id: str
    name: str
    description: str
    created_at: datetime
    expires_at: Optional[datetime] = None
    permissions: List[str]
    message: str = "Store this API key securely. It will not be shown again."

