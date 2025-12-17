"""
Inventory repository interfaces - Ports in Hexagonal Architecture
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from decimal import Decimal
from datetime import datetime, date
from app.domain.inventory.balance import InventoryBalance
from app.domain.inventory.item import Item
from app.domain.inventory.serial import Serial
from app.domain.inventory.category import ItemCategory


class InventoryBalanceRepository(ABC):
    """Inventory Balance repository interface"""
    
    @abstractmethod
    async def save(self, balance: InventoryBalance) -> InventoryBalance:
        """Save or update inventory balance (with optimistic locking)"""
        pass
    
    @abstractmethod
    async def get_by_id(self, balance_id: str) -> Optional[InventoryBalance]:
        """Get balance by ID"""
        pass
    
    @abstractmethod
    async def find_balance(
        self,
        tenant_id: str,
        item_id: str,
        location_id: str,
        tracking_id: Optional[str] = None,
        status: str = "available"
    ) -> Optional[InventoryBalance]:
        """Find specific balance by all key fields"""
        pass
    
    @abstractmethod
    async def get_balances_by_item(
        self,
        tenant_id: str,
        item_id: str,
        location_id: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[InventoryBalance]:
        """Get all balances for an item"""
        pass
    
    @abstractmethod
    async def get_available_quantity(
        self,
        tenant_id: str,
        item_id: str,
        location_id: str
    ) -> Decimal:
        """Get total available quantity for item/location"""
        pass


class SerialRepository(ABC):
    """Serial repository interface"""
    
    @abstractmethod
    async def save(self, serial: Serial) -> Serial:
        """Save or update a serial"""
        pass
    
    @abstractmethod
    async def get_by_id(self, serial_id: str) -> Optional[Serial]:
        """Get serial by ID"""
        pass
    
    @abstractmethod
    async def get_by_serial_number(
        self,
        tenant_id: str,
        item_id: str,
        serial_number: str
    ) -> Optional[Serial]:
        """Get serial by serial number"""
        pass
    
    @abstractmethod
    async def get_by_item(
        self,
        tenant_id: str,
        item_id: str
    ) -> List[Serial]:
        """Get all serials for an item"""
        pass


class ItemRepository(ABC):
    """Item repository interface"""
    
    @abstractmethod
    async def save(self, item: Item) -> Item:
        """Save or update an item"""
        pass
    
    @abstractmethod
    async def get_by_id(self, item_id: str) -> Optional[Item]:
        """Get item by ID"""
        pass
    
    @abstractmethod
    async def get_by_sku(self, tenant_id: str, sku: str) -> Optional[Item]:
        """Get item by SKU"""
        pass
    
    @abstractmethod
    async def search(
        self,
        tenant_id: str,
        search_term: Optional[str] = None,
        item_type: Optional[str] = None,
        item_usage: Optional[str] = None,
        category_id: Optional[str] = None,
        active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Item]:
        """Search items with filters"""
        pass
    
    @abstractmethod
    async def delete(self, item_id: str) -> bool:
        """Delete item by ID"""
        pass


class InventoryTransactionRepository(ABC):
    """Inventory transaction repository interface"""
    
    @abstractmethod
    async def save(self, transaction: "InventoryTransaction") -> "InventoryTransaction":
        """Save an inventory transaction"""
        pass
    
    @abstractmethod
    async def get_by_id(self, transaction_id: str) -> Optional["InventoryTransaction"]:
        """Get transaction by ID"""
        pass
    
    @abstractmethod
    async def get_by_item(
        self,
        tenant_id: str,
        item_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List["InventoryTransaction"]:
        """Get transactions for an item"""
        pass
    
    @abstractmethod
    async def get_by_reference(
        self,
        tenant_id: str,
        reference_type: str,
        reference_id: str
    ) -> List["InventoryTransaction"]:
        """Get transactions by reference"""
        pass


class InventoryTrackingRepository(ABC):
    """Inventory tracking repository interface (unified Lot/Serial)"""
    
    @abstractmethod
    async def save(self, tracking: "InventoryTracking") -> "InventoryTracking":
        """Save or update inventory tracking"""
        pass
    
    @abstractmethod
    async def get_by_id(self, tracking_id: str) -> Optional["InventoryTracking"]:
        """Get tracking by ID"""
        pass
    
    @abstractmethod
    async def get_by_tracking_number(
        self,
        tenant_id: str,
        item_id: str,
        tracking_type: str,
        tracking_number: str
    ) -> Optional["InventoryTracking"]:
        """Get tracking by tracking number"""
        pass
    
    @abstractmethod
    async def get_by_item(
        self,
        tenant_id: str,
        item_id: str,
        tracking_type: Optional[str] = None
    ) -> List["InventoryTracking"]:
        """Get all tracking records for an item"""
        pass


class UnitOfMeasureRepository(ABC):
    """Unit of measure repository interface"""
    
    @abstractmethod
    async def save(self, uom: "UnitOfMeasure") -> "UnitOfMeasure":
        """Save or update a unit of measure"""
        pass
    
    @abstractmethod
    async def get_by_id(self, uom_id: str) -> Optional["UnitOfMeasure"]:
        """Get UoM by ID"""
        pass
    
    @abstractmethod
    async def get_by_code(self, tenant_id: str, code: str) -> Optional["UnitOfMeasure"]:
        """Get UoM by code"""
        pass
    
    @abstractmethod
    async def get_all(self, tenant_id: str) -> List["UnitOfMeasure"]:
        """Get all UoMs for a tenant"""
        pass


class ItemCategoryRepository(ABC):
    """Item Category repository interface with hierarchy support"""
    
    @abstractmethod
    async def save(self, category: ItemCategory) -> ItemCategory:
        """Save or update a category"""
        pass
    
    @abstractmethod
    async def get_by_id(self, category_id: str) -> Optional[ItemCategory]:
        """Get category by ID"""
        pass
    
    @abstractmethod
    async def get_by_code(self, tenant_id: str, code: str) -> Optional[ItemCategory]:
        """Get category by code"""
        pass
    
    @abstractmethod
    async def get_children(self, parent_category_id: str) -> List[ItemCategory]:
        """Get all direct children of a category"""
        pass
    
    @abstractmethod
    async def get_descendants(self, category_id: str) -> List[ItemCategory]:
        """Get all descendants of a category (recursive)"""
        pass
    
    @abstractmethod
    async def get_ancestors(self, category_id: str) -> List[ItemCategory]:
        """Get all ancestors of a category (up to root)"""
        pass
    
    @abstractmethod
    async def get_root_categories(self, tenant_id: str) -> List[ItemCategory]:
        """Get all root categories (no parent)"""
        pass
    
    @abstractmethod
    async def get_all(
        self,
        tenant_id: str,
        parent_category_id: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[ItemCategory]:
        """Get all categories with filters"""
        pass
    
    @abstractmethod
    async def delete(self, category_id: str) -> bool:
        """Delete category by ID (only if no children and no items)"""
        pass
    
    @abstractmethod
    async def get_category_tree(self, tenant_id: str) -> List[ItemCategory]:
        """Get full category tree with hierarchy"""
        pass

