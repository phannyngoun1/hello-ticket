"""
Session validation middleware
"""
from typing import Optional
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from app.infrastructure.shared.security.jwt_handler import JWTHandler
from app.infrastructure.core.session.repository import SQLSessionRepository
from app.application.core.session import SessionService


class SessionValidationMiddleware(BaseHTTPMiddleware):
    """Middleware to validate session for authenticated requests"""
    
    def __init__(self, app, excluded_paths: Optional[list] = None):
        super().__init__(app)
        self._jwt_handler = JWTHandler()
        self._session_repository = SQLSessionRepository()
        self._session_service = SessionService(self._session_repository)
        
        # Paths that don't require session validation
        self._excluded_paths = excluded_paths or [
            "/api/v1/auth/token",
            "/api/v1/auth/register",
            "/api/v1/auth/refresh",
            "/api/v1/auth/.well-known/openid-configuration",
            "/api/v1/auth/health",
            "/api/v1/sessions/health",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/health"
        ]
    
    async def dispatch(self, request: Request, call_next):
        """Validate session for authenticated requests"""
        
        # Skip validation for excluded paths
        if any(request.url.path.startswith(path) for path in self._excluded_paths):
            return await call_next(request)
        
        # Check if request has authorization header
        auth_header = request.headers.get("authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            # No auth header, let the endpoint handle authentication
            return await call_next(request)
        
        # Extract token
        token = auth_header.replace("Bearer ", "")
        
        try:
            # Decode token to get session_id
            payload = self._jwt_handler.decode_token(token)
            session_id = payload.get("session_id")
            
            # If no session_id in token, allow request (backward compatibility)
            if not session_id:
                return await call_next(request)
            
            # Validate session
            is_valid = await self._session_service.validate_session(session_id)
            
            if not is_valid:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Session has expired or been revoked. Please login again.",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            # Update session activity
            await self._session_service.update_session_activity(session_id)
            
            # Add session_id to request state for use in endpoints
            request.state.session_id = session_id
            
        except HTTPException:
            raise
        except Exception:
            # If session validation fails, let the endpoint handle authentication
            pass
        
        return await call_next(request)

