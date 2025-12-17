"""
Authentication routes - OpenID Connect compatible
"""
from typing import Dict, Any, Optional, Annotated
from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from app.domain.shared.value_objects.role import UserRole
from app.domain.shared.value_objects.device_info import DeviceInfo
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.application.core.auth import AuthService
from app.application.core.session import SessionService
from app.presentation.core.dependencies.auth_dependencies import (
    get_auth_service,
    get_current_user,
    get_current_active_user,
    get_current_user_bypass_password_check
)
from app.infrastructure.shared.security.oauth2_scheme import OPENID_CONFIGURATION
from app.shared.exceptions import ValidationError, BusinessRuleError, NotFoundError
from app.infrastructure.shared.security.jwt_handler import JWTHandler
from app.shared.utils import log_error
from app.infrastructure.shared.cache.cache_service import cache_service
from app.infrastructure.shared.audit.audit_logger import (
    AuditEvent,
    AuditEventType,
    AuditSeverity,
    get_audit_context,
    _audit_logger_var
)


router = APIRouter(prefix="/auth", tags=["authentication"])


# Helper functions for audit logging
async def _log_login_event(user: AuthenticatedUser, request: Request, session_id: Optional[str] = None) -> None:
    """Log login event to audit log"""
    try:
        audit_logger = _audit_logger_var.get()
        if not audit_logger:
            return
        
        context = get_audit_context()
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("User-Agent")
        
        if context:
            audit_event = context.create_event(
                event_type=AuditEventType.LOGIN,
                entity_type="user",
                entity_id=user.id,
                description=f"User logged in: {user.username} ({user.email.value})",
                new_values={
                    "username": user.username,
                    "email": user.email.value,
                    "session_id": session_id,
                    "last_login": user.last_login.isoformat() if user.last_login else None
                },
                severity=AuditSeverity.MEDIUM
            )
            audit_event.session_id = session_id or context.session_id
            audit_event.ip_address = ip_address or context.ip_address
            audit_event.user_agent = user_agent or context.user_agent
        else:
            from datetime import datetime, timezone
            from app.shared.utils import generate_id
            
            audit_event = AuditEvent(
                event_id=generate_id(),
                timestamp=datetime.now(timezone.utc),
                event_type=AuditEventType.LOGIN,
                severity=AuditSeverity.MEDIUM,
                entity_type="user",
                entity_id=user.id,
                user_id=user.id,
                user_email=str(user.email.value),
                session_id=session_id,
                ip_address=ip_address,
                user_agent=user_agent,
                description=f"User logged in: {user.username} ({user.email.value})",
                new_values={
                    "username": user.username,
                    "email": user.email.value,
                    "session_id": session_id,
                    "last_login": user.last_login.isoformat() if user.last_login else None
                },
                metadata={"logged_without_request_context": True}
            )
        
        await audit_logger.log_event(audit_event)
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Failed to log login audit event: {e}")


async def _log_logout_event(user_id: str, session_id: Optional[str], request: Request) -> None:
    """Log logout event to audit log"""
    try:
        audit_logger = _audit_logger_var.get()
        if not audit_logger:
            return
        
        context = get_audit_context()
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("User-Agent")
        
        if context:
            audit_event = context.create_event(
                event_type=AuditEventType.LOGOUT,
                entity_type="user",
                entity_id=user_id,
                description=f"User logged out",
                severity=AuditSeverity.LOW
            )
            audit_event.session_id = session_id or context.session_id
            audit_event.ip_address = ip_address or context.ip_address
            audit_event.user_agent = user_agent or context.user_agent
        else:
            from datetime import datetime, timezone
            from app.shared.utils import generate_id
            
            audit_event = AuditEvent(
                event_id=generate_id(),
                timestamp=datetime.now(timezone.utc),
                event_type=AuditEventType.LOGOUT,
                severity=AuditSeverity.LOW,
                entity_type="user",
                entity_id=user_id,
                user_id=user_id,
                session_id=session_id,
                ip_address=ip_address,
                user_agent=user_agent,
                description="User logged out",
                metadata={"logged_without_request_context": True}
            )
        
        await audit_logger.log_event(audit_event)
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Failed to log logout audit event: {e}")


async def _log_password_change_event(user: AuthenticatedUser, request: Request) -> None:
    """Log password change event to audit log"""
    try:
        audit_logger = _audit_logger_var.get()
        if not audit_logger:
            return
        
        context = get_audit_context()
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("User-Agent")
        
        if context:
            audit_event = context.create_event(
                event_type=AuditEventType.PASSWORD_CHANGE,
                entity_type="user",
                entity_id=user.id,
                description=f"User changed password",
                new_values={
                    "password_changed_at": user.last_password_change.isoformat() if user.last_password_change else None,
                    "must_change_password": user.must_change_password
                },
                severity=AuditSeverity.HIGH
            )
            audit_event.ip_address = ip_address or context.ip_address
            audit_event.user_agent = user_agent or context.user_agent
        else:
            from datetime import datetime, timezone
            from app.shared.utils import generate_id
            
            audit_event = AuditEvent(
                event_id=generate_id(),
                timestamp=datetime.now(timezone.utc),
                event_type=AuditEventType.PASSWORD_CHANGE,
                severity=AuditSeverity.HIGH,
                entity_type="user",
                entity_id=user.id,
                user_id=user.id,
                user_email=str(user.email.value),
                ip_address=ip_address,
                user_agent=user_agent,
                description="User changed password",
                new_values={
                    "password_changed_at": user.last_password_change.isoformat() if user.last_password_change else None,
                    "must_change_password": user.must_change_password
                },
                metadata={"logged_without_request_context": True}
            )
        
        await audit_logger.log_event(audit_event)
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Failed to log password change audit event: {e}")


# Custom exception handler for auth routes
def handle_auth_exception(exc: Exception, default_message: str = "Authentication failed") -> HTTPException:
    """
    Custom exception handler for authentication routes that preserves
    WWW-Authenticate header and specific error messages.
    
    Args:
        exc: The exception that occurred
        default_message: Default message for generic exceptions
        
    Returns:
        HTTPException with appropriate status code and headers
    """
    if isinstance(exc, (ValidationError, BusinessRuleError)):
        # For validation/business rule errors in auth context, use 401 with WWW-Authenticate
        log_error(exc, context={"auth_endpoint": True, "status_code": 401})
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        )
    else:
        # For any other exception, use 500 with generic message
        log_error(exc, context={"auth_endpoint": True, "status_code": 500})
        return HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=default_message
        )


# Request/Response Models
class UserRegister(BaseModel):
    """User registration request"""
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8)
    first_name: str = Field(min_length=1, max_length=50)
    last_name: str = Field(min_length=1, max_length=50)
    base_role: UserRole = UserRole.USER


class TokenResponse(BaseModel):
    """Token response (OpenID Connect compatible)"""
    access_token: str
    refresh_token: str
    id_token: str
    token_type: str = "bearer"
    expires_in: int = 1800  # 30 minutes
    must_change_password: bool = False  # Indicates if user must change password


class UserResponse(BaseModel):
    """User info response (OpenID Connect UserInfo endpoint)"""
    sub: str  # subject (user_id)
    username: str
    first_name: str
    last_name: str
    email: str
    email_verified: bool
    role: str
    is_active: bool
    created_at: str


class ChangePasswordRequest(BaseModel):
    """Change password request"""
    current_password: str
    new_password: str = Field(min_length=8)


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str


class LogoutRequest(BaseModel):
    """Logout request"""
    refresh_token: str


# Dependencies
def get_session_service() -> SessionService:
    """Get session service from container"""
    from app.shared.container import container
    return container.resolve(SessionService)


def get_jwt_handler() -> JWTHandler:
    """Get JWT handler from container"""
    from app.shared.container import container
    return container.resolve(JWTHandler)


# Routes
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Register new user
    
    Creates a new user account with the specified role.
    Default role is 'user'. Only admins can create admin accounts.
    """
    try:
        user = await auth_service.register(
            username=user_data.username,
            email=user_data.email,
            password=user_data.password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            role=user_data.base_role
        )
        
        return UserResponse(
            sub=user.id,
            username=user.username,
            first_name=user.first_name.value,
            last_name=user.last_name.value,
            email=user.email.value,
            email_verified=user.is_verified,
            role=user.role.value,
            is_active=user.is_active,
            created_at=user.created_at.isoformat()
        )
    except Exception as e:
        raise handle_auth_exception(e, "Registration failed")


@router.post("/token", response_model=TokenResponse)
async def login(
    request: Request,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    auth_service: AuthService = Depends(get_auth_service)
):
    """OAuth2 token endpoint (OpenID Connect compatible)
    
    Authenticate user and return access token, refresh token, and ID token.
    Username can be either username or email.
    
    This endpoint follows OAuth2 and OpenID Connect standards.
    """
    try:
        # Extract device information from request
        user_agent = request.headers.get("user-agent", "Unknown")
        client_ip = request.client.host if request.client else "Unknown"
        
        device_info = DeviceInfo.from_request(
            user_agent=user_agent,
            ip_address=client_ip
        )
        
        user, tokens = await auth_service.authenticate(
            username=form_data.username,
            password=form_data.password,
            device_info=device_info
        )
        
        # Log login event to audit log
        # Session ID will be extracted from context or request if available
        await _log_login_event(user, request, None)
        
        # Include must_change_password flag in response
        return TokenResponse(
            **tokens,
            must_change_password=user.must_change_password
        )
    except Exception as e:
        raise handle_auth_exception(e, "Authentication failed")


@router.post("/refresh", response_model=Dict[str, str])
async def refresh_token(
    request: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Refresh access token
    
    Use a valid refresh token to obtain a new access token.
    """
    try:
        tokens = await auth_service.refresh_access_token(request.refresh_token)
        return tokens
    except Exception as e:
        raise handle_auth_exception(e, "Token refresh failed")


@router.post("/logout")
async def logout(
    request: Request,
    logout_request: LogoutRequest,
    session_service: SessionService = Depends(get_session_service),
    jwt_handler: JWTHandler = Depends(get_jwt_handler)
):
    """Logout user and revoke session
    
    Invalidates the user's session on the server side by revoking it.
    Also clears user cache to prevent showing previous user's cached data
    when a different user logs in. The client should also clear tokens from local storage.
    """
    user_id = None
    session_id = None
    try:
        # Decode the refresh token to get session_id and user_id
        try:
            payload = jwt_handler.decode_token(logout_request.refresh_token)
            session_id = payload.get("session_id")
            user_id = payload.get("sub")  # user_id is stored as 'sub' in JWT
        except Exception:
            # If token is invalid or expired, still return success
            # (user is already effectively logged out)
            return {
                "message": "Logged out successfully",
                "detail": "Token was invalid or expired"
            }
        
        # If there's no session_id in the token, return success
        # (old token format or token without session tracking)
        if not session_id:
            # Still try to clear user cache if we have user_id
            if user_id:
                cache_service.invalidate_user_cache(user_id)
                # Log logout event even if no session
                await _log_logout_event(user_id, None, request)
            return {
                "message": "Logged out successfully",
                "detail": "No session to revoke"
            }
        
        # Revoke the session
        try:
            await session_service.revoke_session(
                session_id=session_id,
                reason="User logout"
            )
            
            # Clear user cache to prevent showing previous user's data
            # when a different user logs in on the same device
            if user_id:
                cache_service.invalidate_user_cache(user_id)
            
            # Log logout event
            await _log_logout_event(user_id, session_id, request)
            
            return {
                "message": "Logged out successfully",
                "session_revoked": True
            }
        except NotFoundError:
            # Session doesn't exist or was already revoked
            # Still clear user cache if we have user_id
            if user_id:
                cache_service.invalidate_user_cache(user_id)
                # Log logout event even if session doesn't exist
                await _log_logout_event(user_id, session_id, request)
            return {
                "message": "Logged out successfully",
                "detail": "Session was already revoked or doesn't exist"
            }
    except Exception as e:
        # Even if something goes wrong, try to clear user cache if we have user_id
        if user_id:
            try:
                cache_service.invalidate_user_cache(user_id)
                # Log logout event
                await _log_logout_event(user_id, session_id, request)
            except Exception:
                pass  # Don't fail if cache clearing fails
        # The client-side logout (clearing tokens) is what matters most
        return {
            "message": "Logged out successfully",
            "detail": "Client tokens cleared"
        }


@router.get("/userinfo", response_model=UserResponse)
async def get_user_info(
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """OpenID Connect UserInfo endpoint
    
    Returns information about the authenticated user.
    Requires valid access token in Authorization header.
    
    This endpoint follows OpenID Connect standards.
    """
    return UserResponse(
        sub=current_user.id,
        username=current_user.username,
        first_name=current_user.first_name.value,
        last_name=current_user.last_name.value,
        email=current_user.email.value,
        email_verified=current_user.is_verified,
        role=current_user.role.value,
        is_active=current_user.is_active,
        created_at=current_user.created_at.isoformat()
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: AuthenticatedUser = Depends(get_current_active_user)
):
    """Get current user information
    
    Returns detailed information about the currently authenticated user.
    Alias for /userinfo endpoint.
    """
    return UserResponse(
        sub=current_user.id,
        username=current_user.username,
        first_name=current_user.first_name.value,
        last_name=current_user.last_name.value,
        email=current_user.email.value,
        email_verified=current_user.is_verified,
        role=current_user.role.value,
        is_active=current_user.is_active,
        created_at=current_user.created_at.isoformat()
    )


@router.post("/change-password")
async def change_password(
    http_request: Request,
    request: ChangePasswordRequest,
    current_user: AuthenticatedUser = Depends(get_current_user_bypass_password_check),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Change user password
    
    Change the password for the currently authenticated user.
    Requires current password for verification.
    
    NOTE: This endpoint bypasses the must_change_password check to allow
    users who are required to change their password to do so.
    """
    try:
        # Verify current password
        user = await auth_service._auth_repository.get_by_id(current_user.id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Verify current password is correct
        if not auth_service._password_hasher.verify(request.current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Update password
        new_hashed = auth_service._password_hasher.hash(request.new_password)
        user.update_password(new_hashed)
        await auth_service._auth_repository.save(user)
        
        # Log password change event
        await _log_password_change_event(user, http_request)
        
        return {
            "message": "Password changed successfully",
            "must_change_password": False
        }
    except HTTPException:
        raise
    except Exception as e:
        raise handle_auth_exception(e, "Password change failed")


@router.get("/.well-known/openid-configuration", response_model=Dict[str, Any])
async def openid_configuration():
    """OpenID Connect Discovery endpoint
    
    Returns OpenID Connect configuration metadata.
    Used by OAuth2/OIDC clients for automatic configuration.
    
    Standard endpoint as per OpenID Connect Discovery 1.0 specification.
    """
    return OPENID_CONFIGURATION


@router.get("/health")
async def auth_health_check():
    """Authentication service health check"""
    return {
        "status": "healthy",
        "service": "authentication",
        "features": [
            "OAuth2 Password Flow",
            "OpenID Connect",
            "JWT Tokens",
            "RBAC",
            "Permission-based Access Control"
        ]
    }

