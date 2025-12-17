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
            AuditEvent,
            AuditEventType,
            AuditSeverity,
            get_audit_context
        )
        
        context = get_audit_context()
        if not context:
            # No context means this event happened outside a request (e.g., background job)
            # Still log but with minimal context
            from app.shared.tenant_context import get_tenant_context
            tenant_id = get_tenant_context() or 'unknown'
            
            audit_event = AuditEvent(
                event_type=AuditEventType.UPDATE,
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
        from app.domain.events.order_events import OrderCreated, OrderConfirmed, OrderShipped, OrderCancelled
        
        return [
            UserCreated, UserUpdated, UserDeactivated,
            OrderCreated, OrderConfirmed, OrderShipped, OrderCancelled
        ]


class NotificationEventHandler(DomainEventHandler):
    """Event handler for sending notifications"""
    
    def __init__(self, notification_service):
        self.notification_service = notification_service
    
    async def handle(self, event: DomainEvent) -> None:
        """Handle domain event for notifications"""
        event_type = event.event_type()
        
        if event_type == "user.created":
            await self._handle_user_created(event)
        elif event_type == "order.confirmed":
            await self._handle_order_confirmed(event)
        elif event_type == "order.shipped":
            await self._handle_order_shipped(event)
    
    async def _handle_user_created(self, event) -> None:
        """Handle user creation notification"""
        # Send welcome email
        logger.info(f"Sending welcome email to {event.email}")
    
    async def _handle_order_confirmed(self, event) -> None:
        """Handle order confirmation notification"""
        # Send order confirmation email
        logger.info(f"Sending order confirmation for order {event.order_id}")
    
    async def _handle_order_shipped(self, event) -> None:
        """Handle order shipped notification"""
        # Send shipping notification
        logger.info(f"Sending shipping notification for order {event.order_id}, tracking: {event.tracking_number}")
    
    @property
    def event_types(self) -> List[Type[DomainEvent]]:
        """Handle specific notification events"""
        from app.domain.core.user.events import UserCreated
        from app.domain.events.order_events import OrderConfirmed, OrderShipped
        
        return [UserCreated, OrderConfirmed, OrderShipped]


class InventoryEventHandler(DomainEventHandler):
    """Event handler for inventory domain events"""
    
    def __init__(self, inventory_service=None):
        self.inventory_service = inventory_service
    
    async def handle(self, event: DomainEvent) -> None:
        """Handle domain event for inventory updates"""
        event_type = event.event_type()
        
        if event_type == "inventory.received":
            await self._handle_inventory_received(event)
        elif event_type == "inventory.issued":
            await self._handle_inventory_issued(event)
        elif event_type == "inventory.moved":
            await self._handle_inventory_moved(event)
        elif event_type == "inventory.adjusted":
            await self._handle_inventory_adjusted(event)
        elif event_type == "inventory.reserved":
            await self._handle_inventory_reserved(event)
        elif event_type == "inventory.reservation_released":
            await self._handle_reservation_released(event)
        elif event_type == "inventory.stock_low":
            await self._handle_stock_low(event)
    
    async def _handle_inventory_received(self, event) -> None:
        """Handle inventory received event"""
        # Example: Update availability cache, notify accounting, trigger quality checks
        logger.info(f"Inventory received: Item {event.item_id}, Quantity {event.quantity}, Cost {event.cost_per_unit}")
        # TODO: Implement cache updates, accounting integration, quality checks
    
    async def _handle_inventory_issued(self, event) -> None:
        """Handle inventory issued event"""
        # Example: Update availability cache, notify accounting, check reorder points
        logger.info(f"Inventory issued: Item {event.item_id}, Quantity {event.quantity}")
        # TODO: Implement cache updates, accounting integration, reorder checks
    
    async def _handle_inventory_moved(self, event) -> None:
        """Handle inventory moved event"""
        # Example: Update location tracking, update putaway rules
        logger.info(f"Inventory moved: Item {event.item_id}, From {event.from_bin_id} to {event.to_bin_id}, Quantity {event.quantity}")
        # TODO: Implement location tracking updates
    
    async def _handle_inventory_adjusted(self, event) -> None:
        """Handle inventory adjustment event"""
        # Example: Log adjustment reason, notify accounting
        logger.info(f"Inventory adjusted: Item {event.item_id}, Type {event.adjustment_type}, Quantity {event.quantity}, Reason: {event.reason_code}")
        # TODO: Implement adjustment logging, accounting notifications
    
    async def _handle_inventory_reserved(self, event) -> None:
        """Handle inventory reservation event"""
        # Example: Update availability calculations
        logger.info(f"Inventory reserved: Reservation {event.reservation_id}, Item {event.item_id}, Quantity {event.quantity}")
        # TODO: Implement availability updates
    
    async def _handle_reservation_released(self, event) -> None:
        """Handle reservation release event"""
        # Example: Update availability calculations
        logger.info(f"Reservation released: Reservation {event.reservation_id}, Item {event.item_id}, Quantity {event.quantity}")
        # TODO: Implement availability updates
    
    async def _handle_stock_low(self, event) -> None:
        """Handle stock low alert event"""
        # Example: Send notifications, trigger reorder workflows
        logger.info(f"Stock low alert: Item {event.item_id}, Current: {event.current_quantity}, Reorder point: {event.reorder_point}")
        # TODO: Implement notifications, reorder workflows
    
    @property
    def event_types(self) -> List[Type[DomainEvent]]:
        """Handle inventory domain events"""
        from app.domain.inventory.events import (
            InventoryReceived,
            InventoryIssued,
            InventoryMoved,
            InventoryAdjusted,
            InventoryReserved,
            InventoryReservationReleased,
            StockLow
        )
        
        return [
            InventoryReceived,
            InventoryIssued,
            InventoryMoved,
            InventoryAdjusted,
            InventoryReserved,
            InventoryReservationReleased,
            StockLow
        ]


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
