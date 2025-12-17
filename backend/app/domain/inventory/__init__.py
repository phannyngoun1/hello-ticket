"""
Inventory Domain Layer

Entities, aggregates, repositories, and events for inventory management.
"""

from .serial import Serial
from .item import Item
from .balance import InventoryBalance
from .tracking import InventoryTracking
from .transaction import InventoryTransaction
from .category import ItemCategory
from .repositories import (
    ItemRepository,
    InventoryBalanceRepository,
    SerialRepository,
    InventoryTrackingRepository,
    InventoryTransactionRepository,
    ItemCategoryRepository,
)
from .events import (
    InventoryReceived,
    InventoryIssued,
    InventoryMoved,
    InventoryAdjusted,
    InventoryReserved,
    InventoryReservationReleased,
    StockLow,
)

__all__ = [
    # Entities
    "Serial",
    # Aggregates
    "Item",
    "InventoryBalance",
    "InventoryTracking",
    "InventoryTransaction",
    "ItemCategory",
    # Repositories
    "ItemRepository",
    "InventoryBalanceRepository",
    "SerialRepository",
    "InventoryTrackingRepository",
    "InventoryTransactionRepository",
    "ItemCategoryRepository",
    # Events
    "InventoryReceived",
    "InventoryIssued",
    "InventoryMoved",
    "InventoryAdjusted",
    "InventoryReserved",
    "InventoryReservationReleased",
    "StockLow",
]

