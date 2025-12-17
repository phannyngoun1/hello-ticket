"""
Session command and query handlers - CQRS pattern
"""
from typing import Optional, List, Dict, Any
from .commands import (
    CreateSessionCommand,
    RevokeSessionCommand,
    ForceLogoutSessionCommand,
    RevokeAllUserSessionsCommand,
    UpdateSessionActivityCommand,
    CleanupExpiredSessionsCommand
)
from .queries import (
    GetSessionQuery,
    GetUserSessionsQuery,
    GetSessionInfoQuery,
    ValidateSessionQuery,
    GetSessionsByDeviceTypeQuery,
    GetSessionsByIPQuery,
    CountActiveSessionsQuery
)
from .services import SessionService
from app.application.shared.base import ICommandHandler, IQueryHandler
from app.domain.core.session.entity import Session


class CreateSessionCommandHandler(ICommandHandler[CreateSessionCommand, Dict[str, Any]]):
    """Handler for CreateSessionCommand"""
    
    def __init__(self, session_service: SessionService):
        self._session_service = session_service
    
    async def handle(self, command: CreateSessionCommand) -> Dict[str, Any]:
        """Create a new session
        
        Args:
            command: CreateSessionCommand
            
        Returns:
            Dictionary with session information
        """
        session = await self._session_service.create_session(
            user_id=command.user_id,
            tenant_id=command.tenant_id,
            device_info=command.device_info
        )
        
        return await self._session_service.get_session_info(session.id)
    
    @classmethod
    def command_type(cls) -> type:
        """Return the command type this handler processes"""
        return CreateSessionCommand


class RevokeSessionCommandHandler(ICommandHandler[RevokeSessionCommand, bool]):
    """Handler for RevokeSessionCommand"""
    
    def __init__(self, session_service: SessionService):
        self._session_service = session_service
    
    async def handle(self, command: RevokeSessionCommand) -> bool:
        """Revoke a session
        
        Args:
            command: RevokeSessionCommand
            
        Returns:
            True if revoked successfully
        """
        return await self._session_service.revoke_session(
            session_id=command.session_id,
            reason=command.reason,
            revoked_by=command.revoked_by
        )
    
    @classmethod
    def command_type(cls) -> type:
        """Return the command type this handler processes"""
        return RevokeSessionCommand


class ForceLogoutSessionCommandHandler(ICommandHandler[ForceLogoutSessionCommand, bool]):
    """Handler for ForceLogoutSessionCommand"""
    
    def __init__(self, session_service: SessionService):
        self._session_service = session_service
    
    async def handle(self, command: ForceLogoutSessionCommand) -> bool:
        """Force logout a session
        
        Args:
            command: ForceLogoutSessionCommand
            
        Returns:
            True if force logged out successfully
        """
        return await self._session_service.force_logout_session(
            session_id=command.session_id,
            revoked_by=command.revoked_by,
            reason=command.reason
        )
    
    @classmethod
    def command_type(cls) -> type:
        """Return the command type this handler processes"""
        return ForceLogoutSessionCommand


class RevokeAllUserSessionsCommandHandler(ICommandHandler[RevokeAllUserSessionsCommand, int]):
    """Handler for RevokeAllUserSessionsCommand"""
    
    def __init__(self, session_service: SessionService):
        self._session_service = session_service
    
    async def handle(self, command: RevokeAllUserSessionsCommand) -> int:
        """Revoke all user sessions
        
        Args:
            command: RevokeAllUserSessionsCommand
            
        Returns:
            Number of sessions revoked
        """
        return await self._session_service.revoke_all_user_sessions(
            user_id=command.user_id,
            tenant_id=command.tenant_id,
            except_session_id=command.except_session_id,
            reason=command.reason
        )
    
    @classmethod
    def command_type(cls) -> type:
        """Return the command type this handler processes"""
        return RevokeAllUserSessionsCommand


class UpdateSessionActivityCommandHandler(ICommandHandler[UpdateSessionActivityCommand, None]):
    """Handler for UpdateSessionActivityCommand"""
    
    def __init__(self, session_service: SessionService):
        self._session_service = session_service
    
    async def handle(self, command: UpdateSessionActivityCommand) -> None:
        """Update session activity
        
        Args:
            command: UpdateSessionActivityCommand
        """
        await self._session_service.update_session_activity(command.session_id)
    
    @classmethod
    def command_type(cls) -> type:
        """Return the command type this handler processes"""
        return UpdateSessionActivityCommand


class CleanupExpiredSessionsCommandHandler(ICommandHandler[CleanupExpiredSessionsCommand, int]):
    """Handler for CleanupExpiredSessionsCommand"""
    
    def __init__(self, session_service: SessionService):
        self._session_service = session_service
    
    async def handle(self, command: CleanupExpiredSessionsCommand) -> int:
        """Clean up expired sessions
        
        Args:
            command: CleanupExpiredSessionsCommand
            
        Returns:
            Number of sessions cleaned up
        """
        return await self._session_service.cleanup_expired_sessions()
    
    @classmethod
    def command_type(cls) -> type:
        """Return the command type this handler processes"""
        return CleanupExpiredSessionsCommand


class GetSessionQueryHandler(IQueryHandler[GetSessionQuery, Optional[Session]]):
    """Handler for GetSessionQuery"""
    
    def __init__(self, session_service: SessionService):
        self._session_service = session_service
    
    async def handle(self, query: GetSessionQuery) -> Optional[Session]:
        """Get session by ID
        
        Args:
            query: GetSessionQuery
            
        Returns:
            Session if found and active, None otherwise
        """
        return await self._session_service.get_session(query.session_id)
    
    @classmethod
    def query_type(cls) -> type:
        """Return the query type this handler processes"""
        return GetSessionQuery


class GetUserSessionsQueryHandler(IQueryHandler[GetUserSessionsQuery, List[Dict[str, Any]]]):
    """Handler for GetUserSessionsQuery"""
    
    def __init__(self, session_service: SessionService):
        self._session_service = session_service
    
    async def handle(self, query: GetUserSessionsQuery) -> List[Dict[str, Any]]:
        """Get all sessions for a user
        
        Args:
            query: GetUserSessionsQuery
            
        Returns:
            List of session information dictionaries
        """
        sessions = await self._session_service.get_user_sessions(
            user_id=query.user_id,
            tenant_id=query.tenant_id,
            active_only=query.active_only
        )
        
        # Convert sessions to dictionaries
        result = []
        for session in sessions:
            result.append({
                "id": session.id,
                "device": {
                    "type": session.device_info.device_type.value,
                    "name": session.device_info.device_name,
                    "os": session.device_info.os,
                    "browser": session.device_info.browser,
                    "ip_address": session.device_info.ip_address
                },
                "status": session.status.value,
                "created_at": session.created_at.isoformat(),
                "last_activity_at": session.last_activity_at.isoformat(),
                "expires_at": session.expires_at.isoformat(),
                "is_active": session.is_active()
            })
        
        return result
    
    @classmethod
    def query_type(cls) -> type:
        """Return the query type this handler processes"""
        return GetUserSessionsQuery


class GetSessionInfoQueryHandler(IQueryHandler[GetSessionInfoQuery, Dict[str, Any]]):
    """Handler for GetSessionInfoQuery"""
    
    def __init__(self, session_service: SessionService):
        self._session_service = session_service
    
    async def handle(self, query: GetSessionInfoQuery) -> Dict[str, Any]:
        """Get detailed session information
        
        Args:
            query: GetSessionInfoQuery
            
        Returns:
            Dictionary with session details
        """
        return await self._session_service.get_session_info(query.session_id)
    
    @classmethod
    def query_type(cls) -> type:
        """Return the query type this handler processes"""
        return GetSessionInfoQuery


class ValidateSessionQueryHandler(IQueryHandler[ValidateSessionQuery, bool]):
    """Handler for ValidateSessionQuery"""
    
    def __init__(self, session_service: SessionService):
        self._session_service = session_service
    
    async def handle(self, query: ValidateSessionQuery) -> bool:
        """Validate if session is active
        
        Args:
            query: ValidateSessionQuery
            
        Returns:
            True if session is valid and active
        """
        return await self._session_service.validate_session(query.session_id)
    
    @classmethod
    def query_type(cls) -> type:
        """Return the query type this handler processes"""
        return ValidateSessionQuery


class GetSessionsByDeviceTypeQueryHandler(IQueryHandler[GetSessionsByDeviceTypeQuery, List[Dict[str, Any]]]):
    """Handler for GetSessionsByDeviceTypeQuery"""
    
    def __init__(self, session_service: SessionService):
        self._session_service = session_service
    
    async def handle(self, query: GetSessionsByDeviceTypeQuery) -> List[Dict[str, Any]]:
        """Get sessions by device type
        
        Args:
            query: GetSessionsByDeviceTypeQuery
            
        Returns:
            List of session information dictionaries
        """
        sessions = await self._session_service.get_user_sessions(
            user_id=query.user_id,
            tenant_id=query.tenant_id,
            active_only=True
        )
        
        # Filter by device type
        filtered_sessions = [
            s for s in sessions 
            if s.device_info.device_type.value == query.device_type
        ]
        
        return [
            {
                "id": s.id,
                "device": {
                    "type": s.device_info.device_type.value,
                    "name": s.device_info.device_name,
                    "os": s.device_info.os,
                    "browser": s.device_info.browser,
                    "ip_address": s.device_info.ip_address
                },
                "created_at": s.created_at.isoformat(),
                "last_activity_at": s.last_activity_at.isoformat()
            }
            for s in filtered_sessions
        ]
    
    @classmethod
    def query_type(cls) -> type:
        """Return the query type this handler processes"""
        return GetSessionsByDeviceTypeQuery


class GetSessionsByIPQueryHandler(IQueryHandler[GetSessionsByIPQuery, List[Dict[str, Any]]]):
    """Handler for GetSessionsByIPQuery"""
    
    def __init__(self, session_service: SessionService):
        self._session_service = session_service
    
    async def handle(self, query: GetSessionsByIPQuery) -> List[Dict[str, Any]]:
        """Get sessions by IP address
        
        Args:
            query: GetSessionsByIPQuery
            
        Returns:
            List of session information dictionaries
        """
        sessions = await self._session_service.get_user_sessions(
            user_id=query.user_id,
            tenant_id=query.tenant_id,
            active_only=False
        )
        
        # Filter by IP address
        filtered_sessions = [
            s for s in sessions 
            if s.device_info.ip_address == query.ip_address
        ]
        
        return [
            {
                "id": s.id,
                "device": {
                    "type": s.device_info.device_type.value,
                    "name": s.device_info.device_name,
                    "ip_address": s.device_info.ip_address
                },
                "status": s.status.value,
                "created_at": s.created_at.isoformat()
            }
            for s in filtered_sessions
        ]
    
    @classmethod
    def query_type(cls) -> type:
        """Return the query type this handler processes"""
        return GetSessionsByIPQuery


class CountActiveSessionsQueryHandler(IQueryHandler[CountActiveSessionsQuery, int]):
    """Handler for CountActiveSessionsQuery"""
    
    def __init__(self, session_service: SessionService):
        self._session_service = session_service
    
    async def handle(self, query: CountActiveSessionsQuery) -> int:
        """Count active sessions for a user
        
        Args:
            query: CountActiveSessionsQuery
            
        Returns:
            Number of active sessions
        """
        sessions = await self._session_service.get_user_sessions(
            user_id=query.user_id,
            tenant_id=query.tenant_id,
            active_only=True
        )
        return len(sessions)
    
    @classmethod
    def query_type(cls) -> type:
        """Return the query type this handler processes"""
        return CountActiveSessionsQuery

