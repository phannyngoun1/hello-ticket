"""
Inventory commands for CQRS pattern
"""
from dataclasses import dataclass
from decimal import Decimal
from typing import Optional, List
from datetime import date


@dataclass
class CreateItemCommand:
    """Command to create a new item"""
    name: str
    default_uom: str
    code: str
    sku: Optional[str] = None
    description: Optional[str] = None
    item_group: Optional[str] = None  # Legacy field (deprecated)
    category_id: Optional[str] = None  # Hierarchical category reference
    item_type: Optional[str] = None  # ItemTypeEnum value
    item_usage: Optional[str] = None  # ItemUsageEnum value (for_sale, internal_use, both)
    tracking_scope: Optional[str] = None  # TrackingScopeEnum value
    tracking_requirements: Optional[List[str]] = None
    perishable: bool = False
    attributes: Optional[dict] = None
    uom_mappings: Optional[List[dict]] = None  # List of {'context': str, 'uom_code': str, 'conversion_factor': Decimal, 'is_primary': bool}


@dataclass
class UpdateItemCommand:
    """Command to update an existing item"""
    item_id: str
    code: Optional[str] = None
    sku: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    item_group: Optional[str] = None  # Legacy field (deprecated)
    category_id: Optional[str] = None  # Hierarchical category reference
    item_type: Optional[str] = None  # ItemTypeEnum value
    item_usage: Optional[str] = None  # ItemUsageEnum value (for_sale, internal_use, both)
    tracking_scope: Optional[str] = None  # TrackingScopeEnum value
    default_uom: Optional[str] = None
    tracking_requirements: Optional[List[str]] = None
    perishable: Optional[bool] = None
    active: Optional[bool] = None
    attributes: Optional[dict] = None
    uom_mappings: Optional[List[dict]] = None  # List of {'context': str, 'uom_code': str, 'conversion_factor': Decimal, 'is_primary': bool}


@dataclass
class DeleteItemCommand:
    """Command to delete an item"""
    item_id: str


@dataclass
class ReceiveInventoryCommand:
    """Command to receive inventory"""
    item_id: str
    location_id: str  # StoreLocation ID
    quantity: Decimal
    cost_per_unit: Decimal
    expiration_date: Optional[date] = None
    manufacturing_date: Optional[date] = None
    supplier_batch: Optional[str] = None
    serial_numbers: Optional[list[str]] = None
    source_ref_type: Optional[str] = None
    source_ref_id: Optional[str] = None
    idempotency_key: Optional[str] = None


@dataclass
class IssueInventoryCommand:
    """Command to issue inventory"""
    item_id: str
    location_id: str  # StoreLocation ID
    quantity: Decimal
    serial_numbers: Optional[list[str]] = None
    source_ref_type: Optional[str] = None
    source_ref_id: Optional[str] = None
    reason_code: Optional[str] = None
    idempotency_key: Optional[str] = None


@dataclass
class AdjustInventoryCommand:
    """Command to adjust inventory"""
    item_id: str
    location_id: str  # StoreLocation ID
    quantity: Decimal
    adjustment_type: str  # ADJUST_IN or ADJUST_OUT
    reason_code: Optional[str] = None
    idempotency_key: Optional[str] = None


@dataclass
class MoveInventoryCommand:
    """Command to move inventory between locations"""
    item_id: str
    from_location_id: str  # Source StoreLocation ID
    to_location_id: str  # Target StoreLocation ID
    quantity: Decimal
    serial_numbers: Optional[list[str]] = None
    idempotency_key: Optional[str] = None


@dataclass
class ReserveInventoryCommand:
    """Command to reserve inventory"""
    item_id: str
    location_id: str  # StoreLocation ID
    quantity: Decimal
    source_type: str
    source_id: str
    serial_numbers: Optional[list[str]] = None


@dataclass
class ReleaseReservationCommand:
    """Command to release inventory reservation"""
    reservation_id: str


# Units of Measure Commands

@dataclass
class CreateUnitOfMeasureCommand:
    """Command to create a new unit of measure"""
    code: str
    name: str
    base_uom: str
    conversion_factor: Decimal


@dataclass
class UpdateUnitOfMeasureCommand:
    """Command to update an existing unit of measure"""
    uom_id: str
    code: Optional[str] = None
    name: Optional[str] = None
    base_uom: Optional[str] = None
    conversion_factor: Optional[Decimal] = None


@dataclass
class DeleteUnitOfMeasureCommand:
    """Command to delete a unit of measure"""
    uom_id: str


# Category Commands

@dataclass
class CreateCategoryCommand:
    """Command to create a new item category"""
    code: str
    name: str
    description: Optional[str] = None
    parent_category_id: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True
    attributes: Optional[dict] = None


@dataclass
class UpdateCategoryCommand:
    """Command to update an existing item category"""
    category_id: str
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    parent_category_id: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None
    attributes: Optional[dict] = None


@dataclass
class DeleteCategoryCommand:
    """Command to delete an item category"""
    category_id: str


# Warehouse Commands

