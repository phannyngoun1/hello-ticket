"""
Session repository implementation - SQL implementation
"""
from typing import List, Optional
from datetime import datetime, timezone
from sqlmodel import Session as SQLSession, select
from app.domain.core.session.entity import Session
from app.domain.core.session.repository import SessionRepository
from app.domain.shared.value_objects.session_status import SessionStatus
from app.infrastructure.shared.database.platform_models import SessionModel
from app.infrastructure.shared.database.platform_connection import get_platform_session_sync
from app.infrastructure.core.session.mapper import SessionMapper


class SQLSessionRepository(SessionRepository):
    """SQLModel implementation of SessionRepository"""
    
    def __init__(self, session: Optional[SQLSession] = None):
        self._session_factory = session if session else get_platform_session_sync
        self._mapper = SessionMapper()
    
    async def save(self, session: Session) -> Session:
        """Save or update session"""
        with self._session_factory() as db_session:
            existing_model = db_session.get(SessionModel, session.id)
            
            if existing_model:
                # Update existing session
                existing_model.user_id = session.user_id
                existing_model.tenant_id = session.tenant_id
                existing_model.status = session.status.value
                existing_model.device_type = session.device_info.device_type.value
                existing_model.user_agent = session.device_info.user_agent
                existing_model.ip_address = session.device_info.ip_address
                existing_model.device_name = session.device_info.device_name
                existing_model.os = session.device_info.os
                existing_model.browser = session.device_info.browser
                existing_model.expires_at = session.expires_at
                existing_model.last_activity_at = session.last_activity_at
                existing_model.revoked_at = session.revoked_at
                existing_model.revoked_by = session.revoked_by
                existing_model.revocation_reason = session.revocation_reason
                
                db_session.add(existing_model)
                db_session.commit()
                db_session.refresh(existing_model)
                return self._mapper.to_domain(existing_model)
            else:
                # Create new session
                new_model = self._mapper.to_model(session)
                db_session.add(new_model)
                db_session.commit()
                db_session.refresh(new_model)
                return self._mapper.to_domain(new_model)
    
    async def get_by_id(self, session_id: str) -> Optional[Session]:
        """Get session by ID"""
        with self._session_factory() as db_session:
            model = db_session.get(SessionModel, session_id)
            return self._mapper.to_domain(model) if model else None
    
    async def get_active_sessions_by_user(
        self,
        user_id: str,
        tenant_id: str
    ) -> List[Session]:
        """Get all active sessions for a user"""
        with self._session_factory() as db_session:
            statement = select(SessionModel).where(
                SessionModel.user_id == user_id,
                SessionModel.tenant_id == tenant_id,
                SessionModel.status == SessionStatus.ACTIVE.value,
                SessionModel.expires_at > datetime.now(timezone.utc)
            ).order_by(SessionModel.last_activity_at.desc())
            
            models = db_session.exec(statement).all()
            return [self._mapper.to_domain(model) for model in models]
    
    async def get_all_sessions_by_user(
        self,
        user_id: str,
        tenant_id: str
    ) -> List[Session]:
        """Get all sessions (active and inactive) for a user"""
        with self._session_factory() as db_session:
            statement = select(SessionModel).where(
                SessionModel.user_id == user_id,
                SessionModel.tenant_id == tenant_id
            ).order_by(SessionModel.created_at.desc())
            
            models = db_session.exec(statement).all()
            return [self._mapper.to_domain(model) for model in models]
    
    async def count_active_sessions_by_user(
        self,
        user_id: str,
        tenant_id: str
    ) -> int:
        """Count active sessions for a user"""
        with self._session_factory() as db_session:
            statement = select(SessionModel).where(
                SessionModel.user_id == user_id,
                SessionModel.tenant_id == tenant_id,
                SessionModel.status == SessionStatus.ACTIVE.value,
                SessionModel.expires_at > datetime.now(timezone.utc)
            )
            
            models = db_session.exec(statement).all()
            return len(models)
    
    async def revoke_session(self, session_id: str) -> bool:
        """Revoke a specific session"""
        with self._session_factory() as db_session:
            model = db_session.get(SessionModel, session_id)
            if model:
                model.status = SessionStatus.REVOKED.value
                model.revoked_at = datetime.now(timezone.utc)
                db_session.add(model)
                db_session.commit()
                return True
            return False
    
    async def revoke_all_user_sessions(
        self,
        user_id: str,
        tenant_id: str,
        except_session_id: Optional[str] = None
    ) -> int:
        """Revoke all sessions for a user"""
        with self._session_factory() as db_session:
            statement = select(SessionModel).where(
                SessionModel.user_id == user_id,
                SessionModel.tenant_id == tenant_id,
                SessionModel.status == SessionStatus.ACTIVE.value
            )
            
            if except_session_id:
                statement = statement.where(SessionModel.id != except_session_id)
            
            models = db_session.exec(statement).all()
            count = 0
            
            for model in models:
                model.status = SessionStatus.REVOKED.value
                model.revoked_at = datetime.now(timezone.utc)
                model.revocation_reason = "All sessions revoked"
                db_session.add(model)
                count += 1
            
            db_session.commit()
            return count
    
    async def cleanup_expired_sessions(self, before_date: Optional[datetime] = None) -> int:
        """Clean up expired sessions"""
        if before_date is None:
            before_date = datetime.now(timezone.utc)
        
        with self._session_factory() as db_session:
            statement = select(SessionModel).where(
                SessionModel.expires_at < before_date,
                SessionModel.status == SessionStatus.ACTIVE.value
            )
            
            models = db_session.exec(statement).all()
            count = 0
            
            for model in models:
                model.status = SessionStatus.EXPIRED.value
                db_session.add(model)
                count += 1
            
            db_session.commit()
            return count
    
    async def get_sessions_by_device_type(
        self,
        user_id: str,
        tenant_id: str,
        device_type: str
    ) -> List[Session]:
        """Get sessions by device type"""
        with self._session_factory() as db_session:
            statement = select(SessionModel).where(
                SessionModel.user_id == user_id,
                SessionModel.tenant_id == tenant_id,
                SessionModel.device_type == device_type,
                SessionModel.status == SessionStatus.ACTIVE.value
            ).order_by(SessionModel.last_activity_at.desc())
            
            models = db_session.exec(statement).all()
            return [self._mapper.to_domain(model) for model in models]
    
    async def get_sessions_by_ip(
        self,
        user_id: str,
        tenant_id: str,
        ip_address: str
    ) -> List[Session]:
        """Get sessions by IP address"""
        with self._session_factory() as db_session:
            statement = select(SessionModel).where(
                SessionModel.user_id == user_id,
                SessionModel.tenant_id == tenant_id,
                SessionModel.ip_address == ip_address
            ).order_by(SessionModel.created_at.desc())
            
            models = db_session.exec(statement).all()
            return [self._mapper.to_domain(model) for model in models]
    
    async def delete(self, session_id: str) -> bool:
        """Delete session permanently"""
        with self._session_factory() as db_session:
            model = db_session.get(SessionModel, session_id)
            if model:
                db_session.delete(model)
                db_session.commit()
                return True
            return False

