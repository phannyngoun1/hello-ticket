"""
Response caching middleware for API responses
"""
import hashlib
import json
import logging
from typing import Callable, Optional
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.infrastructure.shared.cache.cache_service import CacheService, cache_service

logger = logging.getLogger(__name__)


class ResponseCacheMiddleware(BaseHTTPMiddleware):
    """
    Middleware to cache API responses
    
    Configuration:
    - CACHE_RESPONSES_ENABLED: Enable/disable response caching (default: true)
    - CACHE_RESPONSES_TTL: Time to live in seconds (default: 300 = 5 minutes)
    - CACHE_RESPONSES_MAX_SIZE: Maximum response size to cache in bytes (default: 1MB)
    
    Caching Strategy:
    - Only caches GET requests
    - Only caches successful responses (200-299)
    - Excludes responses with query parameters that include timestamps
    - Excludes responses larger than max_size
    - Includes tenant_id and user_id in cache key
    """
    
    def __init__(
        self,
        app,
        enabled: bool = None,
        ttl: float = None,
        max_size: int = None,
        excluded_paths: list = None
    ):
        super().__init__(app)
        
        import os
        self.enabled = enabled if enabled is not None else (
            os.getenv("CACHE_RESPONSES_ENABLED", "true").lower() == "true"
        )
        self.ttl = ttl or float(os.getenv("CACHE_RESPONSES_TTL", "300"))
        self.max_size = max_size or int(os.getenv("CACHE_RESPONSES_MAX_SIZE", "1048576"))  # 1MB
        
        # Paths to exclude from caching
        self.excluded_paths = excluded_paths or [
            "/health",
            "/api/v1/health",
            "/docs",
            "/openapi.json",
            "/.well-known",
            "/api/v1/auth",  # Authentication endpoints
            "/api/v1/cache",  # Cache management endpoints
        ]
    
    def _should_cache(self, request: Request) -> bool:
        """Determine if request should be cached"""
        # Only cache GET requests
        if request.method != "GET":
            return False
        
        # Skip excluded paths
        if any(request.url.path.startswith(path) for path in self.excluded_paths):
            return False
        
        # Skip if cache disabled
        if not self.enabled or not cache_service.is_enabled:
            return False
        
        # Skip if query params include timestamp-like values (dynamic content)
        query_params = dict(request.query_params)
        timestamp_keys = ['timestamp', 'time', 'now', 'since', 'until', 'updated_at', 'created_at']
        if any(key in query_params for key in timestamp_keys):
            return False
        
        return True
    
    def _generate_cache_key(self, request: Request) -> str:
        """Generate cache key from request"""
        # Get tenant ID
        from app.shared.tenant_context import get_tenant_context
        tenant_id = get_tenant_context() or "no-tenant"
        
        # Get user ID if available
        user_id = getattr(request.state, "user_id", None) or "anonymous"
        
        # Build cache key
        key_parts = [
            "response",
            tenant_id,
            user_id,
            request.method,
            request.url.path,
        ]
        
        # Include query parameters (sorted for consistency)
        if request.query_params:
            query_dict = dict(sorted(request.query_params.items()))
            query_str = json.dumps(query_dict, sort_keys=True)
            query_hash = hashlib.md5(query_str.encode()).hexdigest()[:8]
            key_parts.append(query_hash)
        
        return ":".join(key_parts)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request with response caching"""
        # Check if should cache
        if not self._should_cache(request):
            return await call_next(request)
        
        # Generate cache key
        cache_key = self._generate_cache_key(request)
        
        # Try to get from cache
        cached_response = cache_service.get(cache_key)
        if cached_response is not None:
            logger.debug(f"Cache hit for response: {cache_key}")
            
            # Return cached response
            response = JSONResponse(content=cached_response)
            response.headers["X-Cache"] = "HIT"
            response.headers["X-Cache-Key"] = cache_key
            return response
        
        # Execute request
        logger.debug(f"Cache miss for response: {cache_key}")
        response = await call_next(request)
        
        # Cache successful responses
        if 200 <= response.status_code < 300:
            # Check response size
            if hasattr(response, 'body'):
                response_body = response.body
                if isinstance(response_body, bytes):
                    if len(response_body) <= self.max_size:
                        try:
                            # Parse JSON response
                            response_json = json.loads(response_body.decode())
                            
                            # Cache response
                            cache_service.set(cache_key, response_json, ttl=self.ttl)
                            
                            # Add cache headers
                            if isinstance(response, Response):
                                response.headers["X-Cache"] = "MISS"
                                response.headers["X-Cache-Key"] = cache_key
                        except (json.JSONDecodeError, UnicodeDecodeError):
                            # Skip caching non-JSON responses
                            pass
        
        return response

