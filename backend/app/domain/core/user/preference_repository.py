"""
User Preference Repository interface - Port in Hexagonal Architecture
"""
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from app.domain.core.user.preferences import UserPreferences


class UserPreferenceRepository(ABC):
    """User preference repository interface"""
    
    @abstractmethod
    async def get_by_user_id(self, user_id: str, tenant_id: str) -> Optional[UserPreferences]:
        """Get user preferences by user ID"""
        pass
    
    @abstractmethod
    async def save(self, preferences: UserPreferences) -> UserPreferences:
        """Save or update user preferences"""
        pass
    
    @abstractmethod
    async def update_preferences(self, user_id: str, tenant_id: str, updates: Dict[str, Any]) -> Optional[UserPreferences]:
        """Update user preferences (merge with existing)"""
        pass
    
    @abstractmethod
    async def delete(self, user_id: str, tenant_id: str) -> bool:
        """Delete user preferences"""
        pass
    
    @abstractmethod
    async def exists(self, user_id: str, tenant_id: str) -> bool:
        """Check if preferences exist for user"""
        pass

