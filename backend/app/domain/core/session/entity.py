"""
Session domain entity for multi-device session management
"""
from datetime import datetime, timezone, timedelta
from typing import Optional
from dataclasses import dataclass, field
from app.domain.shared.value_objects.device_info import DeviceInfo
from app.domain.shared.value_objects.session_status import SessionStatus
from app.shared.utils import generate_id


def ensure_timezone_aware(dt: datetime) -> datetime:
    """Ensure datetime is timezone-aware (UTC)
    
    Args:
        dt: Datetime to check
        
    Returns:
        Timezone-aware datetime in UTC
    """
    if dt.tzinfo is None:
        # Assume UTC if no timezone info
        return dt.replace(tzinfo=timezone.utc)
    return dt


@dataclass
class Session:
    """User session entity for tracking active logins across devices"""
    # Required fields
    user_id: str
    device_info: DeviceInfo
    tenant_id: str
    # Optional fields with defaults
    id: str = field(default_factory=generate_id)
    status: SessionStatus = field(default=SessionStatus.ACTIVE)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(days=7))
    last_activity_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    revoked_at: Optional[datetime] = field(default=None)
    revoked_by: Optional[str] = field(default=None)  # user_id who revoked (for admin force logout)
    revocation_reason: Optional[str] = field(default=None)
    
    def is_active(self) -> bool:
        """Check if session is currently active
        
        Returns:
            True if session is active and not expired
        """
        if self.status != SessionStatus.ACTIVE:
            return False
        
        # Ensure expires_at is timezone-aware for comparison
        expires_at_aware = ensure_timezone_aware(self.expires_at)
        if expires_at_aware < datetime.now(timezone.utc):
            return False
        
        return True
    
    def is_expired(self) -> bool:
        """Check if session has expired
        
        Returns:
            True if session has expired
        """
        expires_at_aware = ensure_timezone_aware(self.expires_at)
        return expires_at_aware < datetime.now(timezone.utc)
    
    def update_activity(self) -> None:
        """Update last activity timestamp"""
        self.last_activity_at = datetime.now(timezone.utc)
    
    def revoke(
        self,
        reason: Optional[str] = None,
        revoked_by: Optional[str] = None
    ) -> None:
        """Revoke this session (logout)
        
        Args:
            reason: Reason for revocation
            revoked_by: User ID who revoked the session (for admin actions)
        """
        self.status = SessionStatus.REVOKED
        self.revoked_at = datetime.now(timezone.utc)
        self.revocation_reason = reason
        self.revoked_by = revoked_by
    
    def force_logout(self, revoked_by: str, reason: str = "Force logout") -> None:
        """Force logout this session
        
        Args:
            revoked_by: User ID who forced the logout
            reason: Reason for force logout
        """
        self.status = SessionStatus.FORCE_LOGOUT
        self.revoked_at = datetime.now(timezone.utc)
        self.revoked_by = revoked_by
        self.revocation_reason = reason
    
    def mark_as_expired(self) -> None:
        """Mark session as expired"""
        self.status = SessionStatus.EXPIRED
    
    def mark_device_restricted(self) -> None:
        """Mark session as terminated due to device restriction"""
        self.status = SessionStatus.DEVICE_RESTRICTED
        self.revoked_at = datetime.now(timezone.utc)
        self.revocation_reason = "Device not allowed"
    
    def mark_max_sessions_exceeded(self) -> None:
        """Mark session as terminated due to max sessions limit"""
        self.status = SessionStatus.MAX_SESSIONS_EXCEEDED
        self.revoked_at = datetime.now(timezone.utc)
        self.revocation_reason = "Maximum concurrent sessions exceeded"
    
    def extend_expiration(self, days: int = 7) -> None:
        """Extend session expiration
        
        Args:
            days: Number of days to extend from now
        """
        self.expires_at = datetime.now(timezone.utc) + timedelta(days=days)
    
    def get_session_age(self) -> timedelta:
        """Get session age
        
        Returns:
            Time since session was created
        """
        created_at_aware = ensure_timezone_aware(self.created_at)
        return datetime.now(timezone.utc) - created_at_aware
    
    def get_time_until_expiry(self) -> timedelta:
        """Get time until session expires
        
        Returns:
            Time remaining until expiration (negative if expired)
        """
        expires_at_aware = ensure_timezone_aware(self.expires_at)
        return expires_at_aware - datetime.now(timezone.utc)
    
    def get_idle_time(self) -> timedelta:
        """Get idle time since last activity
        
        Returns:
            Time since last activity
        """
        last_activity_aware = ensure_timezone_aware(self.last_activity_at)
        return datetime.now(timezone.utc) - last_activity_aware
    
    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Session):
            return False
        return self.id == other.id
    
    def __hash__(self) -> int:
        return hash(self.id)

