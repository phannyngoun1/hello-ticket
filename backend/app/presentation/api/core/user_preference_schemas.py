"""
User Preference API Schemas
"""
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field


class UserPreferenceResponse(BaseModel):
    """User preferences response"""
    preferences: Dict[str, Any] = Field(default_factory=dict)
    
    class Config:
        from_attributes = True


class UserPreferenceUpdateRequest(BaseModel):
    """Update user preferences request"""
    preferences: Dict[str, Any] = Field(..., description="Preferences to update (will be merged with existing)")
    
    class Config:
        from_attributes = True


class UserPreferenceSetRequest(BaseModel):
    """Set specific preference value request"""
    path: list[str] = Field(..., description="Path to preference (e.g., ['ui', 'dataListView', 'roles'])")
    value: Any = Field(..., description="Value to set")
    
    class Config:
        from_attributes = True



