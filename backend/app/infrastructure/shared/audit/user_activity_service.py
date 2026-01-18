"""
User Activity Service for efficient user activity log queries

This service provides optimized methods for querying user activity logs
from the unified audit_logs table, with helper methods for common patterns.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_

from app.infrastructure.shared.audit.audit_logger import AuditLogEvent, AuditEventType
from app.infrastructure.shared.audit.async_audit_logger import AsyncAuditLogger
from app.infrastructure.shared.database.models import AuditLogModel
from app.infrastructure.shared.database.connection import get_async_session
from app.shared.tenant_context import get_tenant_context
import logging

logger = logging.getLogger(__name__)


def _apply_sorting(query, sort_by: str, sort_order: str):
    """Apply sorting to a SQLAlchemy query based on sort_by and sort_order parameters"""

    # Define sort field mappings
    sort_fields = {
        "event_timestamp": AuditLogModel.event_timestamp,
        "event_type": AuditLogModel.event_type,
        "severity": AuditLogModel.severity,
        "user_email": AuditLogModel.user_email,
        "description": AuditLogModel.description,
    }

    # Get the sort column
    sort_column = sort_fields.get(sort_by, AuditLogModel.event_timestamp)

    # Apply ordering
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    return query


# Common user activity event types
USER_ACTIVITY_EVENT_TYPES = [
    AuditEventType.LOGIN.value,
    AuditEventType.LOGOUT.value,
    AuditEventType.PASSWORD_CHANGE.value,
    AuditEventType.ACCOUNT_LOCK.value,
    AuditEventType.ACCOUNT_UNLOCK.value,
    AuditEventType.ACCOUNT_ACTIVATE.value,
    AuditEventType.ACCOUNT_DEACTIVATE.value,
    AuditEventType.READ.value,
    AuditEventType.UPDATE.value,
    AuditEventType.CREATE.value,
    AuditEventType.DELETE.value,
]


class UserActivityService:
    """
    Service for querying user activity logs efficiently
    
    Provides optimized methods for common user activity patterns:
    - User activity feed
    - Login/logout history
    - Recent activity
    - Activity by date range
    - Activity by event type
    """
    
    def __init__(self, audit_logger: AsyncAuditLogger):
        self.audit_logger = audit_logger
    
    async def get_user_activity(
        self,
        user_id: str,
        limit: int = 100,
        event_types: Optional[List[str]] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        sort_by: str = "event_timestamp",
        sort_order: str = "desc"
    ) -> List[AuditLogEvent]:
        """
        Get user activity logs with optimized querying
        
        Args:
            user_id: User ID to get activity for
            limit: Maximum number of events to return
            event_types: Filter by specific event types (default: all user activity types)
            start_date: Start date filter
            end_date: End date filter
            
        Returns:
            List of audit events for the user
        """
        try:
            session = await get_async_session()
            
            try:
                # Build optimized query
                query = select(AuditLogModel).where(
                    AuditLogModel.user_id == user_id
                )
                
                # Apply tenant filter
                tenant_id = get_tenant_context()
                if tenant_id:
                    query = query.where(AuditLogModel.tenant_id == tenant_id)
                
                # Filter by event types (default to user activity types)
                if event_types is None:
                    event_types = USER_ACTIVITY_EVENT_TYPES
                
                if event_types:
                    query = query.where(
                        AuditLogModel.event_type.in_(event_types)
                    )
                
                # Apply date filters
                # Ensure datetimes are timezone-aware for comparison with TIMESTAMPTZ column
                if start_date:
                    # Ensure timezone-aware - don't modify original parameter
                    start_date_tz = start_date
                    if start_date_tz.tzinfo is None:
                        start_date_tz = start_date_tz.replace(tzinfo=timezone.utc)
                    query = query.where(AuditLogModel.event_timestamp >= start_date_tz)
                if end_date:
                    # Ensure timezone-aware - don't modify original parameter
                    end_date_tz = end_date
                    if end_date_tz.tzinfo is None:
                        end_date_tz = end_date_tz.replace(tzinfo=timezone.utc)
                    query = query.where(AuditLogModel.event_timestamp <= end_date_tz)
                
                # Apply dynamic sorting
                query = _apply_sorting(query, sort_by, sort_order).limit(limit)
                
                result = await session.execute(query)
                models = result.scalars().all()
                
                # Convert to AuditEvent objects
                from app.infrastructure.shared.audit.audit_logger import AuditSeverity
                
                events = []
                for model in models:
                    event = AuditLogEvent(
                        event_id=model.event_id,
                        event_timestamp=model.event_timestamp,
                        event_type=AuditEventType(model.event_type),
                        severity=AuditSeverity(model.severity),
                        entity_type=model.entity_type,
                        entity_id=model.entity_id,
                        parent_entity_type=model.parent_entity_type,
                        parent_entity_id=model.parent_entity_id,
                        user_id=model.user_id,
                        user_email=model.user_email,
                        session_id=model.session_id,
                        request_id=model.request_id,
                        ip_address=str(model.ip_address) if model.ip_address else None,
                        user_agent=model.user_agent,
                        old_values=model.old_values or {},
                        new_values=model.new_values or {},
                        changed_fields=list(model.changed_fields) if model.changed_fields else [],
                        description=model.description,
                        metadata=model.metadata_json or {},
                        retention_period_days=model.retention_period_days,
                        is_pii=model.is_pii,
                        is_sensitive=model.is_sensitive
                    )
                    events.append(event)
                
                return events
                
            finally:
                await session.close()
                
        except Exception as e:
            logger.error(f"Error getting user activity: {e}", exc_info=True)
            return []
    
    async def get_login_history(
        
        self,
        user_id: str,
        limit: int = 50
    ) -> List[AuditLogEvent]:
        """
        Get user login history
        
        Args:
            user_id: User ID
            limit: Maximum number of login events
            
        Returns:
            List of login events
        """
        return await self.get_user_activity(
            user_id=user_id,
            limit=limit,
            event_types=[AuditEventType.LOGIN.value]
        )
    
    async def get_recent_activity(
        self,
        user_id: str,
        hours: int = 24,
        limit: int = 100,
        sort_by: str = "event_timestamp",
        sort_order: str = "desc"
    ) -> List[AuditLogEvent]:
        """
        Get user's recent activity (last N hours)
        
        Args:
            user_id: User ID
            hours: Number of hours to look back
            limit: Maximum number of events
            
        Returns:
            List of recent audit events
        """
        start_date = datetime.now(timezone.utc) - timedelta(hours=hours)
        return await self.get_user_activity(
            user_id=user_id,
            limit=limit,
            start_date=start_date,
            sort_by=sort_by,
            sort_order=sort_order
        )
    
    async def get_activity_by_date_range(
        self,
        user_id: str,
        start_date: datetime,
        end_date: datetime,
        limit: int = 500
    ) -> List[AuditLogEvent]:
        """
        Get user activity within a date range
        
        Args:
            user_id: User ID
            start_date: Start date
            end_date: End date
            limit: Maximum number of events
            
        Returns:
            List of audit events in the date range
        """
        return await self.get_user_activity(
            user_id=user_id,
            limit=limit,
            start_date=start_date,
            end_date=end_date
        )
    
    async def get_activity_summary(
        self,
        user_id: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get summary statistics for user activity
        
        Args:
            user_id: User ID
            days: Number of days to analyze
            
        Returns:
            Dictionary with activity summary statistics
        """
        try:
            session = await get_async_session()
            
            try:
                # Ensure timezone-aware datetime
                start_date = datetime.now(timezone.utc) - timedelta(days=days)
                
                # Build query for activity summary
                # Ensure start_date is timezone-aware
                start_date_tz = start_date
                if start_date_tz.tzinfo is None:
                    start_date_tz = start_date_tz.replace(tzinfo=timezone.utc)
                
                query = select(
                    AuditLogModel.event_type,
                    func.count(AuditLogModel.id).label('count'),
                    func.max(AuditLogModel.event_timestamp).label('last_occurrence')
                ).where(
                    and_(
                        AuditLogModel.user_id == user_id,
                        AuditLogModel.event_timestamp >= start_date_tz,
                        AuditLogModel.event_type.in_(USER_ACTIVITY_EVENT_TYPES)
                    )
                )
                
                # Apply tenant filter
                tenant_id = get_tenant_context()
                if tenant_id:
                    query = query.where(AuditLogModel.tenant_id == tenant_id)
                
                query = query.group_by(AuditLogModel.event_type)
                
                result = await session.execute(query)
                rows = result.all()
                
                # Build summary dictionary
                summary = {
                    'user_id': user_id,
                    'period_days': days,
                    'total_events': sum(row.count for row in rows),
                    'by_event_type': {
                        row.event_type: {
                            'count': row.count,
                            'last_occurrence': row.last_occurrence.isoformat() if row.last_occurrence else None
                        }
                        for row in rows
                    }
                }
                
                return summary
                
            finally:
                await session.close()
                
        except Exception as e:
            logger.error(f"Error getting activity summary: {e}", exc_info=True)
            return {
                'user_id': user_id,
                'period_days': days,
                'total_events': 0,
                'by_event_type': {}
            }
    
    async def get_entity_activity(
        self,
        entity_type: str,
        entity_id: str,
        limit: int = 100,
        event_types: Optional[List[str]] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        sort_by: str = "event_timestamp",
        sort_order: str = "desc",
        include_child_entities: bool = True
    ) -> List[AuditLogEvent]:
        """
        Get activity logs for a specific entity (e.g., all activities for a user or show)
        
        This is useful for viewing all activities related to an entity, including:
        - Direct entity events (where entity_type and entity_id match)
        - Child entity events (where parent_entity_type and parent_entity_id match)
          For example, when viewing a "show", this also includes "event" audit logs
          that have the show as their parent entity.
        
        Args:
            entity_type: Type of entity (e.g., "user", "show")
            entity_id: ID of the entity
            limit: Maximum number of events to return
            event_types: Filter by specific event types (default: all user activity types for users)
            start_date: Start date filter
            end_date: End date filter
            sort_by: Field to sort by
            sort_order: Sort direction (asc/desc)
            include_child_entities: Whether to include logs from child entities (default: True)
            
        Returns:
            List of audit events for the entity and its children
        """
        try:
            session = await get_async_session()
            
            try:
                # Build query filtering by entity_id
                # Also include child entities where this entity is the parent
                if include_child_entities:
                    # Match either:
                    # 1. Direct entity match (entity_type and entity_id)
                    # 2. Parent entity match (parent_entity_id = entity_id)
                    entity_filter = or_(
                        and_(
                            AuditLogModel.entity_type == entity_type,
                            AuditLogModel.entity_id == entity_id
                        ),
                        AuditLogModel.parent_entity_id == entity_id
                    )
                else:
                    # Only match direct entity
                    entity_filter = and_(
                        AuditLogModel.entity_type == entity_type,
                        AuditLogModel.entity_id == entity_id
                    )
                
                query = select(AuditLogModel).where(entity_filter)
                
                # Apply tenant filter
                tenant_id = get_tenant_context()
                if tenant_id:
                    query = query.where(AuditLogModel.tenant_id == tenant_id)
                
                # Filter by event types (default to user activity types for user entities)
                if event_types is None and entity_type == "user":
                    event_types = USER_ACTIVITY_EVENT_TYPES
                
                if event_types:
                    query = query.where(
                        AuditLogModel.event_type.in_(event_types)
                    )
                
                # Apply date filters
                # Ensure datetimes are timezone-aware for comparison with TIMESTAMPTZ column
                if start_date:
                    start_date_tz = start_date
                    if start_date_tz.tzinfo is None:
                        start_date_tz = start_date_tz.replace(tzinfo=timezone.utc)
                    query = query.where(AuditLogModel.event_timestamp >= start_date_tz)
                if end_date:
                    end_date_tz = end_date
                    if end_date_tz.tzinfo is None:
                        end_date_tz = end_date_tz.replace(tzinfo=timezone.utc)
                    query = query.where(AuditLogModel.event_timestamp <= end_date_tz)
                
                # Apply dynamic sorting
                query = _apply_sorting(query, sort_by, sort_order).limit(limit)
                
                result = await session.execute(query)
                models = result.scalars().all()
                
                # Convert to AuditEvent objects
                from app.infrastructure.shared.audit.audit_logger import AuditSeverity
                
                events = []
                for model in models:
                    event = AuditLogEvent(
                        event_id=model.event_id,
                        event_timestamp=model.event_timestamp,
                        event_type=AuditEventType(model.event_type),
                        severity=AuditSeverity(model.severity),
                        entity_type=model.entity_type,
                        entity_id=model.entity_id,
                        parent_entity_type=model.parent_entity_type,
                        parent_entity_id=model.parent_entity_id,
                        user_id=model.user_id,
                        user_email=model.user_email,
                        session_id=model.session_id,
                        request_id=model.request_id,
                        ip_address=str(model.ip_address) if model.ip_address else None,
                        user_agent=model.user_agent,
                        old_values=model.old_values or {},
                        new_values=model.new_values or {},
                        changed_fields=list(model.changed_fields) if model.changed_fields else [],
                        description=model.description,
                        metadata=model.metadata_json or {},
                        retention_period_days=model.retention_period_days,
                        is_pii=model.is_pii,
                        is_sensitive=model.is_sensitive
                    )
                    events.append(event)
                
                return events
                
            finally:
                await session.close()
                
        except Exception as e:
            logger.error(f"Error getting entity activity: {e}", exc_info=True)
            return []

    async def get_session_activity(
        self,
        session_id: str,
        limit: int = 200
    ) -> List[AuditLogEvent]:
        """
        Get all activity for a specific session
        
        Args:
            session_id: Session ID
            limit: Maximum number of events
            
        Returns:
            List of audit events for the session
        """
        try:
            session = await get_async_session()
            
            try:
                query = select(AuditLogModel).where(
                    AuditLogModel.session_id == session_id
                )
                
                # Apply tenant filter
                tenant_id = get_tenant_context()
                if tenant_id:
                    query = query.where(AuditLogModel.tenant_id == tenant_id)
                
                query = query.order_by(
                    AuditLogModel.event_timestamp.asc()  # Chronological order for session
                ).limit(limit)
                
                result = await session.execute(query)
                models = result.scalars().all()
                
                # Convert to AuditEvent objects
                from app.infrastructure.shared.audit.audit_logger import AuditSeverity
                
                events = []
                for model in models:
                    event = AuditLogEvent(
                        event_id=model.event_id,
                        event_timestamp=model.event_timestamp,
                        event_type=AuditEventType(model.event_type),
                        severity=AuditSeverity(model.severity),
                        entity_type=model.entity_type,
                        entity_id=model.entity_id,
                        parent_entity_type=model.parent_entity_type,
                        parent_entity_id=model.parent_entity_id,
                        user_id=model.user_id,
                        user_email=model.user_email,
                        session_id=model.session_id,
                        request_id=model.request_id,
                        ip_address=str(model.ip_address) if model.ip_address else None,
                        user_agent=model.user_agent,
                        old_values=model.old_values or {},
                        new_values=model.new_values or {},
                        changed_fields=list(model.changed_fields) if model.changed_fields else [],
                        description=model.description,
                        metadata=model.metadata_json or {},
                        retention_period_days=model.retention_period_days,
                        is_pii=model.is_pii,
                        is_sensitive=model.is_sensitive
                    )
                    events.append(event)
                
                return events
                
            finally:
                await session.close()
                
        except Exception as e:
            logger.error(f"Error getting session activity: {e}", exc_info=True)
            return []

