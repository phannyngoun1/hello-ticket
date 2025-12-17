"""
User Preference Service - Application layer for user preference management
"""
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from app.domain.core.user.preferences import UserPreferences
from app.domain.core.user.preference_repository import UserPreferenceRepository
from app.shared.exceptions import NotFoundError, ValidationError
from app.shared.utils import generate_id


class UserPreferenceService:
    """Service for managing user preferences"""
    
    def __init__(self, repository: UserPreferenceRepository):
        self.repository = repository
    
    async def get_preferences(self, user_id: str, tenant_id: str) -> Dict[str, Any]:
        """Get all user preferences"""
        preferences = await self.repository.get_by_user_id(user_id, tenant_id)
        
        if not preferences:
            return {}
        
        return preferences.preferences
    
    async def get_preference(self, user_id: str, tenant_id: str, *path: str) -> Any:
        """Get a specific preference value by path"""
        preferences = await self.repository.get_by_user_id(user_id, tenant_id)
        
        if not preferences:
            return None
        
        return preferences.get_preference(*path)
    
    async def set_preference(
        self, 
        user_id: str, 
        tenant_id: str, 
        *path: str, 
        value: Any
    ) -> UserPreferences:
        """Set a preference value by path"""
        if not path:
            raise ValidationError("Preference path cannot be empty")
        
        preferences = await self.repository.get_by_user_id(user_id, tenant_id)
        
        if not preferences:
            # Create new preferences
            preferences = UserPreferences(
                id=generate_id(),
                user_id=user_id,
                tenant_id=tenant_id,
                preferences={},
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
        
        preferences.set_preference(*path, value=value)
        preferences.updated_at = datetime.now(timezone.utc)
        
        return await self.repository.save(preferences)
    
    async def update_preferences(
        self, 
        user_id: str, 
        tenant_id: str, 
        updates: Dict[str, Any]
    ) -> UserPreferences:
        """Update multiple preferences (merge with existing)"""
        return await self.repository.update_preferences(user_id, tenant_id, updates)
    
    async def remove_preference(
        self, 
        user_id: str, 
        tenant_id: str, 
        *path: str
    ) -> Optional[UserPreferences]:
        """Remove a preference by path"""
        if not path:
            raise ValidationError("Preference path cannot be empty")
        
        preferences = await self.repository.get_by_user_id(user_id, tenant_id)
        
        if not preferences:
            return None
        
        preferences.remove_preference(*path)
        preferences.updated_at = datetime.now(timezone.utc)
        
        return await self.repository.save(preferences)
    
    async def clear_preferences(self, user_id: str, tenant_id: str) -> bool:
        """Clear all user preferences"""
        return await self.repository.delete(user_id, tenant_id)

