"""
Inventory Balance Domain Entity

Represents inventory quantity at a specific location with optional tracking (lot/serial).
This is a core domain model required for inventory operations (receive, issue, adjust, move).
"""
from decimal import Decimal
from datetime import datetime, timezone
from typing import Optional
from app.shared.utils import generate_id


class InventoryBalance:
    """
    Inventory Balance aggregate root
    
    Represents the quantity of an item at a specific location.
    Supports lot/serial tracking and status management.
    """
    
    def __init__(
        self,
        balance_id: Optional[str] = None,
        tenant_id: str = "",
        item_id: str = "",
        location_id: str = "",
        tracking_id: Optional[str] = None,
        status: str = "available",
        quantity: Decimal = Decimal('0'),
        version: int = 0,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
    ):
        self.id = balance_id or generate_id()
        self.tenant_id = tenant_id
        self.item_id = item_id
        self.location_id = location_id
        self.tracking_id = tracking_id
        self.status = status
        self.quantity = quantity
        self.version = version
        self.created_at = created_at or datetime.now(timezone.utc)
        self.updated_at = updated_at or datetime.now(timezone.utc)
    
    def receive(
        self,
        quantity: Decimal,
        cost_per_unit: Optional[Decimal] = None,
        transaction_id: Optional[str] = None
    ) -> None:
        """Receive inventory into this balance"""
        if quantity <= 0:
            raise ValueError("Receive quantity must be positive")
        self.quantity += quantity
        self.updated_at = datetime.now(timezone.utc)
        self.version += 1
    
    def issue(
        self,
        quantity: Decimal,
        transaction_id: Optional[str] = None
    ) -> None:
        """Issue inventory from this balance"""
        if quantity <= 0:
            raise ValueError("Issue quantity must be positive")
        if self.quantity < quantity:
            raise ValueError(f"Insufficient quantity. Available: {self.quantity}, Requested: {quantity}")
        self.quantity -= quantity
        self.updated_at = datetime.now(timezone.utc)
        self.version += 1
    
    def adjust(
        self,
        quantity: Decimal,
        adjustment_type: str,
        transaction_id: Optional[str] = None
    ) -> None:
        """Adjust inventory quantity"""
        if adjustment_type == "ADJUST_IN":
            self.receive(quantity, transaction_id=transaction_id)
        elif adjustment_type == "ADJUST_OUT":
            self.issue(quantity, transaction_id=transaction_id)
        else:
            raise ValueError(f"Invalid adjustment type: {adjustment_type}")
    
    def move(
        self,
        to_location_id: str,
        quantity: Decimal,
        transaction_id: Optional[str] = None
    ) -> None:
        """Move inventory from this balance (used when moving to another location)"""
        if quantity <= 0:
            raise ValueError("Move quantity must be positive")
        if self.quantity < quantity:
            raise ValueError(f"Insufficient quantity. Available: {self.quantity}, Requested: {quantity}")
        self.quantity -= quantity
        self.updated_at = datetime.now(timezone.utc)
        self.version += 1
    
    def get_available_quantity(self) -> Decimal:
        """Get available quantity (currently just returns quantity, but can be extended for reservations)"""
        return self.quantity
    
    def get_version(self) -> int:
        """Get version for optimistic locking"""
        return self.version
    
    def reserve(self, quantity: Decimal) -> None:
        """Reserve inventory (for future use)"""
        if quantity <= 0:
            raise ValueError("Reserve quantity must be positive")
        if self.quantity < quantity:
            raise ValueError(f"Insufficient quantity. Available: {self.quantity}, Requested: {quantity}")
        # For now, reservation is handled separately via InventoryReservationModel
        # This method is a placeholder for future domain logic
    
    def release_reservation(self, quantity: Decimal) -> None:
        """Release reserved inventory"""
        if quantity <= 0:
            raise ValueError("Release quantity must be positive")
        # For now, reservation is handled separately via InventoryReservationModel
        # This method is a placeholder for future domain logic
