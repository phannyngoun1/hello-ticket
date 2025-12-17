"""
User Cache Sync Service

Synchronizes user data from Platform DB to Operational DB cache.
This enables SQL joins between users and operational data (orders, products, etc.)
"""
from typing import List, Optional
from datetime import datetime, timezone
from sqlmodel import Session, select
from app.infrastructure.shared.database.platform_models import UserModel
from app.infrastructure.shared.database.platform_connection import get_platform_session_sync
from app.infrastructure.shared.database.models import UserCacheModel
from app.infrastructure.shared.database.connection import get_session_sync
import logging

logger = logging.getLogger(__name__)


class UserSyncService:
    """Service to sync users from Platform DB to Operational DB cache"""
    
    def __init__(
        self,
        platform_session: Optional[Session] = None,
        operational_session: Optional[Session] = None
    ):
        self._platform_session_factory = platform_session if platform_session else get_platform_session_sync
        self._operational_session_factory = operational_session if operational_session else get_session_sync
    
    async def sync_user(self, user_id: str) -> bool:
        """
        Sync a single user from Platform DB to Operational DB cache
        
        Args:
            user_id: The user ID to sync
            
        Returns:
            True if synced successfully, False otherwise
        """
        try:
            # 1. Fetch from Platform DB (source of truth)
            with self._platform_session_factory() as platform_session:
                user = platform_session.get(UserModel, user_id)
                
                if not user:
                    logger.warning(f"User {user_id} not found in Platform DB")
                    # User deleted? Remove from cache
                    return await self._delete_from_cache(user_id)
            
            # 2. Update or create in Operational DB cache
            with self._operational_session_factory() as operational_session:
                cached_user = operational_session.get(UserCacheModel, user_id)
                
                if cached_user:
                    # Update existing cache entry
                    cached_user.tenant_id = user.tenant_id
                    cached_user.name = user.name
                    cached_user.email = user.email
                    cached_user.role = user.role
                    cached_user.is_active = user.is_active
                    cached_user.synced_at = datetime.now(timezone.utc)
                    cached_user.version += 1
                    logger.info(f"Updated user cache for {user_id} (version {cached_user.version})")
                else:
                    # Create new cache entry
                    cached_user = UserCacheModel(
                        id=user.id,
                        tenant_id=user.tenant_id,
                        name=user.name,
                        email=user.email,
                        role=user.role,
                        is_active=user.is_active,
                        synced_at=datetime.now(timezone.utc),
                        version=1
                    )
                    operational_session.add(cached_user)
                    logger.info(f"Created user cache for {user_id}")
                
                operational_session.commit()
                return True
                
        except Exception as e:
            logger.error(f"Failed to sync user {user_id}: {str(e)}")
            return False
    
    async def sync_users_batch(self, user_ids: List[str]) -> dict:
        """
        Sync multiple users in batch
        
        Args:
            user_ids: List of user IDs to sync
            
        Returns:
            Dict with sync statistics
        """
        stats = {
            "total": len(user_ids),
            "success": 0,
            "failed": 0,
            "errors": []
        }
        
        for user_id in user_ids:
            success = await self.sync_user(user_id)
            if success:
                stats["success"] += 1
            else:
                stats["failed"] += 1
                stats["errors"].append(user_id)
        
        logger.info(f"Batch sync completed: {stats['success']}/{stats['total']} successful")
        return stats
    
    async def sync_tenant_users(self, tenant_id: str) -> dict:
        """
        Sync all users for a specific tenant
        
        Args:
            tenant_id: The tenant ID
            
        Returns:
            Dict with sync statistics
        """
        try:
            # Fetch all users for tenant from Platform DB
            with self._platform_session_factory() as platform_session:
                statement = select(UserModel).where(UserModel.tenant_id == tenant_id)
                users = platform_session.exec(statement).all()
                user_ids = [user.id for user in users]
            
            logger.info(f"Syncing {len(user_ids)} users for tenant {tenant_id}")
            return await self.sync_users_batch(user_ids)
            
        except Exception as e:
            logger.error(f"Failed to sync tenant users: {str(e)}")
            return {
                "total": 0,
                "success": 0,
                "failed": 0,
                "errors": [str(e)]
            }
    
    async def sync_all_users(self) -> dict:
        """
        Sync all users from Platform DB to Operational DB cache
        
        Use with caution on large datasets!
        Consider using sync_tenant_users() for better performance.
        
        Returns:
            Dict with sync statistics
        """
        try:
            # Fetch all users from Platform DB
            with self._platform_session_factory() as platform_session:
                statement = select(UserModel)
                users = platform_session.exec(statement).all()
                user_ids = [user.id for user in users]
            
            logger.info(f"Syncing all {len(user_ids)} users")
            return await self.sync_users_batch(user_ids)
            
        except Exception as e:
            logger.error(f"Failed to sync all users: {str(e)}")
            return {
                "total": 0,
                "success": 0,
                "failed": 0,
                "errors": [str(e)]
            }
    
    async def _delete_from_cache(self, user_id: str) -> bool:
        """Delete a user from the cache (when deleted from Platform DB)"""
        try:
            with self._operational_session_factory() as operational_session:
                cached_user = operational_session.get(UserCacheModel, user_id)
                if cached_user:
                    operational_session.delete(cached_user)
                    operational_session.commit()
                    logger.info(f"Deleted user cache for {user_id}")
                return True
        except Exception as e:
            logger.error(f"Failed to delete user cache {user_id}: {str(e)}")
            return False
    
    async def get_sync_stats(self, tenant_id: Optional[str] = None) -> dict:
        """
        Get synchronization statistics
        
        Args:
            tenant_id: Optional tenant ID to filter stats
            
        Returns:
            Dict with cache statistics
        """
        try:
            with self._operational_session_factory() as operational_session:
                statement = select(UserCacheModel)
                if tenant_id:
                    statement = statement.where(UserCacheModel.tenant_id == tenant_id)
                
                cached_users = operational_session.exec(statement).all()
                
                now = datetime.now(timezone.utc)
                return {
                    "total_cached": len(cached_users),
                    "tenant_id": tenant_id,
                    "oldest_sync": min((u.synced_at for u in cached_users), default=None),
                    "newest_sync": max((u.synced_at for u in cached_users), default=None),
                    "stale_count": sum(1 for u in cached_users 
                                      if (now - u.synced_at).total_seconds() > 3600),  # > 1 hour
                }
        except Exception as e:
            logger.error(f"Failed to get sync stats: {str(e)}")
            return {"error": str(e)}


# Singleton instance for easy import
user_sync_service = UserSyncService()

