"""
Session mapper - handles conversion between domain entities and database models
"""
from typing import Optional
from app.domain.core.session.entity import Session
from app.domain.shared.value_objects.device_info import DeviceInfo, DeviceType
from app.domain.shared.value_objects.session_status import SessionStatus
from app.infrastructure.shared.database.platform_models import SessionModel
from app.infrastructure.shared.mapper import BaseMapper


class SessionMapper(BaseMapper[Session, SessionModel]):
    """Mapper for Session entity to SessionModel conversion"""
    
    def to_domain(self, model: SessionModel) -> Optional[Session]:
        """Convert database model to domain entity
        
        Args:
            model: SessionModel from database
            
        Returns:
            Session domain entity
        """
        if not model:
            return None
            
        device_info = DeviceInfo(
            device_type=DeviceType(model.device_type),
            user_agent=model.user_agent,
            ip_address=model.ip_address,
            device_name=model.device_name,
            os=model.os,
            browser=model.browser
        )
        
        return Session(
            id=model.id,
            user_id=model.user_id,
            tenant_id=model.tenant_id,
            device_info=device_info,
            status=SessionStatus(model.status),
            created_at=model.created_at,
            expires_at=model.expires_at,
            last_activity_at=model.last_activity_at,
            revoked_at=model.revoked_at,
            revoked_by=model.revoked_by,
            revocation_reason=model.revocation_reason
        )
    
    def to_model(self, session: Session) -> Optional[SessionModel]:
        """Convert domain entity to database model
        
        Args:
            session: Session domain entity
            
        Returns:
            SessionModel for database persistence
        """
        if not session:
            return None
        return SessionModel(
            id=session.id,
            user_id=session.user_id,
            tenant_id=session.tenant_id,
            status=session.status.value,
            device_type=session.device_info.device_type.value,
            user_agent=session.device_info.user_agent,
            ip_address=session.device_info.ip_address,
            device_name=session.device_info.device_name,
            os=session.device_info.os,
            browser=session.device_info.browser,
            created_at=session.created_at,
            expires_at=session.expires_at,
            last_activity_at=session.last_activity_at,
            revoked_at=session.revoked_at,
            revoked_by=session.revoked_by,
            revocation_reason=session.revocation_reason
        )

