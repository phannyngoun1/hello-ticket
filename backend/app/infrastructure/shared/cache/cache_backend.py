"""
Cache backend abstraction layer

Provides a unified interface for caching with multiple backend support:
- Redis (primary, if available)
- DiskCache (fallback, file-based)

The backend is automatically selected based on:
1. CACHE_BACKEND environment variable (auto|redis|disk)
2. Redis availability check when set to 'auto'
"""
import os
import json
from abc import ABC, abstractmethod
from typing import Optional, Any, List
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class CacheBackend(ABC):
    """Abstract base class for cache backends"""
    
    @abstractmethod
    def get(self, key: str) -> Optional[str]:
        """Get a value from cache"""
        pass
    
    @abstractmethod
    def set(self, key: str, value: str, ttl: int) -> bool:
        """Set a value in cache with TTL in seconds"""
        pass
    
    @abstractmethod
    def delete(self, key: str) -> bool:
        """Delete a key from cache"""
        pass
    
    @abstractmethod
    def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern (e.g., 'user:*')"""
        pass
    
    @abstractmethod
    def exists(self, key: str) -> bool:
        """Check if key exists"""
        pass
    
    @abstractmethod
    def is_available(self) -> bool:
        """Check if backend is available"""
        pass
    
    @abstractmethod
    def get_stats(self) -> dict:
        """Get cache statistics"""
        pass
    
    @abstractmethod
    def close(self) -> None:
        """Close connections"""
        pass


class RedisCacheBackend(CacheBackend):
    """Redis cache backend implementation"""
    
    def __init__(self):
        self._client = None
        self._available = False
        self._initialize()
    
    def _initialize(self):
        try:
            import redis
            from redis.connection import ConnectionPool
            
            redis_host = os.getenv("REDIS_HOST", "localhost")
            redis_port = int(os.getenv("REDIS_PORT", "6379"))
            redis_db = int(os.getenv("REDIS_DB", "0"))
            redis_password = os.getenv("REDIS_PASSWORD", None)
            
            pool = ConnectionPool(
                host=redis_host,
                port=redis_port,
                db=redis_db,
                password=redis_password,
                decode_responses=True,
                max_connections=50,
                socket_keepalive=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True
            )
            
            self._client = redis.Redis(connection_pool=pool)
            self._client.ping()
            self._available = True
            self._client.ping()
            self._available = True
            logger.info("✅ Redis cache backend connected")
        except Exception as e:
            self._available = False
            logger.warning(f"⚠️  Redis unavailable: {e}")
    
    def get(self, key: str) -> Optional[str]:
        if not self._available:
            return None
        try:
            return self._client.get(key)
        except:
            return None
    
    def set(self, key: str, value: str, ttl: int) -> bool:
        if not self._available:
            return False
        try:
            self._client.setex(key, ttl, value)
            return True
        except:
            return False
    
    def delete(self, key: str) -> bool:
        if not self._available:
            return False
        try:
            self._client.delete(key)
            return True
        except:
            return False
    
    def delete_pattern(self, pattern: str) -> int:
        if not self._available:
            return 0
        try:
            keys = self._client.keys(pattern)
            if keys:
                return self._client.delete(*keys)
            return 0
        except:
            return 0
    
    def exists(self, key: str) -> bool:
        if not self._available:
            return False
        try:
            return bool(self._client.exists(key))
        except:
            return False
    
    def is_available(self) -> bool:
        return self._available
    
    def get_stats(self) -> dict:
        if not self._available:
            return {"backend": "redis", "available": False}
        try:
            info = self._client.info()
            return {
                "backend": "redis",
                "available": True,
                "used_memory": info.get("used_memory_human"),
                "connected_clients": info.get("connected_clients"),
                "total_keys": self._client.dbsize(),
                "hits": info.get("keyspace_hits", 0),
                "misses": info.get("keyspace_misses", 0),
            }
        except:
            return {"backend": "redis", "available": False}
    
    def close(self):
        if self._client:
            self._client.close()


class DiskCacheBackend(CacheBackend):
    """DiskCache backend implementation (file-based fallback)"""
    
    def __init__(self):
        self._cache = None
        self._available = False
        self._initialize()
    
    def _initialize(self):
        try:
            from diskcache import Cache
            
            cache_dir = os.getenv("DISKCACHE_DIR", "/tmp/truths_cache")
            Path(cache_dir).mkdir(parents=True, exist_ok=True)
            
            self._cache = Cache(
                cache_dir,
                size_limit=int(os.getenv("DISKCACHE_SIZE_MB", "100")) * 1024 * 1024
            )
            self._cache = Cache(
                cache_dir,
                size_limit=int(os.getenv("DISKCACHE_SIZE_MB", "100")) * 1024 * 1024
            )
            self._available = True
            logger.info(f"✅ DiskCache backend initialized at {cache_dir}")
        except Exception as e:
            self._available = False
            logger.warning(f"⚠️  DiskCache unavailable: {e}")
    
    def get(self, key: str) -> Optional[str]:
        if not self._available:
            return None
        try:
            return self._cache.get(key)
        except:
            return None
    
    def set(self, key: str, value: str, ttl: int) -> bool:
        if not self._available:
            return False
        try:
            self._cache.set(key, value, expire=ttl)
            return True
        except:
            return False
    
    def delete(self, key: str) -> bool:
        if not self._available:
            return False
        try:
            self._cache.delete(key)
            return True
        except:
            return False
    
    def delete_pattern(self, pattern: str) -> int:
        """Delete keys matching pattern (limited pattern support)"""
        if not self._available:
            return 0
        try:
            # DiskCache doesn't support pattern matching natively
            # We iterate and match manually (less efficient but works)
            import fnmatch
            deleted = 0
            for key in list(self._cache):
                if fnmatch.fnmatch(key, pattern):
                    self._cache.delete(key)
                    deleted += 1
            return deleted
        except:
            return 0
    
    def exists(self, key: str) -> bool:
        if not self._available:
            return False
        try:
            return key in self._cache
        except:
            return False
    
    def is_available(self) -> bool:
        return self._available
    
    def get_stats(self) -> dict:
        if not self._available:
            return {"backend": "diskcache", "available": False}
        try:
            return {
                "backend": "diskcache",
                "available": True,
                "total_keys": len(self._cache),
                "size_bytes": self._cache.volume(),
            }
        except:
            return {"backend": "diskcache", "available": False}
    
    def close(self):
        if self._cache:
            self._cache.close()


def get_cache_backend() -> CacheBackend:
    """
    Factory function to get the appropriate cache backend.
    
    CACHE_BACKEND options:
    - 'auto': Try Redis first, fallback to DiskCache (default)
    - 'redis': Use Redis only (fails if unavailable)
    - 'disk': Use DiskCache only
    """
    backend_type = os.getenv("CACHE_BACKEND", "auto").lower()
    
    if backend_type == "redis":
        return RedisCacheBackend()
    
    if backend_type == "disk":
        return DiskCacheBackend()
    
    # Auto mode: try Redis, fallback to DiskCache
    redis_backend = RedisCacheBackend()
    if redis_backend.is_available():
        return redis_backend
    
    logger.info("ℹ️  Falling back to DiskCache")
    return DiskCacheBackend()


# Global cache backend instance
_cache_backend: Optional[CacheBackend] = None


def get_backend() -> CacheBackend:
    """Get the global cache backend instance"""
    global _cache_backend
    if _cache_backend is None:
        _cache_backend = get_cache_backend()
    return _cache_backend
