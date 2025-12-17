"""
Inventory API schemas - Pydantic models for request/response validation
"""
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, Field, field_validator


# Item Schemas

class ItemBase(BaseModel):
    """Base item schema"""
    code: str = Field(..., min_length=1, max_length=100, description="ERP Item Code (required)")
    sku: Optional[str] = Field(None, min_length=1, max_length=100, description="Stock Keeping Unit (optional)")
    name: str = Field(..., min_length=1, max_length=200, description="Item name")
    description: Optional[str] = Field(None, description="Item description")
    item_group: Optional[str] = Field(None, description="Item group (legacy, deprecated - use category_id)")
    category_id: Optional[str] = Field(None, description="Item category ID (hierarchical)")
    item_type: Optional[str] = Field(
        default="product",
        description="Item type (WHAT it is): service, product, raw_material, wip, manufacturing_staging, component, packaging, tool"
    )
    item_usage: Optional[str] = Field(
        default="for_sale",
        description="Item usage (WHO uses it): for_sale, internal_use, both. Separate from item_type. Example: PRODUCT + FOR_SALE = finished good for sale"
    )
    tracking_scope: Optional[str] = Field(
        default="both",
        description="Tracking scope (WHERE tracked): none, inventory_only"
    )
    default_uom: str = Field(..., min_length=1, description="Default unit of measure")
    tracking_requirements: Optional[List[str]] = Field(
        default=None,
        description="Array of tracking types required: lot, serial, expiration, manufacturing_date, supplier_batch, combined"
    )
    perishable: bool = Field(False, description="Is item perishable")
    attributes: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional attributes")
    uom_mappings: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="Context-specific UoM mappings: [{'context': 'purchase', 'uom_code': 'PLT', 'conversion_factor': 100.0}]"
    )


class ItemCreate(ItemBase):
    """Schema for creating an item"""
    pass


class ItemUpdate(BaseModel):
    """Schema for updating an item"""
    code: Optional[str] = Field(None, min_length=1, max_length=100)
    sku: Optional[str] = Field(None, min_length=1, max_length=100)
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    item_group: Optional[str] = None  # Legacy field (deprecated)
    category_id: Optional[str] = Field(None, description="Item category ID (hierarchical)")
    item_type: Optional[str] = Field(
        None,
        description="Item type (WHAT it is): service, product, raw_material, wip, manufacturing_staging, component, packaging, tool"
    )
    item_usage: Optional[str] = Field(
        None,
        description="Item usage (WHO uses it): for_sale, internal_use, both. Separate from item_type."
    )
    tracking_scope: Optional[str] = Field(
        None,
        description="Tracking scope (WHERE tracked): none, inventory_only"
    )
    default_uom: Optional[str] = Field(None, min_length=1)
    tracking_requirements: Optional[List[str]] = Field(
        None,
        description="Array of tracking types required: lot, serial, expiration, manufacturing_date, supplier_batch, combined"
    )
    perishable: Optional[bool] = None
    active: Optional[bool] = None
    attributes: Optional[Dict[str, Any]] = None
    uom_mappings: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="Context-specific UoM mappings: [{'context': 'purchase', 'uom_code': 'PLT', 'conversion_factor': 100.0}]"
    )


class ItemResponse(BaseModel):
    """Schema for item response"""
    id: str
    tenant_id: str
    code: str
    sku: Optional[str]
    name: str
    description: Optional[str]
    item_group: Optional[str]  # Legacy field (deprecated)
    category_id: Optional[str]
    item_type: str
    item_usage: str
    tracking_scope: str
    default_uom: str
    tracking_requirements: List[str]
    perishable: bool
    active: bool
    attributes: Dict[str, Any]
    uom_mappings: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="Context-specific UoM mappings"
    )
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PaginatedItemResponse(BaseModel):
    """Paginated item response"""
    items: List[ItemResponse]
    total: Optional[int] = None
    skip: int
    limit: int
    has_next: bool = False


# Inventory Operation Schemas

class ReceiveInventoryRequest(BaseModel):
    """Request to receive inventory"""
    item_id: str
    location_id: str
    quantity: Decimal = Field(..., gt=0, description="Quantity to receive")
    cost_per_unit: Decimal = Field(..., ge=0, description="Cost per unit")
    expiration_date: Optional[date] = None
    serial_numbers: Optional[List[str]] = Field(None, description="Serial numbers (for serial-tracked items)")
    source_ref_type: Optional[str] = None
    source_ref_id: Optional[str] = None
    idempotency_key: Optional[str] = None


class IssueInventoryRequest(BaseModel):
    """Request to issue inventory"""
    item_id: str
    location_id: str
    quantity: Decimal = Field(..., gt=0, description="Quantity to issue")
    serial_numbers: Optional[List[str]] = Field(None, description="Serial numbers")
    source_ref_type: Optional[str] = None
    source_ref_id: Optional[str] = None
    reason_code: Optional[str] = None
    idempotency_key: Optional[str] = None


class AdjustInventoryRequest(BaseModel):
    """Request to adjust inventory"""
    item_id: str
    location_id: str
    quantity: Decimal = Field(..., gt=0, description="Adjustment quantity")
    adjustment_type: str = Field(..., pattern="^(ADJUST_IN|ADJUST_OUT)$", description="Adjustment type")
    reason_code: Optional[str] = None
    idempotency_key: Optional[str] = None


class MoveInventoryRequest(BaseModel):
    """Request to move inventory"""
    item_id: str
    from_location_id: str
    to_location_id: str
    quantity: Decimal = Field(..., gt=0, description="Quantity to move")
    serial_numbers: Optional[List[str]] = None
    idempotency_key: Optional[str] = None


class ReserveInventoryRequest(BaseModel):
    """Request to reserve inventory"""
    item_id: str
    location_id: str
    quantity: Decimal = Field(..., gt=0)
    source_type: str
    source_id: str
    serial_numbers: Optional[List[str]] = None


class InventoryOperationResponse(BaseModel):
    """Response for inventory operations"""
    transaction_id: str
    balance_id: Optional[str] = None
    quantity: Decimal
    status: str = "success"


# Balance and Transaction Schemas

class InventoryBalanceResponse(BaseModel):
    """Schema for inventory balance response"""
    id: str
    tenant_id: str
    item_id: str
    location_id: str
    tracking_id: Optional[str] = None
    status: str
    quantity: Decimal
    created_at: datetime
    updated_at: datetime
    # Store Location information
    location_code: Optional[str] = None
    location_name: Optional[str] = None
    location_type: Optional[str] = None
    
    class Config:
        from_attributes = True


class TransactionResponse(BaseModel):
    """Schema for inventory transaction response"""
    id: str
    tenant_id: str
    occurred_at: datetime
    type: str
    item_id: str
    quantity: Optional[Decimal]
    uom: str
    location_id: Optional[str] = None
    tracking_id: Optional[str] = None
    cost_per_unit: Optional[Decimal]
    source_ref_type: Optional[str]
    source_ref_id: Optional[str]
    reason_code: Optional[str]
    actor_id: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


# Units of Measure Schemas

class UnitOfMeasureBase(BaseModel):
    """Base unit of measure schema"""
    code: str = Field(..., min_length=1, max_length=50, description="UOM code (e.g., 'KG', 'LB')")
    name: str = Field(..., min_length=1, max_length=200, description="UOM name (e.g., 'Kilogram', 'Pound')")
    base_uom: str = Field(..., min_length=1, max_length=50, description="Base UOM code for conversion")
    conversion_factor: Decimal = Field(..., gt=0, description="Conversion factor to base UOM")


class UnitOfMeasureCreate(UnitOfMeasureBase):
    """Schema for creating a unit of measure"""
    pass


class UnitOfMeasureUpdate(BaseModel):
    """Schema for updating a unit of measure"""
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    base_uom: Optional[str] = Field(None, min_length=1, max_length=50)
    conversion_factor: Optional[Decimal] = Field(None, gt=0)


class UnitOfMeasureResponse(BaseModel):
    """Schema for unit of measure response"""
    id: str
    tenant_id: str
    code: str
    name: str
    base_uom: str
    conversion_factor: Decimal
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PaginatedUnitOfMeasureResponse(BaseModel):
    """Paginated unit of measure response"""
    items: List[UnitOfMeasureResponse]
    total: Optional[int] = None
    skip: int
    limit: int
    has_next: bool = False


# Category Schemas

class CategoryBase(BaseModel):
    """Base category schema"""
    code: str = Field(..., min_length=1, max_length=50, description="Category code (unique within tenant)")
    name: str = Field(..., min_length=1, max_length=200, description="Category name")
    description: Optional[str] = Field(None, max_length=500, description="Category description")
    parent_category_id: Optional[str] = Field(None, description="Parent category ID for hierarchy")
    sort_order: int = Field(0, ge=0, description="Sort order")
    is_active: bool = Field(True, description="Is category active")
    attributes: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional attributes")


class CategoryCreate(CategoryBase):
    """Schema for creating a category"""
    pass


class CategoryUpdate(BaseModel):
    """Schema for updating a category"""
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    parent_category_id: Optional[str] = None
    sort_order: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None
    attributes: Optional[Dict[str, Any]] = None


class CategoryResponse(BaseModel):
    """Schema for category response"""
    id: str
    tenant_id: str
    code: str
    name: str
    description: Optional[str]
    parent_category_id: Optional[str]
    level: int
    sort_order: int
    is_active: bool
    attributes: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CategoryTreeResponse(CategoryResponse):
    """Schema for category tree response"""
    children: List["CategoryTreeResponse"] = Field(default_factory=list)
    children_count: int = 0
    has_children: bool = False


CategoryTreeResponse.model_rebuild()


