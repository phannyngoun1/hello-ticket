"""
Inventory domain events
"""
from typing import Dict, Any, Optional
from decimal import Decimal
from app.domain.shared.events.base import DomainEvent


class InventoryReceived(DomainEvent):
    """Event raised when inventory is received"""
    
    def __init__(
        self,
        inventory_transaction_id: str,
        item_id: str,
        warehouse_id: str,
        quantity: Decimal,
        cost_per_unit: Decimal,
        lot_id: Optional[str] = None,
        serial_id: Optional[str] = None,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.inventory_transaction_id = inventory_transaction_id
        self.item_id = item_id
        self.warehouse_id = warehouse_id
        self.quantity = quantity
        self.cost_per_unit = cost_per_unit
        self.lot_id = lot_id
        self.serial_id = serial_id
    
    def event_type(self) -> str:
        return "inventory.received"
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "event_type": self.event_type(),
            "occurred_at": self.occurred_at.isoformat(),
            "inventory_transaction_id": self.inventory_transaction_id,
            "item_id": self.item_id,
            "warehouse_id": self.warehouse_id,
            "quantity": str(self.quantity),
            "cost_per_unit": str(self.cost_per_unit),
            "lot_id": self.lot_id,
            "serial_id": self.serial_id,
            "metadata": self.metadata
        }


class InventoryIssued(DomainEvent):
    """Event raised when inventory is issued"""
    
    def __init__(
        self,
        inventory_transaction_id: str,
        item_id: str,
        warehouse_id: str,
        quantity: Decimal,
        lot_id: Optional[str] = None,
        serial_id: Optional[str] = None,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.inventory_transaction_id = inventory_transaction_id
        self.item_id = item_id
        self.warehouse_id = warehouse_id
        self.quantity = quantity
        self.lot_id = lot_id
        self.serial_id = serial_id
    
    def event_type(self) -> str:
        return "inventory.issued"
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "event_type": self.event_type(),
            "occurred_at": self.occurred_at.isoformat(),
            "inventory_transaction_id": self.inventory_transaction_id,
            "item_id": self.item_id,
            "warehouse_id": self.warehouse_id,
            "quantity": str(self.quantity),
            "lot_id": self.lot_id,
            "serial_id": self.serial_id,
            "metadata": self.metadata
        }


class InventoryMoved(DomainEvent):
    """Event raised when inventory is moved between bins"""
    
    def __init__(
        self,
        inventory_transaction_id: str,
        item_id: str,
        warehouse_id: str,
        from_bin_id: str,
        to_bin_id: str,
        quantity: Decimal,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.inventory_transaction_id = inventory_transaction_id
        self.item_id = item_id
        self.warehouse_id = warehouse_id
        self.from_bin_id = from_bin_id
        self.to_bin_id = to_bin_id
        self.quantity = quantity
    
    def event_type(self) -> str:
        return "inventory.moved"
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "event_type": self.event_type(),
            "occurred_at": self.occurred_at.isoformat(),
            "inventory_transaction_id": self.inventory_transaction_id,
            "item_id": self.item_id,
            "warehouse_id": self.warehouse_id,
            "from_bin_id": self.from_bin_id,
            "to_bin_id": self.to_bin_id,
            "quantity": str(self.quantity),
            "metadata": self.metadata
        }


class InventoryAdjusted(DomainEvent):
    """Event raised when inventory is adjusted"""
    
    def __init__(
        self,
        inventory_transaction_id: str,
        item_id: str,
        warehouse_id: str,
        quantity: Decimal,
        adjustment_type: str,  # ADJUST_IN or ADJUST_OUT
        reason_code: Optional[str] = None,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.inventory_transaction_id = inventory_transaction_id
        self.item_id = item_id
        self.warehouse_id = warehouse_id
        self.quantity = quantity
        self.adjustment_type = adjustment_type
        self.reason_code = reason_code
    
    def event_type(self) -> str:
        return "inventory.adjusted"
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "event_type": self.event_type(),
            "occurred_at": self.occurred_at.isoformat(),
            "inventory_transaction_id": self.inventory_transaction_id,
            "item_id": self.item_id,
            "warehouse_id": self.warehouse_id,
            "quantity": str(self.quantity),
            "adjustment_type": self.adjustment_type,
            "reason_code": self.reason_code,
            "metadata": self.metadata
        }


class InventoryReserved(DomainEvent):
    """Event raised when inventory is reserved"""
    
    def __init__(
        self,
        reservation_id: str,
        item_id: str,
        warehouse_id: str,
        quantity: Decimal,
        source_type: str,
        source_id: str,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.reservation_id = reservation_id
        self.item_id = item_id
        self.warehouse_id = warehouse_id
        self.quantity = quantity
        self.source_type = source_type
        self.source_id = source_id
    
    def event_type(self) -> str:
        return "inventory.reserved"
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "event_type": self.event_type(),
            "occurred_at": self.occurred_at.isoformat(),
            "reservation_id": self.reservation_id,
            "item_id": self.item_id,
            "warehouse_id": self.warehouse_id,
            "quantity": str(self.quantity),
            "source_type": self.source_type,
            "source_id": self.source_id,
            "metadata": self.metadata
        }


class InventoryReservationReleased(DomainEvent):
    """Event raised when inventory reservation is released"""
    
    def __init__(
        self,
        reservation_id: str,
        item_id: str,
        warehouse_id: str,
        quantity: Decimal,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.reservation_id = reservation_id
        self.item_id = item_id
        self.warehouse_id = warehouse_id
        self.quantity = quantity
    
    def event_type(self) -> str:
        return "inventory.reservation_released"
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "event_type": self.event_type(),
            "occurred_at": self.occurred_at.isoformat(),
            "reservation_id": self.reservation_id,
            "item_id": self.item_id,
            "warehouse_id": self.warehouse_id,
            "quantity": str(self.quantity),
            "metadata": self.metadata
        }


class StockLow(DomainEvent):
    """Event raised when stock falls below reorder point"""
    
    def __init__(
        self,
        item_id: str,
        warehouse_id: str,
        current_quantity: Decimal,
        reorder_point: Decimal,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.item_id = item_id
        self.warehouse_id = warehouse_id
        self.current_quantity = current_quantity
        self.reorder_point = reorder_point
    
    def event_type(self) -> str:
        return "inventory.stock_low"
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "event_type": self.event_type(),
            "occurred_at": self.occurred_at.isoformat(),
            "item_id": self.item_id,
            "warehouse_id": self.warehouse_id,
            "current_quantity": str(self.current_quantity),
            "reorder_point": str(self.reorder_point),
            "metadata": self.metadata
        }

