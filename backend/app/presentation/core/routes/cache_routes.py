"""
Cache monitoring and management routes
"""
from fastapi import APIRouter, status, Depends
from typing import Dict, Any
from app.infrastructure.shared.cache.cache_service import cache_service
from app.infrastructure.shared.cache.redis_client import redis_client
from app.presentation.core.dependencies.auth_dependencies import get_current_user
from app.domain.shared.authenticated_user import AuthenticatedUser

router = APIRouter(
    prefix="/cache",
    tags=["Cache Management"]
)


@router.get("/stats", response_model=Dict[str, Any])
async def get_cache_stats(
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Get cache statistics and health metrics
    
    Returns:
    - enabled: Whether Redis is available
    - used_memory: Memory used by Redis
    - connected_clients: Number of connected clients
    - total_keys: Total number of cached keys
    - hits: Cache hit count
    - misses: Cache miss count
    """
    return cache_service.get_stats()


@router.get("/health", response_model=Dict[str, Any])
async def check_cache_health():
    """
    Check if Redis cache is available (public endpoint)
    """
    is_available = redis_client.is_available()
    
    return {
        "cache_enabled": is_available,
        "status": "healthy" if is_available else "unavailable",
        "message": "Redis is running" if is_available else "Redis is not available"
    }


@router.post("/invalidate/products", status_code=status.HTTP_204_NO_CONTENT)
async def invalidate_products_cache(
    product_id: str = None,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Invalidate product cache
    
    Args:
    - product_id: Optional specific product ID to invalidate
    
    If product_id is not provided, all product caches will be cleared.
    """
    cache_service.invalidate_product_cache(product_id)
    return None


@router.post("/invalidate/users", status_code=status.HTTP_204_NO_CONTENT)
async def invalidate_users_cache(
    user_id: str = None,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Invalidate user cache
    
    Args:
    - user_id: Optional specific user ID to invalidate
    
    If user_id is not provided, all user caches will be cleared.
    """
    cache_service.invalidate_user_cache(user_id)
    return None


@router.post("/invalidate/lookups", status_code=status.HTTP_204_NO_CONTENT)
async def invalidate_lookups_cache(
    lookup_type: str = None,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Invalidate lookup data cache
    
    Args:
    - lookup_type: Optional specific lookup type to invalidate
    
    If lookup_type is not provided, all lookup caches will be cleared.
    """
    cache_service.invalidate_lookup_cache(lookup_type)
    return None


@router.delete("/flush", status_code=status.HTTP_204_NO_CONTENT)
async def flush_all_cache(
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Flush entire cache (use with caution!)
    
    This will clear ALL cached data.
    """
    if not redis_client.is_available():
        return None
    
    try:
        redis_client.client.flushdb()
        return None
    except Exception as e:
        return {"error": str(e)}

