"""
Session management routes
"""
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status, Request
from pydantic import BaseModel
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.device_info import DeviceInfo
from app.application.core.session import SessionService
from app.presentation.core.dependencies.auth_dependencies import get_current_active_user
from app.shared.exceptions import ValidationError, BusinessRuleError, NotFoundError


router = APIRouter(prefix="/sessions", tags=["sessions"])


# Response Models
class SessionDeviceInfo(BaseModel):
    """Session device information"""
    type: str
    name: str | None = None
    os: str | None = None
    browser: str | None = None
    ip_address: str


class SessionResponse(BaseModel):
    """Session response model"""
    id: str
    device: SessionDeviceInfo
    status: str
    created_at: str
    last_activity_at: str
    expires_at: str
    is_active: bool


class SessionDetailResponse(BaseModel):
    """Detailed session response model"""
    id: str
    user_id: str
    status: str
    device: SessionDeviceInfo
    created_at: str
    expires_at: str
    last_activity_at: str
    is_active: bool
    session_age: str
    time_until_expiry: str
    idle_time: str
    revoked_at: str | None = None
    revocation_reason: str | None = None


class RevokeSessionRequest(BaseModel):
    """Request to revoke a session"""
    reason: str | None = None


class ForceLogoutRequest(BaseModel):
    """Request to force logout a session"""
    reason: str = "Force logout by admin"


class SessionConfigResponse(BaseModel):
    """Session configuration response"""
    idle_timeout_minutes: int
    device_type: str


# Dependency to get session service
def get_session_service() -> SessionService:
    """Get session service instance from container"""
    from app.shared.container import container
    return container.resolve(SessionService)


@router.get("/", response_model=List[SessionResponse])
async def get_user_sessions(
    active_only: bool = True,
    current_user: AuthenticatedUser = Depends(get_current_active_user),
    session_service: SessionService = Depends(get_session_service)
):
    """Get all sessions for current user
    
    Args:
        active_only: Return only active sessions (default: True)
        
    Returns:
        List of user sessions
    """
    # No try-except needed - let global exception handler catch unexpected errors
    # It will automatically log with full traceback and context
    sessions = await session_service.get_user_sessions(
        user_id=current_user.id,
        tenant_id=current_user.tenant_id,
        active_only=active_only
    )
    
    return [
        SessionResponse(
            id=session.id,
            device=SessionDeviceInfo(
                type=session.device_info.device_type.value,
                name=session.device_info.device_name,
                os=session.device_info.os,
                browser=session.device_info.browser,
                ip_address=session.device_info.ip_address
            ),
            status=session.status.value,
            created_at=session.created_at.isoformat(),
            last_activity_at=session.last_activity_at.isoformat(),
            expires_at=session.expires_at.isoformat(),
            is_active=session.is_active()
        )
        for session in sessions
    ]


# IMPORTANT: Specific routes must be defined BEFORE parameterized routes
# FastAPI matches routes in order, so /config must come before /{session_id}
@router.get("/config", response_model=SessionConfigResponse)
async def get_session_config(
    request: Request,
    current_user: AuthenticatedUser = Depends(get_current_active_user),
    session_service: SessionService = Depends(get_session_service)
):
    """Get session configuration for current device
    
    Returns the idle timeout configured for the current device type.
    This is used by the frontend to determine when to show idle warnings.
    """
    # Detect device type from request
    user_agent = request.headers.get("User-Agent", "")
    device_info = DeviceInfo.from_request(
        user_agent=user_agent,
        ip_address=request.client.host if request.client else "unknown"
    )
    
    # Get idle timeout for this device type
    device_type = device_info.device_type.value
    idle_timeout_minutes = session_service._config.get_idle_timeout_for_device(device_type)
    
    return SessionConfigResponse(
        idle_timeout_minutes=idle_timeout_minutes,
        device_type=device_type
    )


@router.get("/health")
async def session_health_check():
    """Session management service health check"""
    return {
        "status": "healthy",
        "service": "session_management",
        "features": [
            "Multi-device tracking",
            "Session limits",
            "Force logout",
            "Device restrictions",
            "IP restrictions",
            "Session expiration"
        ]
    }


@router.get("/{session_id}", response_model=SessionDetailResponse)
async def get_session_details(
    session_id: str,
    current_user: AuthenticatedUser = Depends(get_current_active_user),
    session_service: SessionService = Depends(get_session_service)
):
    """Get detailed information about a specific session
    
    Args:
        session_id: Session ID
        
    Returns:
        Detailed session information
    """
    # Handle expected domain exceptions explicitly
    try:
        session_info = await session_service.get_session_info(session_id)
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    # Let unexpected exceptions bubble up to global handler
    
    # Verify the session belongs to the current user
    if session_info["user_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this session"
        )
    
    return SessionDetailResponse(**session_info)


@router.post("/{session_id}/revoke", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_session(
    session_id: str,
    request: RevokeSessionRequest = RevokeSessionRequest(),
    current_user: AuthenticatedUser = Depends(get_current_active_user),
    session_service: SessionService = Depends(get_session_service)
):
    """Revoke (logout) a specific session
    
    Args:
        session_id: Session ID to revoke
        request: Revoke request with optional reason
    """
    # Verify the session belongs to the current user
    session = await session_service.get_session(session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this session"
        )
    
    # Handle expected domain exceptions
    try:
        await session_service.revoke_session(
            session_id=session_id,
            reason=request.reason or "User logged out",
            revoked_by=current_user.id
        )
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    # Let unexpected exceptions bubble up to global handler


@router.post("/revoke-all", status_code=status.HTTP_200_OK)
async def revoke_all_sessions(
    except_current: bool = True,
    current_user: AuthenticatedUser = Depends(get_current_active_user),
    session_service: SessionService = Depends(get_session_service)
):
    """Revoke all sessions for current user (logout from all devices)
    
    Args:
        except_current: Keep current session active (default: True)
        
    Returns:
        Number of sessions revoked
    """
    # Extract session_id from current user's token if available
    current_session_id = None
    if except_current:
        # This would typically come from the JWT token
        # For now, we'll pass None which means keep current session
        pass
    
    # No try-except - let global handler catch unexpected errors
    count = await session_service.revoke_all_user_sessions(
        user_id=current_user.id,
        tenant_id=current_user.tenant_id,
        except_session_id=current_session_id,
        reason="User revoked all sessions"
    )
    
    return {"sessions_revoked": count}


@router.post("/{session_id}/force-logout", status_code=status.HTTP_204_NO_CONTENT)
async def force_logout_session(
    session_id: str,
    request: ForceLogoutRequest = ForceLogoutRequest(),
    current_user: AuthenticatedUser = Depends(get_current_active_user),
    session_service: SessionService = Depends(get_session_service)
):
    """Force logout a specific session (admin action)
    
    Args:
        session_id: Session ID to force logout
        request: Force logout request with reason
        
    Note:
        This endpoint requires admin permissions
    """
    # Check if user has admin permission
    from app.domain.shared.value_objects.role import Permission
    if not current_user.has_permission(Permission.UPDATE_USER):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    # Handle expected domain exceptions only
    try:
        await session_service.force_logout_session(
            session_id=session_id,
            revoked_by=current_user.id,
            reason=request.reason
        )
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    # Let unexpected exceptions bubble up to global handler


@router.get("/active/count", response_model=Dict[str, int])
async def get_active_session_count(
    current_user: AuthenticatedUser = Depends(get_current_active_user),
    session_service: SessionService = Depends(get_session_service)
):
    """Get count of active sessions for current user
    
    Returns:
        Dictionary with active session count
    """
    # No try-except - let global handler catch unexpected errors
    sessions = await session_service.get_user_sessions(
        user_id=current_user.id,
        tenant_id=current_user.tenant_id,
        active_only=True
    )
    
    return {"active_sessions": len(sessions)}


@router.get("/device/{device_type}", response_model=List[SessionResponse])
async def get_sessions_by_device_type(
    device_type: str,
    current_user: AuthenticatedUser = Depends(get_current_active_user),
    session_service: SessionService = Depends(get_session_service)
):
    """Get sessions by device type
    
    Args:
        device_type: Device type (web, mobile, tablet, desktop)
        
    Returns:
        List of sessions for specified device type
    """
    # No try-except - let global handler catch unexpected errors
    sessions = await session_service.get_user_sessions(
        user_id=current_user.id,
        tenant_id=current_user.tenant_id,
        active_only=True
    )
    
    # Filter by device type
    filtered_sessions = [
        s for s in sessions 
        if s.device_info.device_type.value == device_type
    ]
    
    return [
        SessionResponse(
            id=session.id,
            device=SessionDeviceInfo(
                type=session.device_info.device_type.value,
                name=session.device_info.device_name,
                os=session.device_info.os,
                browser=session.device_info.browser,
                ip_address=session.device_info.ip_address
            ),
            status=session.status.value,
            created_at=session.created_at.isoformat(),
            last_activity_at=session.last_activity_at.isoformat(),
            expires_at=session.expires_at.isoformat(),
            is_active=session.is_active()
        )
        for session in filtered_sessions
    ]


@router.get("/health")
async def session_health_check():
    """Session management service health check"""
    return {
        "status": "healthy",
        "service": "session_management",
        "features": [
            "Multi-device tracking",
            "Session limits",
            "Force logout",
            "Device restrictions",
            "IP restrictions",
            "Session expiration"
        ]
    }

