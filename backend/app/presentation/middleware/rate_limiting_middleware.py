"""
Rate limiting middleware to prevent abuse
"""
import os
import time
import logging
from typing import Dict, Tuple
from collections import defaultdict
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class RateLimitingMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware using sliding window algorithm
    
    Configuration:
    - RATE_LIMIT_ENABLED: Enable/disable rate limiting (default: true in production)
    - RATE_LIMIT_REQUESTS: Max requests per window (default: 300)
    - RATE_LIMIT_WINDOW_SECONDS: Time window in seconds (default: 60)
    """
    
    def __init__(self, app, enabled: bool = None, max_requests: int = None, window_seconds: int = None):
        super().__init__(app)
        
        # Configuration from environment or defaults
        self.enabled = enabled if enabled is not None else (
            os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"
        )
        self.max_requests = max_requests or int(os.getenv("RATE_LIMIT_REQUESTS", "300"))
        self.window_seconds = window_seconds or int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
        
        # In-memory storage (use Redis in production for distributed systems)
        self._request_times: Dict[str, list] = defaultdict(list)
        
        # Excluded paths (health checks, etc.)
        self._excluded_paths = [
            "/health",
            "/api/v1/health",
            "/docs",
            "/openapi.json",
            "/.well-known",
        ]
        # Paths excluded only for GET (read-only, high-volume: profile photos, attachments)
        self._excluded_for_get_paths = [
            "/api/v1/shared/attachments/entity",
        ]
    
    def _get_client_identifier(self, request: Request) -> str:
        """Get unique identifier for rate limiting (IP address or user ID)"""
        # Try to get user ID from request state
        user_id = getattr(request.state, "user_id", None)
        if user_id:
            return f"user:{user_id}"
        
        # Fall back to IP address
        client_ip = request.client.host if request.client else "unknown"
        return f"ip:{client_ip}"
    
    def _cleanup_old_requests(self, client_id: str, current_time: float):
        """Remove requests outside the time window"""
        if client_id not in self._request_times:
            return
        
        window_start = current_time - self.window_seconds
        self._request_times[client_id] = [
            req_time for req_time in self._request_times[client_id]
            if req_time > window_start
        ]
    
    def _is_rate_limited(self, client_id: str, current_time: float) -> Tuple[bool, int]:
        """Check if client is rate limited"""
        if not self.enabled:
            return False, 0
        
        # Clean up old requests
        self._cleanup_old_requests(client_id, current_time)
        
        # Count requests in current window
        request_count = len(self._request_times[client_id])
        
        # Check if limit exceeded
        if request_count >= self.max_requests:
            return True, request_count
        
        # Record this request
        self._request_times[client_id].append(current_time)
        
        return False, request_count
    
    def _should_skip_rate_limit(self, request: Request) -> bool:
        """Check if request should skip rate limiting"""
        if any(request.url.path.startswith(p) for p in self._excluded_paths):
            return True
        # Skip GET requests to read-only attachment endpoints (profile photos, etc.)
        if request.method == "GET" and any(
            request.url.path.startswith(p) for p in self._excluded_for_get_paths
        ):
            return True
        return False

    async def dispatch(self, request: Request, call_next):
        """Process request with rate limiting"""
        if self._should_skip_rate_limit(request):
            return await call_next(request)
        
        # Get client identifier
        client_id = self._get_client_identifier(request)
        current_time = time.time()
        
        # Check rate limit
        is_limited, request_count = self._is_rate_limited(client_id, current_time)
        
        if is_limited:
            logger.warning(
                f"Rate limit exceeded for {client_id}: {request_count} requests in {self.window_seconds}s",
                extra={
                    "client_id": client_id,
                    "request_count": request_count,
                    "window_seconds": self.window_seconds,
                    "path": request.url.path,
                }
            )
            
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "Rate Limit Exceeded",
                    "error_code": "RATE_LIMIT_EXCEEDED",
                    "message": f"Too many requests. Limit: {self.max_requests} per {self.window_seconds} seconds",
                    "retry_after": self.window_seconds,
                },
                headers={
                    "Retry-After": str(self.window_seconds),
                    "X-RateLimit-Limit": str(self.max_requests),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(current_time) + self.window_seconds),
                }
            )
        
        # Add rate limit headers to response
        response = await call_next(request)
        
        remaining = max(0, self.max_requests - request_count - 1)
        response.headers["X-RateLimit-Limit"] = str(self.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(current_time) + self.window_seconds)
        
        return response

