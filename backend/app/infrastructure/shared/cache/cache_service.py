"""
Cache service with TTL management and key patterns

Provides a high-level API for caching operations with support for:
- Redis (primary, if available)
- DiskCache (fallback, file-based)
"""
import json
from typing import Optional, Any, List
from datetime import timedelta
import logging
from app.infrastructure.shared.cache.cache_backend import get_backend, CacheBackend

logger = logging.getLogger(__name__)


class CacheService:
    """
    Centralized cache service for managing cache operations
    
    Key Patterns:
    - product:{id} - Single product cache
    - products:all:{skip}:{limit} - Product list cache
    - user:{id} - Single user cache
    - lookup:{type}:{key} - Lookup/master data
    """
    
    # Default TTL values for different data types
    TTL_SHORT = int(timedelta(minutes=5).total_seconds())      # 5 minutes
    TTL_MEDIUM = int(timedelta(hours=1).total_seconds())       # 1 hour
    TTL_LONG = int(timedelta(hours=24).total_seconds())        # 24 hours
    TTL_LOOKUP = int(timedelta(days=7).total_seconds())        # 7 days
    
    def __init__(self):
        self._backend: CacheBackend = get_backend()
    
    @property
    def is_enabled(self) -> bool:
        """Check if caching is enabled"""
        return self._backend.is_available()
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache by key
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None if not found
        """
        if not self.is_enabled:
            return None
        
        try:
            value = self._backend.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
            return None
    
    def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None
    ) -> bool:
        """
        Set value in cache with optional TTL
        
        Args:
            key: Cache key
            value: Value to cache (must be JSON serializable)
            ttl: Time to live in seconds (default: TTL_MEDIUM)
            
        Returns:
            True if successful, False otherwise
        """
        if not self.is_enabled:
            return False
        
        try:
            ttl = ttl or self.TTL_MEDIUM
            serialized = json.dumps(value)
            return self._backend.set(key, serialized, ttl)
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """
        Delete value from cache
        
        Args:
            key: Cache key
            
        Returns:
            True if successful, False otherwise
        """
        if not self.is_enabled:
            return False
        
        try:
            return self._backend.delete(key)
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False
    
    def delete_pattern(self, pattern: str) -> int:
        """
        Delete all keys matching a pattern
        
        Args:
            pattern: Key pattern (e.g., "product:*")
            
        Returns:
            Number of keys deleted
        """
        if not self.is_enabled:
            return 0
        
        try:
            return self._backend.delete_pattern(pattern)
        except Exception as e:
            logger.error(f"Cache delete pattern error for {pattern}: {e}")
            return 0
    
    def invalidate_product_cache(self, product_id: Optional[str] = None):
        """
        Invalidate product-related cache
        
        Args:
            product_id: Specific product ID to invalidate, or None for all products
        """
        if product_id:
            self.delete(f"product:{product_id}")
        else:
            self.delete_pattern("product:*")
            self.delete_pattern("products:*")
    
    def invalidate_user_cache(self, user_id: Optional[str] = None):
        """
        Invalidate user-related cache
        
        Args:
            user_id: Specific user ID to invalidate, or None for all users
        """
        if user_id:
            self.delete(f"user:{user_id}")
        else:
            self.delete_pattern("user:*")
    
    def invalidate_lookup_cache(self, lookup_type: Optional[str] = None):
        """
        Invalidate lookup data cache
        
        Args:
            lookup_type: Specific lookup type to invalidate, or None for all
        """
        if lookup_type:
            self.delete_pattern(f"lookup:{lookup_type}:*")
        else:
            self.delete_pattern("lookup:*")
    
    def get_cached_list(self, key: str) -> Optional[List[Any]]:
        """Get a list from cache"""
        return self.get(key)
    
    def set_cached_list(
        self,
        key: str,
        items: List[Any],
        ttl: Optional[int] = None
    ) -> bool:
        """Set a list in cache"""
        return self.set(key, items, ttl)
    
    def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        if not self.is_enabled:
            return False
        
        try:
            return self._backend.exists(key)
        except:
            return False
    
    def get_stats(self) -> dict:
        """Get cache statistics"""
        if not self.is_enabled:
            return {"enabled": False}
        
        try:
            stats = self._backend.get_stats()
            stats["enabled"] = True
            return stats
        except:
            return {"enabled": False, "error": "Cannot retrieve stats"}


# Global cache service instance
cache_service = CacheService()


