"""
User Preference Repository Implementation - Adapter in Hexagonal Architecture
"""
from typing import Optional, Dict, Any, Callable
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.domain.core.user.preference_repository import UserPreferenceRepository
from app.domain.core.user.preferences import UserPreferences
from app.infrastructure.shared.database.platform_models import UserPreferenceModel
from app.shared.utils import generate_id


class SQLUserPreferenceRepository(UserPreferenceRepository):
    """SQL implementation of user preference repository"""
    
    def __init__(self, session_factory: Optional[Callable[[], AsyncSession]] = None):
        from app.infrastructure.shared.database.platform_connection import async_platform_session_maker
        self._session_factory = session_factory or async_platform_session_maker
    
    async def get_by_user_id(self, user_id: str, tenant_id: str) -> Optional[UserPreferences]:
        """Get user preferences by user ID"""
        async with self._session_factory() as session:
            statement = select(UserPreferenceModel).where(
                UserPreferenceModel.user_id == user_id,
                UserPreferenceModel.tenant_id == tenant_id
            )
            result = await session.execute(statement)
            model = result.scalar_one_or_none()
            
            if not model:
                return None
            
            return UserPreferences(
                id=model.id,
                user_id=model.user_id,
                tenant_id=model.tenant_id,
                preferences=model.preferences,
                created_at=model.created_at,
                updated_at=model.updated_at,
            )
    
    async def save(self, preferences: UserPreferences) -> UserPreferences:
        """Save or update user preferences"""
        from datetime import datetime, timezone
        
        async with self._session_factory() as session:
            # Check if preferences exist
            statement = select(UserPreferenceModel).where(
                UserPreferenceModel.user_id == preferences.user_id,
                UserPreferenceModel.tenant_id == preferences.tenant_id
            )
            result = await session.execute(statement)
            model = result.scalar_one_or_none()
            
            if model:
                # Update existing
                model.preferences = preferences.preferences
                model.updated_at = datetime.now(timezone.utc)
            else:
                # Create new
                model = UserPreferenceModel(
                    id=preferences.id or generate_id(),
                    user_id=preferences.user_id,
                    tenant_id=preferences.tenant_id,
                    preferences=preferences.preferences,
                    created_at=preferences.created_at or datetime.now(timezone.utc),
                    updated_at=preferences.updated_at or datetime.now(timezone.utc),
                )
                session.add(model)
            
            await session.commit()
            await session.refresh(model)
            
            return UserPreferences(
                id=model.id,
                user_id=model.user_id,
                tenant_id=model.tenant_id,
                preferences=model.preferences,
                created_at=model.created_at,
                updated_at=model.updated_at,
            )
    
    async def update_preferences(self, user_id: str, tenant_id: str, updates: Dict[str, Any]) -> Optional[UserPreferences]:
        """Update user preferences (merge with existing)"""
        preferences = await self.get_by_user_id(user_id, tenant_id)
        
        if not preferences:
            # Create new preferences if they don't exist
            from datetime import datetime, timezone
            preferences = UserPreferences(
                id=generate_id(),
                user_id=user_id,
                tenant_id=tenant_id,
                preferences={},
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
        
        # Merge updates
        preferences.update_preferences(updates)
        
        # Save
        return await self.save(preferences)
    
    async def delete(self, user_id: str, tenant_id: str) -> bool:
        """Delete user preferences"""
        async with self._session_factory() as session:
            statement = select(UserPreferenceModel).where(
                UserPreferenceModel.user_id == user_id,
                UserPreferenceModel.tenant_id == tenant_id
            )
            result = await session.execute(statement)
            model = result.scalar_one_or_none()
            
            if not model:
                return False
            
            await session.delete(model)
            await session.commit()
            return True
    
    async def exists(self, user_id: str, tenant_id: str) -> bool:
        """Check if preferences exist for user"""
        preferences = await self.get_by_user_id(user_id, tenant_id)
        return preferences is not None

