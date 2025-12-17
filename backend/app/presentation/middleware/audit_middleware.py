"""
Audit middleware for setting request-scoped audit context
"""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from contextvars import ContextVar
from typing import Optional
import uuid

from app.infrastructure.shared.audit.audit_logger import AuditContext, set_audit_context, set_audit_logger, AuditLogger
from app.shared.container import container

# Context variable for audit context (thread-safe)
_audit_context_var: ContextVar[Optional[AuditContext]] = ContextVar(
    'audit_context',
    default=None
)


class AuditMiddleware(BaseHTTPMiddleware):
    """
    Middleware to set audit context for each request
    
    Extracts:
    - User information from authentication token
    - Request ID (generates if not present)
    - IP address and user agent
    - Session ID if available
    """
    
    async def dispatch(self, request: Request, call_next):
        """Set audit context for request"""
        # Try to get current user (if authenticated)
        user = None
        try:
            # Use optional auth to avoid errors for unauthenticated requests
            from app.presentation.core.dependencies.auth_dependencies import oauth2_scheme_optional
            from fastapi import Depends
            
            # Extract token manually
            auth_header = request.headers.get("Authorization")
            token = None
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
            
            # Get user if token present
            if token:
                try:
                    from app.shared.container import container
                    from app.application.core.auth import AuthService
                    auth_service = container.resolve(AuthService)
                    user = await auth_service.get_current_user(token)
                except Exception:
                    # Not authenticated or invalid token - that's okay
                    pass
        except Exception:
            # Fail silently - audit logging should not break requests
            pass
        
        # Generate request ID if not present
        request_id = request.headers.get("X-Request-ID")
        if not request_id:
            request_id = str(uuid.uuid4())
        
        # Extract IP address
        ip_address = None
        if request.client:
            ip_address = request.client.host
        
        # Create audit context
        # Convert Email value object to string if present
        user_email_str = None
        if user and user.email:
            user_email_str = str(user.email)
        
        context = AuditContext(
            user_id=user.id if user else None,
            user_email=user_email_str,
            session_id=request.headers.get("X-Session-ID"),
            request_id=request_id,
            ip_address=ip_address,
            user_agent=request.headers.get("User-Agent")
        )
        
        # Set audit context in context variable (thread-safe)
        token = _audit_context_var.set(context)
        
        # Also ensure audit logger is set in context
        try:
            audit_logger = container.resolve(AuditLogger)
            if audit_logger:
                set_audit_logger(audit_logger)
        except Exception:
            # Logger not available - that's okay, handlers can fallback
            pass
        
        try:
            # Also set in legacy function for backward compatibility
            set_audit_context(context)
            
            response = await call_next(request)
            
            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            
            return response
        finally:
            # Clear context
            _audit_context_var.set(None)
            set_audit_context(None)
            # Note: We don't clear the logger as it's a global singleton


def get_audit_context_from_var() -> Optional[AuditContext]:
    """Get audit context from context variable (thread-safe)"""
    return _audit_context_var.get()

