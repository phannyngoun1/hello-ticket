"""
Inventory queries for CQRS pattern
"""
from dataclasses import dataclass
from typing import Optional
from datetime import datetime
from decimal import Decimal


@dataclass
class GetItemByIdQuery:
    """Query to get item by ID"""
    item_id: str


@dataclass
class GetItemBySkuQuery:
    """Query to get item by SKU"""
    sku: str


@dataclass
class GetItemsByIdsQuery:
    """Query to get multiple items by IDs"""
    ids: list[str]


@dataclass
class GetAllItemsQuery:
    """Query to get all items"""
    skip: int = 0
    limit: int = 100
    active_only: bool = False


@dataclass
class SearchItemsQuery:
    """Query to search items"""
    query: str
    skip: int = 0
    limit: int = 100
    active_only: bool = False


@dataclass
class GetInventoryBalanceQuery:
    """Query to get inventory balance"""
    item_id: str
    location_id: str  # StoreLocation ID
    tracking_id: Optional[str] = None  # InventoryTracking ID
    status: str = "available"


@dataclass
class GetAvailableQuantityQuery:
    """Query to get available quantity"""
    item_id: str
    location_id: str  # StoreLocation ID


@dataclass
class GetBalancesByItemQuery:
    """Query to get all balances for an item"""
    item_id: str
    location_id: Optional[str] = None  # StoreLocation ID (optional filter)
    status: Optional[str] = None


@dataclass
class GetTransactionHistoryQuery:
    """Query to get transaction history"""
    item_id: str
    location_id: Optional[str] = None  # StoreLocation ID (optional filter)
    skip: int = 0
    limit: int = 100


@dataclass
class GetTransactionsByReferenceQuery:
    """Query to get transactions by reference"""
    reference_type: str
    reference_id: str


@dataclass
class GetTransactionsByDateRangeQuery:
    """Query to get transactions by date range"""
    start_date: datetime
    end_date: datetime
    location_id: Optional[str] = None  # StoreLocation ID (optional filter)


# Units of Measure Queries

@dataclass
class GetUnitOfMeasureByIdQuery:
    """Query to get unit of measure by ID"""
    uom_id: str


@dataclass
class GetUnitOfMeasureByCodeQuery:
    """Query to get unit of measure by code"""
    code: str


@dataclass
class GetAllUnitsOfMeasureQuery:
    """Query to get all units of measure"""
    skip: int = 0
    limit: int = 100
    base_uom: Optional[str] = None


@dataclass
class SearchUnitsOfMeasureQuery:
    """Query to search units of measure"""
    query: str
    skip: int = 0
    limit: int = 100


# Category Queries

@dataclass
class GetCategoryByIdQuery:
    """Query to get category by ID"""
    category_id: str


@dataclass
class GetCategoryByCodeQuery:
    """Query to get category by code"""
    code: str


@dataclass
class GetAllCategoriesQuery:
    """Query to get all categories"""
    parent_category_id: Optional[str] = None
    is_active: Optional[bool] = None
    skip: int = 0
    limit: int = 100


@dataclass
class GetCategoryTreeQuery:
    """Query to get category tree (root categories with full hierarchy)"""
    pass


@dataclass
class GetCategoryHierarchyQuery:
    """Query to get category hierarchy (with ancestors and descendants)"""
    category_id: str


@dataclass
class GetCategoryChildrenQuery:
    """Query to get direct children of a category"""
    category_id: str


# Warehouse Queries

