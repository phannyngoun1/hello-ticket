"""
Async audit logger implementation for Phase 1
Provides non-blocking audit log persistence with batching
"""
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import insert, select, cast
from sqlalchemy.dialects.postgresql import INET
from datetime import datetime
import logging

from app.infrastructure.shared.audit.audit_logger import AuditLogger, AuditEvent
from app.infrastructure.shared.audit.event_buffer import AuditEventBuffer
from app.infrastructure.shared.database.models import AuditLogModel
from app.infrastructure.shared.database.connection import get_async_session
from app.shared.tenant_context import get_tenant_context

logger = logging.getLogger(__name__)


class AsyncAuditLogger(AuditLogger):
    """
    Asynchronous, batched audit logger (Phase 1 implementation)
    
    Features:
    - Non-blocking event logging (fire-and-forget)
    - Automatic batching for performance
    - Graceful error handling
    """
    
    def __init__(
        self,
        batch_size: int = 50,
        flush_interval_seconds: float = 2.0
    ):
        self.batch_size = batch_size
        self.flush_interval = flush_interval_seconds
        
        # Create event buffer
        self._buffer = AuditEventBuffer(
            batch_size=batch_size,
            flush_interval_seconds=flush_interval_seconds
        )
        
        # Wire up buffer flush callback
        self._buffer.set_flush_callback(self._persist_batch)
    
    async def log_event(self, event: AuditEvent) -> None:
        """
        Log event asynchronously (non-blocking)
        
        This method returns immediately after queuing the event.
        Actual persistence happens in background via batching.
        """
        await self._buffer.append(event)
    
    async def _persist_batch(self, batch: List[AuditEvent]) -> None:
        """
        Persist batch of events to database
        
        This is called by the buffer when a batch is ready.
        """
        if not batch:
            return
        
        try:
            # Get async session
            session = await get_async_session()
            
            try:
                # Convert events to database records
                records = []
                tenant_id = get_tenant_context() or 'unknown'
                
                # Convert events to AuditLogModel instances
                # This approach lets SQLAlchemy handle type conversions properly
                audit_models = []
                
                for event in batch:
                    # Generate unique ID for each audit log entry
                    from app.shared.utils import generate_id
                    log_id = generate_id()
                    
                    # Handle IP address - SQLAlchemy will convert string to INET
                    ip_address_value = None
                    if event.ip_address:
                        ip_address_value = str(event.ip_address)
                    
                    # Ensure user_email is a string (handle Email value objects)
                    user_email_str = None
                    if event.user_email:
                        user_email_str = str(event.user_email)
                    
                    model = AuditLogModel(
                        id=log_id,
                        tenant_id=tenant_id,
                        event_id=event.event_id,
                        timestamp=event.timestamp,
                        event_type=event.event_type.value,
                        severity=event.severity.value,
                        entity_type=event.entity_type,
                        entity_id=event.entity_id,
                        user_id=event.user_id,
                        user_email=user_email_str,
                        session_id=event.session_id,
                        request_id=event.request_id,
                        ip_address=ip_address_value,  # SQLAlchemy will handle INET conversion
                        user_agent=event.user_agent,
                        old_values=event.old_values if event.old_values else None,
                        new_values=event.new_values if event.new_values else None,
                        changed_fields=event.changed_fields if event.changed_fields else None,
                        description=event.description,
                        metadata_json=event.metadata if event.metadata else {},
                        retention_period_days=event.retention_period_days,
                        is_pii=event.is_pii,
                        is_sensitive=event.is_sensitive if hasattr(event, 'is_sensitive') else False,
                    )
                    audit_models.append(model)
                
                # Bulk insert using add_all (SQLAlchemy handles type conversions)
                session.add_all(audit_models)
                await session.commit()
                
                logger.debug(f"Persisted {len(batch)} audit events")
                
            except Exception as e:
                await session.rollback()
                raise e
            finally:
                await session.close()
                
        except Exception as e:
            logger.error(f"Error persisting audit batch: {e}", exc_info=True)
            # Don't re-raise - buffer will handle re-queueing if needed
            raise
    
    async def get_events(
        self,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        user_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100
    ) -> List[AuditEvent]:
        """Query audit events from database"""
        try:
            session = await get_async_session()
            
            try:
                # Build query
                query = select(AuditLogModel)
                
                # Apply tenant filter
                tenant_id = get_tenant_context()
                if tenant_id:
                    query = query.where(AuditLogModel.tenant_id == tenant_id)
                
                # Apply filters
                if entity_type:
                    query = query.where(AuditLogModel.entity_type == entity_type)
                if entity_id:
                    query = query.where(AuditLogModel.entity_id == entity_id)
                if user_id:
                    query = query.where(AuditLogModel.user_id == user_id)
                if start_date:
                    query = query.where(AuditLogModel.timestamp >= start_date)
                if end_date:
                    query = query.where(AuditLogModel.timestamp <= end_date)
                
                # Order and limit
                query = query.order_by(AuditLogModel.timestamp.desc()).limit(limit)
                
                result = await session.execute(query)
                models = result.scalars().all()
                
                # Convert models to events
                from app.infrastructure.shared.audit.audit_logger import AuditEventType, AuditSeverity
                
                events = []
                for model in models:
                    # Handle IP address (might be string or None)
                    ip_address = str(model.ip_address) if model.ip_address else None
                    
                    event = AuditEvent(
                        event_id=model.event_id,
                        timestamp=model.timestamp,
                        event_type=AuditEventType(model.event_type),
                        severity=AuditSeverity(model.severity),
                        entity_type=model.entity_type,
                        entity_id=model.entity_id,
                        user_id=model.user_id,
                        user_email=model.user_email,
                        session_id=model.session_id,
                        request_id=model.request_id,
                        ip_address=ip_address,
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
            logger.error(f"Error querying audit events: {e}", exc_info=True)
            return []
    
    async def shutdown(self):
        """Graceful shutdown"""
        await self._buffer.shutdown()

