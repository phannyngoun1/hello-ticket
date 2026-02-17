"""
Domain event handlers for CQRS pattern
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Type, TypeVar
from app.domain.shared.events.base import DomainEvent
import logging

logger = logging.getLogger(__name__)

T = TypeVar('T', bound=DomainEvent)


class DomainEventHandler(ABC):
    """Base class for domain event handlers"""
    
    @abstractmethod
    async def handle(self, event: DomainEvent) -> None:
        """Handle domain event"""
        pass
    
    @property
    @abstractmethod
    def event_types(self) -> List[Type[DomainEvent]]:
        """Get list of event types this handler can process"""
        pass


class AuditEventHandler(DomainEventHandler):
    """Event handler for audit logging"""
    
    def __init__(self, audit_logger=None):
        # If no logger provided, get from container
        if audit_logger is None:
            from app.shared.container import container
            from app.infrastructure.shared.audit.audit_logger import AuditLogger
            try:
                audit_logger = container.resolve(AuditLogger)
            except Exception:
                # Fallback: get from context
                from app.infrastructure.shared.audit.audit_logger import _audit_logger_var
                audit_logger = _audit_logger_var.get()
        
        self.audit_logger = audit_logger
    
    async def handle(self, event: DomainEvent) -> None:
        """Handle domain event for audit logging"""
        # Skip if no audit logger configured
        if not self.audit_logger:
            return
        
        from app.infrastructure.shared.audit.audit_logger import (
            AuditLogEvent,
            AuditEventType,
            AuditSeverity,
            get_audit_context
        )
        
        context = get_audit_context()
        from app.shared.tenant_context import get_tenant_context
        tenant_id = get_tenant_context() or 'unknown'
        if not context:
            # No context means this event happened outside a request (e.g., background job)
            # Still log but with minimal context
            audit_event = AuditLogEvent(
                event_type=AuditEventType.UPDATE,
                tenant_id=tenant_id,
                entity_type=event.__class__.__name__.replace("Event", "").lower(),
                entity_id=getattr(event, 'user_id', None) or getattr(event, 'order_id', None) or 'unknown',
                description=f"Domain event: {event.event_type()}",
                severity=AuditSeverity.LOW,
                metadata={
                    "domain_event_id": event.event_id,
                    "domain_event_type": event.event_type(),
                    "domain_event_data": event.to_dict() if hasattr(event, 'to_dict') else {},
                    "logged_without_request_context": True
                }
            )
        else:
            # Create audit event with context
            audit_event = context.create_event(
                event_type=AuditEventType.UPDATE,  # Most domain events are updates
                entity_type=event.__class__.__name__.replace("Event", "").lower(),
                entity_id=getattr(event, 'user_id', None) or getattr(event, 'order_id', None) or 'unknown',
                description=f"Domain event: {event.event_type()}",
                severity=AuditSeverity.LOW
            )
            audit_event.tenant_id = audit_event.tenant_id or tenant_id
            # Add event-specific data
            audit_event.metadata.update({
                "domain_event_id": event.event_id,
                "domain_event_type": event.event_type(),
                "domain_event_data": event.to_dict() if hasattr(event, 'to_dict') else {}
            })
        
        # Log event asynchronously (non-blocking)
        await self.audit_logger.log_event(audit_event)
    
    @property
    def event_types(self) -> List[Type[DomainEvent]]:
        """Handle all domain events"""
        from app.domain.core.user.events import UserCreated, UserUpdated, UserDeactivated
        return [UserCreated, UserUpdated, UserDeactivated]


class NotificationEventHandler(DomainEventHandler):
    """Event handler for sending notifications"""
    
    def __init__(self, notification_service):
        self.notification_service = notification_service
    
    async def handle(self, event: DomainEvent) -> None:
        """Handle domain event for notifications"""
        event_type = event.event_type()
        
        if event_type == "user.created":
            await self._handle_user_created(event)
    
    async def _handle_user_created(self, event) -> None:
        """Handle user creation notification"""
        # Send welcome email
        logger.info(f"Sending welcome email to {event.email}")
    
    @property
    def event_types(self) -> List[Type[DomainEvent]]:
        """Handle specific notification events"""
        from app.domain.core.user.events import UserCreated
        return [UserCreated]




class EventBus:
    """Simple event bus for domain events"""
    
    def __init__(self):
        self._handlers: List[DomainEventHandler] = []
    
    def register_handler(self, handler: DomainEventHandler) -> None:
        """Register event handler"""
        self._handlers.append(handler)
    
    async def publish(self, event: DomainEvent) -> None:
        """Publish domain event to all registered handlers"""
        for handler in self._handlers:
            if any(isinstance(event, event_type) for event_type in handler.event_types):
                try:
                    await handler.handle(event)
                except Exception as e:
                    # Log error but don't stop other handlers
                    logger.error(f"Error in event handler {handler.__class__.__name__}: {e}")


# Global event bus instance
event_bus = EventBus()
