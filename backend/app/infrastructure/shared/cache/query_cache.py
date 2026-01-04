"""
Query result caching decorator and utilities
"""
import hashlib
import json
import logging
from functools import wraps
from typing import Any, Callable, Optional, TypeVar
from datetime import timedelta

from app.infrastructure.shared.cache.cache_service import cache_service

logger = logging.getLogger(__name__)

T = TypeVar('T')


async def _is_query_cache_enabled_async() -> bool:
    """
    Check if query cache is enabled for the current user (async version).
    Returns True by default (backward compatible) if user context is not available.
    """
    try:
        from app.infrastructure.shared.audit.audit_logger import get_audit_context
        audit_context = get_audit_context()
        
        if not audit_context or not audit_context.user_id:
            # No user context, default to enabled
            return True
        
        # Get user preferences to check cache setting
        try:
            from app.shared.tenant_context import get_tenant_context
            from app.shared.container import container
            from app.domain.core.user.preference_repository import UserPreferenceRepository
            from app.application.core.user import UserPreferenceService
            
            tenant_id = get_tenant_context()
            if not tenant_id:
                # No tenant context, default to enabled
                return True
            
            # Get preference service and check cache setting
            repository = container.resolve(UserPreferenceRepository)
            service = UserPreferenceService(repository)
            
            # Check the cache.queryCacheEnabled preference
            cache_enabled = await service.get_preference(
                audit_context.user_id,
                tenant_id,
                "cache",
                "queryCacheEnabled"
            )
            
            # If preference is explicitly set to False, disable cache
            # Otherwise, default to enabled (backward compatible)
            if cache_enabled is False:
                return False
            
            return True
        except Exception as e:
            logger.debug(f"Could not check user preference for query cache: {e}")
            return True  # Default to enabled on error
    except Exception as e:
        logger.debug(f"Could not get audit context for query cache check: {e}")
        return True  # Default to enabled on error


def cache_query_result(
    ttl: Optional[float] = None,
    key_prefix: str = "query",
    include_tenant: bool = True,
    include_args: bool = True
):
    """
    Decorator to cache query results
    
    Args:
        ttl: Time to live in seconds (default: CacheService.TTL_MEDIUM)
        key_prefix: Prefix for cache key
        include_tenant: Include tenant_id in cache key
        include_args: Include function arguments in cache key
    
    Usage:
        @cache_query_result(ttl=3600, key_prefix="item")
        async def get_item_by_id(self, item_id: str) -> Optional[Item]:
            ...
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> T:
            # Skip caching if cache service is disabled
            if not cache_service.is_enabled:
                return await func(*args, **kwargs)
            
            # Check if query cache is enabled for this user
            if not await _is_query_cache_enabled_async():
                return await func(*args, **kwargs)
            
            # Build cache key
            cache_key_parts = [key_prefix]
            
            # Include tenant if available
            if include_tenant:
                try:
                    from app.shared.tenant_context import get_tenant_context
                    tenant_id = get_tenant_context()
                    if tenant_id:
                        cache_key_parts.append(f"tenant:{tenant_id}")
                except Exception:
                    pass
            
            # Include function name
            cache_key_parts.append(func.__name__)
            
            # Include arguments if specified
            if include_args:
                # Create hash of arguments for cache key
                args_str = json.dumps({
                    "args": [str(arg) for arg in args[1:]],  # Skip 'self'
                    "kwargs": {k: str(v) for k, v in kwargs.items()}
                }, sort_keys=True)
                args_hash = hashlib.md5(args_str.encode()).hexdigest()[:8]
                cache_key_parts.append(args_hash)
            
            cache_key = ":".join(cache_key_parts)
            
            # Try to get from cache
            # Note: For domain entities, we skip caching, so we won't get cache hits
            # But we check anyway in case there's old cached data that needs to be invalidated
            cached_result = cache_service.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit for query: {cache_key}")
                # Only return cached results if they're simple types (dict, list, primitives)
                # Domain entities should not be reconstructed from cache
                if isinstance(cached_result, (dict, list, str, int, float, bool, type(None))):
                    return cached_result
                else:
                    # If cached result is not a simple type, skip it (might be old cached entity)
                    logger.debug(f"Skipping cached result of type {type(cached_result)} - may be domain entity")
                    # Invalidate this cache entry
                    try:
                        cache_service.delete(cache_key)
                    except Exception:
                        pass
                    # Fall through to execute query
            
            # Execute query
            logger.debug(f"Cache miss for query: {cache_key}")
            result = await func(*args, **kwargs)
            
            # Cache result - skip caching domain entities to avoid serialization issues
            # Domain entities may contain database sessions, relationships, or other non-serializable objects
            if result is not None:
                # Check if this is a domain entity (has specific attributes that indicate it's not cacheable)
                is_domain_entity = (
                    hasattr(result, '__class__') and
                    hasattr(result.__class__, '__module__') and
                    'domain' in result.__class__.__module__
                )
                
                if is_domain_entity:
                    # Skip caching domain entities - they may contain non-serializable objects
                    logger.debug(f"Skipping cache for domain entity: {type(result)}")
                    return result
                
                # Convert result to dict if needed
                try:
                    if hasattr(result, 'dict'):
                        result_dict = result.dict()
                    elif hasattr(result, '__dict__'):
                        # Filter out non-serializable attributes
                        result_dict = {}
                        for key, value in result.__dict__.items():
                            # Skip private attributes and non-serializable types
                            if key.startswith('_'):
                                continue
                            # Try to check if value is serializable
                            try:
                                json.dumps(value, default=str)
                                result_dict[key] = value
                            except (TypeError, ValueError):
                                logger.debug(f"Skipping non-serializable attribute {key}: {type(value)}")
                                continue
                    elif isinstance(result, (dict, list, str, int, float, bool)):
                        result_dict = result
                    else:
                        # Skip caching if can't serialize
                        logger.debug(f"Cannot cache result type: {type(result)}")
                        return result
                    
                    # Try to cache, but don't fail if serialization fails
                    try:
                        cache_service.set(cache_key, result_dict, ttl=ttl)
                    except Exception as e:
                        logger.warning(f"Failed to cache result for key {cache_key}: {e}")
                        # Continue execution even if caching fails
                except Exception as e:
                    logger.warning(f"Failed to prepare result for caching: {e}")
                    # Continue execution even if caching fails
            
            return result
        
        return wrapper
    return decorator


def invalidate_query_cache(
    key_prefix: str,
    tenant_id: Optional[str] = None,
    item_id: Optional[str] = None
):
    """
    Invalidate cached query results
    
    Args:
        key_prefix: Cache key prefix to invalidate
        tenant_id: Optional tenant ID to scope invalidation
        item_id: Optional item ID to scope invalidation
    
    Usage:
        invalidate_query_cache("item", tenant_id="t1", item_id="item123")
    """
    if not cache_service.is_enabled:
        return
    
    # Build pattern for cache invalidation
    pattern_parts = [key_prefix]
    
    if tenant_id:
        pattern_parts.append(f"tenant:{tenant_id}")
    
    if item_id:
        pattern_parts.append(f"*item:{item_id}*")
    
    pattern = ":".join(pattern_parts) + ":*"
    
    try:
        deleted_count = cache_service.delete_pattern(pattern)
        logger.info(f"Invalidated {deleted_count} cache entries for pattern: {pattern}")
    except Exception as e:
        logger.warning(f"Failed to invalidate cache pattern {pattern}: {e}")

