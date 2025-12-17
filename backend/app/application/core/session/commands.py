"""
Session commands - CQRS pattern
"""
from dataclasses import dataclass
from typing import Optional
from app.domain.shared.value_objects.device_info import DeviceInfo


@dataclass(frozen=True)
class CreateSessionCommand:
    """Command to create a new session"""
    user_id: str
    tenant_id: str
    device_info: DeviceInfo


@dataclass(frozen=True)
class RevokeSessionCommand:
    """Command to revoke a session (logout)"""
    session_id: str
    reason: Optional[str] = None
    revoked_by: Optional[str] = None


@dataclass(frozen=True)
class ForceLogoutSessionCommand:
    """Command to force logout a session"""
    session_id: str
    revoked_by: str
    reason: str = "Force logout by admin"


@dataclass(frozen=True)
class RevokeAllUserSessionsCommand:
    """Command to revoke all sessions for a user"""
    user_id: str
    tenant_id: str
    except_session_id: Optional[str] = None
    reason: str = "All sessions revoked"


@dataclass(frozen=True)
class UpdateSessionActivityCommand:
    """Command to update session activity timestamp"""
    session_id: str


@dataclass(frozen=True)
class CleanupExpiredSessionsCommand:
    """Command to clean up expired sessions"""
    pass

