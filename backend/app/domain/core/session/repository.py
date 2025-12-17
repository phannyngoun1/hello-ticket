"""
Session repository interface
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import datetime
from app.domain.core.session.entity import Session
from app.domain.shared.value_objects.session_status import SessionStatus


class SessionRepository(ABC):
    """Repository interface for session management"""
    
    @abstractmethod
    async def save(self, session: Session) -> Session:
        """Save or update session
        
        Args:
            session: Session entity to save
            
        Returns:
            Saved session
        """
        pass
    
    @abstractmethod
    async def get_by_id(self, session_id: str) -> Optional[Session]:
        """Get session by ID
        
        Args:
            session_id: Session ID
            
        Returns:
            Session if found, None otherwise
        """
        pass
    
    @abstractmethod
    async def get_active_sessions_by_user(
        self,
        user_id: str,
        tenant_id: str
    ) -> List[Session]:
        """Get all active sessions for a user
        
        Args:
            user_id: User ID
            tenant_id: Tenant ID
            
        Returns:
            List of active sessions
        """
        pass
    
    @abstractmethod
    async def get_all_sessions_by_user(
        self,
        user_id: str,
        tenant_id: str
    ) -> List[Session]:
        """Get all sessions (active and inactive) for a user
        
        Args:
            user_id: User ID
            tenant_id: Tenant ID
            
        Returns:
            List of all sessions
        """
        pass
    
    @abstractmethod
    async def count_active_sessions_by_user(
        self,
        user_id: str,
        tenant_id: str
    ) -> int:
        """Count active sessions for a user
        
        Args:
            user_id: User ID
            tenant_id: Tenant ID
            
        Returns:
            Number of active sessions
        """
        pass
    
    @abstractmethod
    async def revoke_session(self, session_id: str) -> bool:
        """Revoke a specific session
        
        Args:
            session_id: Session ID to revoke
            
        Returns:
            True if revoked, False if not found
        """
        pass
    
    @abstractmethod
    async def revoke_all_user_sessions(
        self,
        user_id: str,
        tenant_id: str,
        except_session_id: Optional[str] = None
    ) -> int:
        """Revoke all sessions for a user
        
        Args:
            user_id: User ID
            tenant_id: Tenant ID
            except_session_id: Optional session ID to keep active (current session)
            
        Returns:
            Number of sessions revoked
        """
        pass
    
    @abstractmethod
    async def cleanup_expired_sessions(self, before_date: Optional[datetime] = None) -> int:
        """Clean up expired sessions
        
        Args:
            before_date: Delete sessions expired before this date (default: now)
            
        Returns:
            Number of sessions cleaned up
        """
        pass
    
    @abstractmethod
    async def get_sessions_by_device_type(
        self,
        user_id: str,
        tenant_id: str,
        device_type: str
    ) -> List[Session]:
        """Get sessions by device type
        
        Args:
            user_id: User ID
            tenant_id: Tenant ID
            device_type: Device type (web, mobile, tablet, etc.)
            
        Returns:
            List of sessions for specified device type
        """
        pass
    
    @abstractmethod
    async def get_sessions_by_ip(
        self,
        user_id: str,
        tenant_id: str,
        ip_address: str
    ) -> List[Session]:
        """Get sessions by IP address
        
        Args:
            user_id: User ID
            tenant_id: Tenant ID
            ip_address: IP address
            
        Returns:
            List of sessions from specified IP
        """
        pass
    
    @abstractmethod
    async def delete(self, session_id: str) -> bool:
        """Delete session permanently
        
        Args:
            session_id: Session ID
            
        Returns:
            True if deleted, False if not found
        """
        pass

