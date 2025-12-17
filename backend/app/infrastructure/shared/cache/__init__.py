"""
Cache infrastructure components

Supports multiple backends:
- Redis (primary, requires redis server)
- DiskCache (fallback, file-based)
"""
from app.infrastructure.shared.cache.cache_service import cache_service, CacheService
from app.infrastructure.shared.cache.query_cache import cache_query_result, invalidate_query_cache
from app.infrastructure.shared.cache.cache_backend import (
    CacheBackend,
    RedisCacheBackend,
    DiskCacheBackend,
    get_backend,
)

__all__ = [
    "cache_service",
    "CacheService",
    "cache_query_result",
    "invalidate_query_cache",
    "CacheBackend",
    "RedisCacheBackend",
    "DiskCacheBackend",
    "get_backend",
]


