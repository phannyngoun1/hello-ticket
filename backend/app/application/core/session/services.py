"""
Session service - Application layer for session management
"""
import os
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
from app.domain.core.session.entity import Session
from app.domain.core.session.repository import SessionRepository
from app.domain.shared.value_objects.device_info import DeviceInfo
from app.domain.shared.value_objects.session_status import SessionStatus
from app.shared.exceptions import ValidationError, BusinessRuleError, NotFoundError


class SessionConfig:
    """Session configuration"""
    
    def __init__(self):
        # Maximum concurrent sessions per user (0 = unlimited)
        self.max_sessions_per_user = int(os.getenv("MAX_SESSIONS_PER_USER", "5"))
        
        # Session expiration in days
        self.session_expiration_days = int(os.getenv("SESSION_EXPIRATION_DAYS", "7"))
        
        # Idle timeout in minutes (0 = disabled)
        # Default for web/desktop
        self.idle_timeout_minutes = int(os.getenv("IDLE_TIMEOUT_MINUTES", "30"))
        
        # Device-specific idle timeouts (override default)
        self.idle_timeout_web = int(os.getenv("IDLE_TIMEOUT_WEB", str(self.idle_timeout_minutes)))
        self.idle_timeout_mobile = int(os.getenv("IDLE_TIMEOUT_MOBILE", "0"))  # 0 = disabled for mobile
        self.idle_timeout_tablet = int(os.getenv("IDLE_TIMEOUT_TABLET", "0"))  # 0 = disabled for tablet
        self.idle_timeout_desktop = int(os.getenv("IDLE_TIMEOUT_DESKTOP", str(self.idle_timeout_minutes)))
        
        # Device restrictions (comma-separated device types to allow)
        # Example: "web,mobile" or empty for all devices
        allowed_devices = os.getenv("ALLOWED_DEVICE_TYPES", "")
        self.allowed_device_types = [d.strip() for d in allowed_devices.split(",") if d.strip()]
        
        # IP whitelist (comma-separated IPs)
        whitelist = os.getenv("IP_WHITELIST", "")
        self.ip_whitelist = [ip.strip() for ip in whitelist.split(",") if ip.strip()]
        
        # IP blacklist (comma-separated IPs)
        blacklist = os.getenv("IP_BLACKLIST", "")
        self.ip_blacklist = [ip.strip() for ip in blacklist.split(",") if ip.strip()]
        
        # Whether to enforce device restrictions
        self.enforce_device_restrictions = os.getenv("ENFORCE_DEVICE_RESTRICTIONS", "false").lower() == "true"
        
        # Whether to enforce IP restrictions
        self.enforce_ip_restrictions = os.getenv("ENFORCE_IP_RESTRICTIONS", "false").lower() == "true"
    
    def get_idle_timeout_for_device(self, device_type: str) -> int:
        """Get idle timeout in minutes for specific device type
        
        Args:
            device_type: Device type (web, mobile, tablet, desktop)
            
        Returns:
            Idle timeout in minutes (0 = disabled)
        """
        device_type_lower = device_type.lower()
        
        if device_type_lower == "web":
            return self.idle_timeout_web
        elif device_type_lower == "mobile":
            return self.idle_timeout_mobile
        elif device_type_lower == "tablet":
            return self.idle_timeout_tablet
        elif device_type_lower == "desktop":
            return self.idle_timeout_desktop
        else:
            # Unknown device type, use default
            return self.idle_timeout_minutes


class SessionService:
    """Service for managing user sessions"""
    
    def __init__(
        self,
        session_repository: SessionRepository,
        config: Optional[SessionConfig] = None
    ):
        self._session_repository = session_repository
        self._config = config or SessionConfig()
    
    async def create_session(
        self,
        user_id: str,
        tenant_id: str,
        device_info: DeviceInfo
    ) -> Session:
        """Create a new session for user
        
        Args:
            user_id: User ID
            tenant_id: Tenant ID
            device_info: Device information
            
        Returns:
            Created session
            
        Raises:
            BusinessRuleError: If session limits exceeded or device/IP restricted
        """
        # Check device restrictions
        if self._config.enforce_device_restrictions:
            if self._config.allowed_device_types:
                if device_info.device_type.value not in self._config.allowed_device_types:
                    raise BusinessRuleError(
                        f"Device type '{device_info.device_type.value}' is not allowed"
                    )
        
        # Check IP restrictions
        if self._config.enforce_ip_restrictions:
            if self._config.ip_blacklist and device_info.ip_address in self._config.ip_blacklist:
                raise BusinessRuleError(f"IP address {device_info.ip_address} is blacklisted")
            
            if self._config.ip_whitelist:
                if device_info.ip_address not in self._config.ip_whitelist:
                    raise BusinessRuleError(
                        f"IP address {device_info.ip_address} is not whitelisted"
                    )
        
        # Check session limits
        if self._config.max_sessions_per_user > 0:
            active_count = await self._session_repository.count_active_sessions_by_user(
                user_id=user_id,
                tenant_id=tenant_id
            )
            
            if active_count >= self._config.max_sessions_per_user:
                # Revoke oldest session to make room
                await self._revoke_oldest_session(user_id, tenant_id)
        
        # Create session
        expires_at = datetime.now(timezone.utc) + timedelta(days=self._config.session_expiration_days)
        
        session = Session(
            user_id=user_id,
            tenant_id=tenant_id,
            device_info=device_info,
            expires_at=expires_at
        )
        
        return await self._session_repository.save(session)
    
    async def get_session(self, session_id: str) -> Optional[Session]:
        """Get session by ID
        
        Args:
            session_id: Session ID
            
        Returns:
            Session if found and active, None otherwise
        """
        session = await self._session_repository.get_by_id(session_id)
        
        if not session:
            return None
        
        # Check if expired
        if session.is_expired():
            session.mark_as_expired()
            await self._session_repository.save(session)
            return None
        
        # Check idle timeout based on device type
        device_type = session.device_info.device_type.value
        idle_timeout_minutes = self._config.get_idle_timeout_for_device(device_type)
        
        if idle_timeout_minutes > 0:
            idle_time = session.get_idle_time()
            if idle_time.total_seconds() > idle_timeout_minutes * 60:
                session.revoke(reason=f"Idle timeout exceeded ({device_type})")
                await self._session_repository.save(session)
                return None
        
        return session
    
    async def validate_session(self, session_id: str) -> bool:
        """Validate if session is active
        
        Args:
            session_id: Session ID
            
        Returns:
            True if session is valid and active
        """
        session = await self.get_session(session_id)
        return session is not None and session.is_active()
    
    async def update_session_activity(self, session_id: str) -> None:
        """Update session last activity timestamp
        
        Args:
            session_id: Session ID
        """
        session = await self._session_repository.get_by_id(session_id)
        if session and session.is_active():
            session.update_activity()
            await self._session_repository.save(session)
    
    async def get_user_sessions(
        self,
        user_id: str,
        tenant_id: str,
        active_only: bool = True
    ) -> List[Session]:
        """Get user sessions
        
        Args:
            user_id: User ID
            tenant_id: Tenant ID
            active_only: Return only active sessions
            
        Returns:
            List of sessions
        """
        if active_only:
            return await self._session_repository.get_active_sessions_by_user(
                user_id=user_id,
                tenant_id=tenant_id
            )
        else:
            return await self._session_repository.get_all_sessions_by_user(
                user_id=user_id,
                tenant_id=tenant_id
            )
    
    async def revoke_session(
        self,
        session_id: str,
        reason: Optional[str] = None,
        revoked_by: Optional[str] = None
    ) -> bool:
        """Revoke a specific session (logout)
        
        Args:
            session_id: Session ID
            reason: Reason for revocation
            revoked_by: User ID who revoked (for admin actions)
            
        Returns:
            True if revoked successfully
            
        Raises:
            NotFoundError: If session not found
        """
        session = await self._session_repository.get_by_id(session_id)
        
        if not session:
            raise NotFoundError(f"Session {session_id} not found")
        
        session.revoke(reason=reason, revoked_by=revoked_by)
        await self._session_repository.save(session)
        return True
    
    async def force_logout_session(
        self,
        session_id: str,
        revoked_by: str,
        reason: str = "Force logout by admin"
    ) -> bool:
        """Force logout a specific session
        
        Args:
            session_id: Session ID
            revoked_by: User ID who forced the logout
            reason: Reason for force logout
            
        Returns:
            True if force logged out successfully
            
        Raises:
            NotFoundError: If session not found
        """
        session = await self._session_repository.get_by_id(session_id)
        
        if not session:
            raise NotFoundError(f"Session {session_id} not found")
        
        session.force_logout(revoked_by=revoked_by, reason=reason)
        await self._session_repository.save(session)
        return True
    
    async def revoke_all_user_sessions(
        self,
        user_id: str,
        tenant_id: str,
        except_session_id: Optional[str] = None,
        reason: str = "All sessions revoked"
    ) -> int:
        """Revoke all sessions for a user (logout from all devices)
        
        Args:
            user_id: User ID
            tenant_id: Tenant ID
            except_session_id: Optional session ID to keep active (current session)
            reason: Reason for revocation
            
        Returns:
            Number of sessions revoked
        """
        return await self._session_repository.revoke_all_user_sessions(
            user_id=user_id,
            tenant_id=tenant_id,
            except_session_id=except_session_id
        )
    
    async def get_session_info(self, session_id: str) -> Dict[str, Any]:
        """Get detailed session information
        
        Args:
            session_id: Session ID
            
        Returns:
            Dictionary with session details
            
        Raises:
            NotFoundError: If session not found
        """
        session = await self._session_repository.get_by_id(session_id)
        
        if not session:
            raise NotFoundError(f"Session {session_id} not found")
        
        return {
            "id": session.id,
            "user_id": session.user_id,
            "status": session.status.value,
            "device": {
                "type": session.device_info.device_type.value,
                "name": session.device_info.device_name,
                "os": session.device_info.os,
                "browser": session.device_info.browser,
                "ip_address": session.device_info.ip_address
            },
            "created_at": session.created_at.isoformat(),
            "expires_at": session.expires_at.isoformat(),
            "last_activity_at": session.last_activity_at.isoformat(),
            "is_active": session.is_active(),
            "session_age": str(session.get_session_age()),
            "time_until_expiry": str(session.get_time_until_expiry()),
            "idle_time": str(session.get_idle_time()),
            "revoked_at": session.revoked_at.isoformat() if session.revoked_at else None,
            "revocation_reason": session.revocation_reason
        }
    
    async def cleanup_expired_sessions(self) -> int:
        """Clean up expired sessions
        
        Returns:
            Number of sessions cleaned up
        """
        return await self._session_repository.cleanup_expired_sessions()
    
    async def _revoke_oldest_session(self, user_id: str, tenant_id: str) -> None:
        """Revoke the oldest active session for a user
        
        Args:
            user_id: User ID
            tenant_id: Tenant ID
        """
        sessions = await self._session_repository.get_active_sessions_by_user(
            user_id=user_id,
            tenant_id=tenant_id
        )
        
        if sessions:
            # Sort by last activity (oldest first)
            oldest_session = min(sessions, key=lambda s: s.last_activity_at)
            oldest_session.mark_max_sessions_exceeded()
            await self._session_repository.save(oldest_session)

