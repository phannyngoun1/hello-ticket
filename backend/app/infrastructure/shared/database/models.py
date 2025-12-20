"""
SQLModel database models - OPERATIONAL database ONLY

Security: This database contains ONLY business/operational data
Authentication data (users, sessions) and platform data (tenants, subscriptions) 
are in a SEPARATE platform database

See: platform_models.py for platform-level data (tenants, subscriptions, users, sessions)
"""
from datetime import datetime, timezone, timedelta, date
from typing import Optional, List, Dict, Any
from sqlmodel import SQLModel, Field, create_engine, Index, MetaData
from sqlalchemy import Column, JSON, ARRAY, String, DateTime, Date, text, Enum as SAEnum
from sqlalchemy.dialects.postgresql import INET, JSONB
from sqlalchemy.dialects.postgresql import ARRAY as PG_ARRAY
from decimal import Decimal
from app.shared.utils import generate_id
from app.shared.enums import ItemTypeEnum, ItemUsageEnum, TrackingScopeEnum, UoMContextEnum, VehicleTypeEnum, VehicleStatusEnum

# Create separate metadata for operational models to avoid mixing with platform models
operational_metadata = MetaData()


# ============================================================================
# INVENTORY MODULE - MASTER DATA
# ============================================================================

class ItemCategoryModel(SQLModel, table=True):
    """Hierarchical item category/group database model with nested support"""
    __tablename__ = "item_categories"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    code: str  # Unique code within tenant (e.g., "ELECTRONICS", "COMPUTERS")
    name: str  # Display name (e.g., "Electronics", "Computers & Accessories")
    description: Optional[str] = None
    parent_category_id: Optional[str] = Field(
        default=None,
        index=True,
        foreign_key="item_categories.id"
    )
    level: int = Field(default=0, index=True)  # Hierarchy level (0 = root, 1 = child, etc.)
    sort_order: int = Field(default=0, index=True)  # Display order within siblings
    is_active: bool = Field(default=True, index=True)
    attributes: dict = Field(default_factory=dict, sa_column=Column(JSONB))  # Flexible attributes
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        # Unique code per tenant (within same parent if parent exists)
        Index('ix_item_categories_tenant_code', 'tenant_id', 'code', unique=True),
        # Hierarchy queries
        Index('ix_item_categories_parent', 'tenant_id', 'parent_category_id'),
        # Level queries (for finding root categories)
        Index('ix_item_categories_level', 'tenant_id', 'level'),
        # Active categories
        Index('ix_item_categories_active', 'tenant_id', 'is_active'),
        # Attributes search
        Index('ix_item_categories_attributes', 'attributes', postgresql_using='gin'),
    )


class ItemModel(SQLModel, table=True):
    """Item master database model"""
    __tablename__ = "items"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    code: Optional[str] = Field(default=None, index=True)
    sku: Optional[str] = Field(default=None, index=True)
    name: str
    description: Optional[str] = None
    # Hierarchical category reference (replaces simple item_group string)
    category_id: Optional[str] = Field(
        default=None,
        index=True,
        foreign_key="item_categories.id"
    )
    # Legacy item_group field for backward compatibility (deprecated, use category_id)
    item_group: Optional[str] = Field(default=None, index=True)
    
    # Item classification - WHAT the item is
    item_type: str = Field(
        default=ItemTypeEnum.PRODUCT.value,
        sa_column=Column(SAEnum(ItemTypeEnum, native_enum=False), index=True)
    )
    
    # Item usage/purpose - WHO uses the item (separate from item_type)
    # Examples: PRODUCT + FOR_SALE = finished good for sale
    #           PRODUCT + INTERNAL_USE = finished good for internal use only
    #           COMPONENT + FOR_SALE = component sold separately
    #           COMPONENT + INTERNAL_USE = component used in assembly only
    item_usage: str = Field(
        default=ItemUsageEnum.FOR_SALE.value,
        sa_column=Column(SAEnum(ItemUsageEnum, native_enum=False), index=True)
    )
    
    # Tracking scope: where this item should be tracked
    tracking_scope: str = Field(
        default=TrackingScopeEnum.INVENTORY_ONLY.value,
        sa_column=Column(SAEnum(TrackingScopeEnum, native_enum=False), index=True)
    )
    
    # Default/base UoM
    default_uom: str
    
    # Tracking requirements: array of tracking types required for this item
    # Examples: ["serial"], ["serial", "expiration"], ["expiration"]
    # Uses TrackingTypeEnum values: serial, expiration, manufacturing_date, supplier_batch, combined
    tracking_requirements: List[str] = Field(
        default_factory=list,
        sa_column=Column(PG_ARRAY(String))
    )
    perishable: bool = Field(default=False)
    active: bool = Field(default=True, index=True)
    attributes: dict = Field(default_factory=dict, sa_column=Column(JSONB))
    
    # Audit fields
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        # Partial unique index: SKU must be unique per tenant when provided, but NULL is allowed
        Index('ix_items_tenant_sku', 'tenant_id', 'sku', unique=True, postgresql_where=text('sku IS NOT NULL')),
        # Partial unique index: code must be unique per tenant when provided
        Index('ix_items_tenant_code', 'tenant_id', 'code', unique=True, postgresql_where=text('code IS NOT NULL')),
        Index('ix_items_tenant_category', 'tenant_id', 'category_id'),
        Index('ix_items_tenant_group', 'tenant_id', 'item_group'),  # Legacy index
        Index('ix_items_tenant_active', 'tenant_id', 'active'),
        Index('ix_items_tenant_type', 'tenant_id', 'item_type'),
        Index('ix_items_tenant_usage', 'tenant_id', 'item_usage'),
        Index('ix_items_tenant_scope', 'tenant_id', 'tracking_scope'),
        Index('ix_items_attributes', 'attributes', postgresql_using='gin'),
    )


class UnitOfMeasureModel(SQLModel, table=True):
    """Unit of measure database model"""
    __tablename__ = "units_of_measure"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    code: str = Field(index=True)
    name: str
    base_uom: str  # Reference to base unit code
    conversion_factor: Decimal
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        Index('ix_uom_tenant_code', 'tenant_id', 'code', unique=True),
    )


class BarcodeModel(SQLModel, table=True):
    """Barcode database model"""
    __tablename__ = "barcodes"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    item_id: str = Field(index=True)
    barcode: str = Field(index=True)
    uom_code: Optional[str] = None  # If barcode is for specific UoM
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        Index('ix_barcodes_tenant_code', 'tenant_id', 'barcode', unique=True),
        Index('ix_barcodes_item', 'tenant_id', 'item_id'),
    )


class ItemSupplierModel(SQLModel, table=True):
    """Item supplier database model"""
    __tablename__ = "item_suppliers"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    item_id: str = Field(index=True)
    supplier_id: str = Field(index=True)
    supplier_sku: Optional[str] = None
    lead_time_days: Optional[int] = None
    min_order_qty: Optional[Decimal] = None
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        Index('ix_item_suppliers_item', 'tenant_id', 'item_id'),
        Index('ix_item_suppliers_supplier', 'tenant_id', 'supplier_id'),
        Index('ix_item_suppliers_unique', 'tenant_id', 'item_id', 'supplier_id', unique=True),
    )


class ItemUoMMappingModel(SQLModel, table=True):
    """Context-specific UoM mapping for items"""
    __tablename__ = "item_uom_mappings"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    item_id: str = Field(index=True)
    context: str = Field(
        sa_column=Column(SAEnum(UoMContextEnum, native_enum=False), index=True)
    )
    uom_code: str  # UoM code for this context
    conversion_factor: Decimal = Field(default=1.0)  # Conversion from default_uom to context_uom
    is_primary: bool = Field(default=False, index=True)  # Primary UoM for this context
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        # Unique: one UoM code per context per item (allows multiple UOMs per context)
        Index('ix_item_uom_item_context_uom', 'tenant_id', 'item_id', 'context', 'uom_code', unique=True),
        Index('ix_item_uom_item', 'tenant_id', 'item_id'),
        Index('ix_item_uom_context', 'tenant_id', 'context'),
    )


# ============================================================================
# INVENTORY MODULE - IDENTIFICATION
# ============================================================================

class LotModel(SQLModel, table=True):
    """Lot tracking database model"""
    __tablename__ = "lots"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    item_id: str = Field(index=True)
    lot_number: str
    expiration_date: Optional[date] = None
    status: str = Field(default="available", index=True)
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        Index('ix_lots_tenant_item_lot', 'tenant_id', 'item_id', 'lot_number', unique=True),
        Index('ix_lots_status', 'tenant_id', 'status'),
        Index('ix_lots_expiration', 'tenant_id', 'expiration_date'),
    )


class SerialModel(SQLModel, table=True):
    """Serial number tracking database model"""
    __tablename__ = "serials"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    item_id: str = Field(index=True)
    serial_number: str
    status: str = Field(default="available", index=True)
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        Index('ix_serials_tenant_item_serial', 'tenant_id', 'item_id', 'serial_number', unique=True),
        Index('ix_serials_status', 'tenant_id', 'status'),
    )


class InventoryTrackingModel(SQLModel, table=True):
    """Unified inventory tracking database model with type polymorphism"""
    __tablename__ = "inventory_tracking"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    item_id: str = Field(index=True)
    tracking_type: str = Field(index=True)  # LOT, SERIAL, EXPIRATION, etc.
    identifier: str  # lot_number, serial_number, etc.
    parent_tracking_id: Optional[str] = Field(
        default=None,
        index=True,
        foreign_key="inventory_tracking.id"
    )
    
    # Type-specific attributes (nullable, used based on type)
    expiration_date: Optional[date] = None
    manufacturing_date: Optional[date] = None
    supplier_batch: Optional[str] = None
    status: str = Field(default="available", index=True)
    attributes: dict = Field(default_factory=dict, sa_column=Column(JSONB))  # Flexible
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        # Unique identifier per type within item
        Index('ix_tracking_tenant_item_type_id', 'tenant_id', 'item_id', 'tracking_type', 'identifier', unique=True),
        # Parent relationships
        Index('ix_tracking_parent', 'tenant_id', 'parent_tracking_id'),
        # Type queries
        Index('ix_tracking_type', 'tenant_id', 'tracking_type'),
        # Expiration queries
        Index('ix_tracking_expiration', 'tenant_id', 'expiration_date'),
        # Status queries
        Index('ix_tracking_status', 'tenant_id', 'status'),
    )


# ============================================================================
# INVENTORY MODULE - BALANCES & RESERVATIONS
# ============================================================================

class InventoryBalanceModel(SQLModel, table=True):
    """Inventory balance database model"""
    __tablename__ = "inventory_balances"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    item_id: str = Field(index=True)
    location_id: str = Field(index=True, foreign_key="store_locations.id")  # Unified location reference (required)
    tracking_id: Optional[str] = Field(default=None, index=True, foreign_key="inventory_tracking.id")  # Unified tracking reference
    status: str = Field(default="available", index=True)
    quantity: Decimal
    version: int = Field(default=0)  # For optimistic locking
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        Index('ix_inv_balance_lookup', 'tenant_id', 'item_id', 'location_id', 'status'),
        Index('ix_inv_balance_location', 'tenant_id', 'location_id'),
        Index('ix_inv_balance_tracking', 'tenant_id', 'tracking_id'),
    )


class InventoryReservationModel(SQLModel, table=True):
    """Inventory reservation database model"""
    __tablename__ = "inventory_reservations"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    item_id: str = Field(index=True)
    warehouse_id: str = Field(index=True)
    lot_id: Optional[str] = None
    serial_id: Optional[str] = None
    source_type: str
    source_id: str
    quantity: Decimal
    status: str = Field(default="active", index=True)
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        Index('ix_inv_reservations_source', 'tenant_id', 'source_type', 'source_id'),
        Index('ix_inv_reservations_item', 'tenant_id', 'item_id', 'warehouse_id'),
    )


# ============================================================================
# INVENTORY MODULE - TRANSACTIONS
# ============================================================================

class InventoryTransactionModel(SQLModel, table=True):
    """Inventory transaction database model (immutable ledger)"""
    __tablename__ = "inventory_transactions"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    occurred_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), index=True)
    )
    type: str  # RECEIVE, ISSUE, MOVE, TRANSFER_OUT, TRANSFER_IN, etc.
    item_id: str = Field(index=True)
    quantity: Decimal
    uom: str
    warehouse_id: Optional[str] = None  # Deprecated - use location_id
    bin_id: Optional[str] = None  # Deprecated - use location_id
    location_id: Optional[str] = Field(default=None, index=True, foreign_key="store_locations.id")  # Unified location reference
    lot_id: Optional[str] = None  # Deprecated - use tracking_id
    serial_id: Optional[str] = None  # Deprecated - use tracking_id
    tracking_id: Optional[str] = Field(default=None, index=True, foreign_key="inventory_tracking.id")  # Unified tracking reference
    cost_per_unit: Optional[Decimal] = None
    source_ref_type: Optional[str] = None
    source_ref_id: Optional[str] = None
    reason_code: Optional[str] = None
    actor_id: Optional[str] = None
    idempotency_key: Optional[str] = Field(default=None)
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        Index('ix_inv_tx_item', 'tenant_id', 'item_id', 'occurred_at'),
        Index('ix_inv_tx_date', 'tenant_id', 'occurred_at'),
        Index('ix_inv_tx_idempotency', 'tenant_id', 'idempotency_key', unique=True),
    )


# ============================================================================
# INVENTORY MODULE - COSTING
# ============================================================================

class CostLayerModel(SQLModel, table=True):
    """Cost layer database model (for FIFO/LIFO)"""
    __tablename__ = "cost_layers"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    item_id: str = Field(index=True)
    warehouse_id: str
    lot_id: Optional[str] = None
    received_tx_id: str  # Reference to receiving transaction
    quantity_on_hand: Decimal
    cost_per_unit: Decimal
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        Index('ix_cost_layers_lookup', 'tenant_id', 'item_id', 'warehouse_id'),
    )


class StandardCostModel(SQLModel, table=True):
    """Standard cost database model"""
    __tablename__ = "standard_costs"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    item_id: str = Field(index=True)
    warehouse_id: Optional[str] = None
    effective_date: date = Field(sa_column=Column(Date))
    standard_cost_per_unit: Decimal
    currency: str = Field(default="USD")
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    version: int = Field(default=0)
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        Index('ix_standard_costs_lookup', 'tenant_id', 'item_id', 'warehouse_id', 'effective_date'),
        Index('ix_standard_costs_unique', 'tenant_id', 'item_id', 'warehouse_id', 'effective_date', unique=True),
    )


class CostVarianceModel(SQLModel, table=True):
    """Cost variance database model"""
    __tablename__ = "cost_variances"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    variance_type: str
    source_tx_id: Optional[str] = None
    source_ref_type: Optional[str] = None
    source_ref_id: Optional[str] = None
    item_id: str = Field(index=True)
    warehouse_id: str
    standard_cost_per_unit: Decimal
    actual_cost_per_unit: Decimal
    quantity: Decimal
    variance_amount: Decimal
    account_code: Optional[str] = None
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        Index('ix_cost_variances_tx', 'tenant_id', 'source_tx_id'),
        Index('ix_cost_variances_item', 'tenant_id', 'item_id', 'warehouse_id', 'created_at'),
        Index('ix_cost_variances_type', 'tenant_id', 'variance_type', 'created_at'),
    )


# ============================================================================
# PURCHASING MODULE
# ============================================================================

# Unified Address Management (inspired by SAP ADRC/ADCP)


class AddressModel(SQLModel, table=True):
    """Unified address database model for all entities (inspired by SAP ADRC)."""

    __tablename__ = "addresses"
    metadata = operational_metadata

    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    name: Optional[str] = None  # Optional name/label for the address
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    notes: Optional[str] = None
    version: int = Field(default=0)

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True)),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True)),
    )

    __table_args__ = (
        Index("ix_addresses_tenant_id", "tenant_id"),
    )


class AddressAssignmentModel(SQLModel, table=True):
    """Address assignment database model for polymorphic relationships (inspired by SAP ADCP)."""

    __tablename__ = "address_assignments"
    metadata = operational_metadata

    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    address_id: str = Field(index=True, foreign_key="addresses.id")
    entity_type: str = Field(index=True)  # "vendor", "company", "customer", "user"
    entity_id: str = Field(index=True)
    address_type: str = Field(index=True)  # "shipping", "billing", "contact", "default"
    is_primary: bool = Field(default=False, index=True)
    version: int = Field(default=0)

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True)),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True)),
    )

    __table_args__ = (
        Index("ix_address_assignments_tenant_entity", "tenant_id", "entity_type", "entity_id"),
        Index("ix_address_assignments_tenant_address", "tenant_id", "address_id"),
        Index("ix_address_assignments_entity_type", "tenant_id", "entity_type", "entity_id", "address_type"),
        Index("ix_address_assignments_primary", "tenant_id", "entity_type", "entity_id", "address_type", "is_primary"),
    )


class VendorModel(SQLModel, table=True):
    """Vendor master data model."""

    __tablename__ = "vendors"
    metadata = operational_metadata

    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    code: str = Field(index=True)
    name: str
    legal_name: Optional[str] = None
    contact_email: Optional[str] = Field(default=None, index=True)
    phone: Optional[str] = None
    phone1: Optional[str] = None
    phone2: Optional[str] = None
    # Note: address_id and billing_address_id are kept for backward compatibility during migration
    # They will be replaced by address_assignments table
    address_id: Optional[str] = Field(default=None)  # Will reference addresses.id via assignments
    billing_address_id: Optional[str] = Field(default=None)  # Will reference addresses.id via assignments
    payment_terms: Optional[str] = None
    currency: Optional[str] = Field(
        default=None, sa_column=Column(String(3), nullable=True)
    )
    notes: Optional[str] = None
    remarks: Optional[str] = None
    is_active: bool = Field(default=True, index=True)
    deactivated_at: Optional[datetime] = Field(
        default=None, sa_column=Column(DateTime(timezone=True))
    )
    version: int = Field(default=0)

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True)),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True)),
    )

    __table_args__ = (
        Index("ix_vendors_tenant_code", "tenant_id", "code", unique=True),
        Index("ix_vendors_tenant_active", "tenant_id", "is_active"),
        Index(
            "ix_vendors_tenant_contact_email",
            "tenant_id",
            "contact_email",
            postgresql_where=text("contact_email IS NOT NULL"),
        ),
    )


class PurchaseOrderModel(SQLModel, table=True):
    """Purchase order header database model"""
    __tablename__ = "purchase_orders"
    metadata = operational_metadata

    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    supplier_id: str = Field(index=True)
    warehouse_id: Optional[str] = Field(default=None, index=True, foreign_key="store_locations.id")
    po_number: Optional[str] = Field(default=None, index=True)
    status: str = Field(index=True)
    currency: str = Field(default="USD")
    expected_date: Optional[date] = Field(default=None, sa_column=Column(Date, nullable=True))
    submitted_at: Optional[datetime] = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    submitted_by: Optional[str] = None
    approved_at: Optional[datetime] = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    approved_by: Optional[str] = None
    closed_at: Optional[datetime] = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    cancelled_at: Optional[datetime] = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    reference: Optional[str] = None
    notes: Optional[str] = None
    created_by: Optional[str] = None
    payment_terms: Optional[str] = None
    shipping_address_id: Optional[str] = Field(default=None, foreign_key="addresses.id")
    version: int = Field(default=0)

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )

    __table_args__ = (
        Index('ix_purchase_orders_tenant_status', 'tenant_id', 'status'),
        Index('ix_purchase_orders_tenant_supplier', 'tenant_id', 'supplier_id'),
        Index('ix_purchase_orders_tenant_wh', 'tenant_id', 'warehouse_id'),
        Index(
            'ix_purchase_orders_number_unique',
            'tenant_id',
            'po_number',
            unique=True,
            postgresql_where=text('po_number IS NOT NULL')
        ),
    )


class PurchaseOrderLineModel(SQLModel, table=True):
    """Purchase order line database model"""
    __tablename__ = "purchase_order_lines"
    metadata = operational_metadata

    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    purchase_order_id: str = Field(index=True, foreign_key="purchase_orders.id")
    item_id: str = Field(index=True)
    item_code: Optional[str] = Field(default=None)
    item_name: Optional[str] = Field(default=None)
    description: Optional[str] = None
    quantity: Decimal
    uom: str
    unit_price: Decimal
    status: str = Field(index=True)
    expected_date: Optional[date] = Field(default=None, sa_column=Column(Date, nullable=True))
    received_quantity: Decimal = Field(default=Decimal('0'))
    cancelled_quantity: Decimal = Field(default=Decimal('0'))

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )

    __table_args__ = (
        Index('ix_po_lines_purchase_order', 'tenant_id', 'purchase_order_id'),
        Index('ix_po_lines_item', 'tenant_id', 'item_id'),
    )


class GoodsReceiptModel(SQLModel, table=True):
    """Goods receipt header database model"""
    __tablename__ = "goods_receipts"
    metadata = operational_metadata

    id: str = Field(primary_key=True, default_factory=generate_id)
    code: str = Field(index=True)
    tenant_id: str = Field(index=True)
    location_id: str = Field(index=True, foreign_key="store_locations.id")
    vendor_id: Optional[str] = Field(default=None, index=True, foreign_key="vendors.id")
    purchase_order_id: Optional[str] = Field(default=None, index=True, foreign_key="purchase_orders.id")
    receipt_number: Optional[str] = Field(default=None, index=True)
    delivery_note: Optional[str] = Field(default=None, index=True)
    bill_of_lading: Optional[str] = Field(default=None, index=True)
    status: str = Field(index=True)
    received_at: Optional[datetime] = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    closed_at: Optional[datetime] = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    cancelled_at: Optional[datetime] = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    notes: Optional[str] = None
    version: int = Field(default=0)

    is_deleted: bool = Field(default=False, index=True)
    deleted_at: Optional[datetime] = Field(default=None, sa_column=Column(DateTime(timezone=True)))


    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )

    __table_args__ = (
        Index('ix_goods_receipts_tenant_status', 'tenant_id', 'status'),
        Index('ix_goods_receipts_po', 'tenant_id', 'purchase_order_id'),
        Index('ix_goods_receipts_location', 'tenant_id', 'location_id'),
        Index('ix_goods_receipts_vendor', 'tenant_id', 'vendor_id'),
    )


class GoodsReceiptLineModel(SQLModel, table=True):
    """Goods receipt line database model"""
    __tablename__ = "goods_receipt_lines"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    goods_receipt_id: str = Field(index=True, foreign_key="goods_receipts.id")
    purchase_order_line_id: Optional[str] = Field(default=None, index=True, foreign_key="purchase_order_lines.id")
    item_id: str = Field(index=True)
    quantity: Decimal
    uom: str
    cost: Optional[Decimal] = Field(default=None)
    landing_cost: Optional[Decimal] = Field(default=None)
    status: str = Field(index=True)
    lot_number: Optional[str] = None
    expiration_date: Optional[date] = None
    manufacturing_date: Optional[date] = None
    supplier_batch: Optional[str] = None
    serial_numbers: Optional[List[str]] = Field(default=None, sa_column=Column(PG_ARRAY(String)))
    store_location_id: Optional[str] = Field(default=None, index=True, foreign_key="store_locations.id")
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        Index('ix_goods_receipt_lines_receipt', 'tenant_id', 'goods_receipt_id'),
        Index('ix_goods_receipt_lines_item', 'tenant_id', 'item_id'),
    )


# ============================================================================
# SALES MODULE

class TestBasicModel(SQLModel, table=True):
    """TestBasic master data database model"""
    __tablename__ = "test_basics"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    code: str = Field(index=True)
    name: str
    is_active: bool = Field(default=True, index=True)
    is_deleted: bool = Field(default=False, index=True)  # Soft delete flag
    version: int = Field(default=0)
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    deleted_at: Optional[datetime] = Field(  # When soft deleted
        default=None,
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        Index('ix_test_basics_tenant_code', 'tenant_id', 'code', unique=True),
        Index('ix_test_basics_tenant_active', 'tenant_id', 'is_active'),
        Index('ix_test_basics_tenant_deleted', 'tenant_id', 'is_deleted'),  # For filtering deleted records
    )



class TestTreeModel(SQLModel, table=True):
    """TestTree master data database model"""
    __tablename__ = "test_trees"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    code: str = Field(index=True)
    name: str
    parent_test_tree_id: Optional[str] = Field(
        default=None,
        foreign_key="test_trees.id",
        index=True,
        description="Parent test tree reference for hierarchy"
    )
    level: int = Field(default=0, index=True)
    sort_order: int = Field(default=0, description="Display ordering among siblings")
    is_active: bool = Field(default=True, index=True)
    is_deleted: bool = Field(default=False, index=True)  # Soft delete flag
    version: int = Field(default=0)
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    deleted_at: Optional[datetime] = Field(  # When soft deleted
        default=None,
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        Index('ix_test_trees_tenant_code', 'tenant_id', 'code', unique=True),
        Index('ix_test_trees_tenant_active', 'tenant_id', 'is_active'),
        Index('ix_test_trees_tenant_deleted', 'tenant_id', 'is_deleted'),  # For filtering deleted records
        Index('ix_test_trees_parent', 'tenant_id', 'parent_test_tree_id'),
    )



class TestTreeBackendModel(SQLModel, table=True):
    """TestTreeBackend master data database model"""
    __tablename__ = "test_tree_backends"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    code: str = Field(index=True)
    name: str
    description: str
    is_active: bool = Field(default=True, index=True)
    is_deleted: bool = Field(default=False, index=True)  # Soft delete flag
    version: int = Field(default=0)
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    deleted_at: Optional[datetime] = Field(  # When soft deleted
        default=None,
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        Index('ix_test_tree_backends_tenant_code', 'tenant_id', 'code', unique=True),
        Index('ix_test_tree_backends_tenant_active', 'tenant_id', 'is_active'),
        Index('ix_test_tree_backends_tenant_deleted', 'tenant_id', 'is_deleted'),  # For filtering deleted records
    )



class CustomerGroupModel(SQLModel, table=True):
    """CustomerGroup master data database model"""
    __tablename__ = "customer_groups"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    code: str = Field(index=True)
    name: str
    parent_id: Optional[str] = Field(
        default=None,
        foreign_key="customer_groups.id",
        index=True,
        description="Parent customer group reference for hierarchy"
    )
    level: int = Field(default=0, index=True)
    sort_order: int = Field(default=0, description="Display ordering among siblings")
    is_active: bool = Field(default=True, index=True)
    is_deleted: bool = Field(default=False, index=True)  # Soft delete flag
    version: int = Field(default=0)
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    deleted_at: Optional[datetime] = Field(  # When soft deleted
        default=None,
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        Index('ix_customer_groups_tenant_code', 'tenant_id', 'code', unique=True),
        Index('ix_customer_groups_tenant_active', 'tenant_id', 'is_active'),
        Index('ix_customer_groups_tenant_deleted', 'tenant_id', 'is_deleted'),  # For filtering deleted records
        Index('ix_customer_groups_parent', 'tenant_id', 'parent_id'),
    )



class TestEntityModel(SQLModel, table=True):
    """TestEntity master data database model"""
    __tablename__ = "test_entities"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    code: str = Field(index=True)
    name: str
    description: str
    price: Decimal
    is_active: bool = Field(default=True, index=True)
    deactivated_at: Optional[datetime] = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    version: int = Field(default=0)
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        Index('ix_test_entities_tenant_code', 'tenant_id', 'code', unique=True),
        Index('ix_test_entities_tenant_active', 'tenant_id', 'is_active'),
    )



class TestModel(SQLModel, table=True):
    """Test master data database model"""
    __tablename__ = "tests"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    code: str = Field(index=True)
    name: str
    is_active: bool = Field(default=True, index=True)
    is_deleted: bool = Field(default=False, index=True)  # Soft delete flag
    deactivated_at: Optional[datetime] = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    version: int = Field(default=0)
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    deleted_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        Index('ix_tests_tenant_code', 'tenant_id', 'code', unique=True),
        Index('ix_tests_tenant_active', 'tenant_id', 'is_active'),
        Index('ix_tests_tenant_deleted', 'tenant_id', 'is_deleted'),  # For filtering deleted records
    )



class CustomerTypeModel(SQLModel, table=True):
    """Customer type master data database model"""
    __tablename__ = "customer_types"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    code: str = Field(index=True)
    name: str
    is_active: bool = Field(default=True, index=True)
    is_deleted: bool = Field(default=False, index=True)  # Soft delete flag
    version: int = Field(default=0)
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    deleted_at: Optional[datetime] = Field(  # When soft deleted
        default=None,
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        Index('ix_customer_types_tenant_code', 'tenant_id', 'code', unique=True),
        Index('ix_customer_types_tenant_active', 'tenant_id', 'is_active'),
        Index('ix_customer_types_tenant_deleted', 'tenant_id', 'is_deleted'),  # For filtering deleted records
    )


# ============================================================================
# WAREHOUSE MODULE

class EmployeeModel(SQLModel, table=True):
    """Employee master data database model"""
    __tablename__ = "employees"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    code: str = Field(index=True)
    name: str
    is_active: bool = Field(default=True, index=True)
    is_deleted: bool = Field(default=False, index=True)  # Soft delete flag
    version: int = Field(default=0)
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    deleted_at: Optional[datetime] = Field(  # When soft deleted
        default=None,
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        Index('ix_employees_tenant_code', 'tenant_id', 'code', unique=True),
        Index('ix_employees_tenant_active', 'tenant_id', 'is_active'),
        Index('ix_employees_tenant_deleted', 'tenant_id', 'is_deleted'),  # For filtering deleted records
    )


# - MASTER DATA
# ============================================================================

class VehicleModel(SQLModel, table=True):
    """Vehicle master data database model"""
    __tablename__ = "vehicles"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    code: str = Field(index=True)
    name: str
    vehicle_type: str = Field(
        sa_column=Column(SAEnum(VehicleTypeEnum, native_enum=False), index=True)
    )
    status: str = Field(
        default=VehicleStatusEnum.AVAILABLE.value,
        sa_column=Column(SAEnum(VehicleStatusEnum, native_enum=False), index=True)
    )
    capacity_load_weight: Optional[float] = Field(default=None)
    capacity_pallet_count: Optional[int] = Field(default=None)
    is_active: bool = Field(default=True, index=True)
    is_deleted: bool = Field(default=False, index=True)  # Soft delete flag
    version: int = Field(default=0)
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    deleted_at: Optional[datetime] = Field(  # When soft deleted
        default=None,
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        Index('ix_vehicles_tenant_code', 'tenant_id', 'code', unique=True),
        Index('ix_vehicles_tenant_active', 'tenant_id', 'is_active'),
        Index('ix_vehicles_tenant_deleted', 'tenant_id', 'is_deleted'),  # For filtering deleted records
        Index('ix_vehicles_tenant_status', 'tenant_id', 'status'),  # For filtering by status
    )



# ============================================================================
# TICKETING MODULE

class EventTypeModel(SQLModel, table=True):
    """EventType master data database model"""
    __tablename__ = "event_types"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    code: str = Field(index=True)
    name: str
    is_active: bool = Field(default=True, index=True)
    is_deleted: bool = Field(default=False, index=True)  # Soft delete flag
    version: int = Field(default=0)
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    deleted_at: Optional[datetime] = Field(  # When soft deleted
        default=None,
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        Index('ix_event_types_tenant_code', 'tenant_id', 'code', unique=True),
        Index('ix_event_types_tenant_active', 'tenant_id', 'is_active'),
        Index('ix_event_types_tenant_deleted', 'tenant_id', 'is_deleted'),  # For filtering deleted records
    )



class OrganizerModel(SQLModel, table=True):
    """Organizer master data database model"""
    __tablename__ = "organizers"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    code: str = Field(index=True)
    name: str
    is_active: bool = Field(default=True, index=True)
    is_deleted: bool = Field(default=False, index=True)  # Soft delete flag
    version: int = Field(default=0)
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    deleted_at: Optional[datetime] = Field(  # When soft deleted
        default=None,
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        Index('ix_organizers_tenant_code', 'tenant_id', 'code', unique=True),
        Index('ix_organizers_tenant_active', 'tenant_id', 'is_active'),
        Index('ix_organizers_tenant_deleted', 'tenant_id', 'is_deleted'),  # For filtering deleted records
    )

# ============================================================================
# TICKETING MODULE - MASTER DATA
# ============================================================================

class VenueModel(SQLModel, table=True):
    """Venue master data database model"""
    __tablename__ = "venues"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    code: str = Field(index=True)
    name: str
    image_url: Optional[str] = None  # URL for venue seat map image
    is_active: bool = Field(default=True, index=True)
    is_deleted: bool = Field(default=False, index=True)  # Soft delete flag
    version: int = Field(default=0)
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    deleted_at: Optional[datetime] = Field(  # When soft deleted
        default=None,
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        Index('ix_venues_tenant_code', 'tenant_id', 'code', unique=True),
        Index('ix_venues_tenant_active', 'tenant_id', 'is_active'),
        Index('ix_venues_tenant_deleted', 'tenant_id', 'is_deleted'),  # For filtering deleted records
    )


class SeatModel(SQLModel, table=True):
    """Seat master data database model"""
    __tablename__ = "seats"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    venue_id: str = Field(index=True, foreign_key="venues.id")
    section: str = Field(index=True)
    row: str = Field(index=True)
    seat_number: str = Field(index=True)
    seat_type: str = Field(index=True)  # STANDARD, VIP, WHEELCHAIR, COMPANION
    x_coordinate: Optional[float] = None
    y_coordinate: Optional[float] = None
    is_active: bool = Field(default=True, index=True)
    is_deleted: bool = Field(default=False, index=True)  # Soft delete flag
    version: int = Field(default=0)
    attributes: dict = Field(default_factory=dict, sa_column=Column(JSONB))
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    deleted_at: Optional[datetime] = Field(  # When soft deleted
        default=None,
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        Index('ix_seats_venue', 'tenant_id', 'venue_id'),
        Index('ix_seats_location', 'venue_id', 'section', 'row', 'seat_number', unique=True),
        Index('ix_seats_tenant_active', 'tenant_id', 'is_active'),
        Index('ix_seats_tenant_deleted', 'tenant_id', 'is_deleted'),
    )



# ============================================================================
# INVENTORY MODULE - WAREHOUSE STRUCTURE
# ============================================================================
# Note: WarehouseModel, ZoneModel, and BinModel have been replaced by
# StoreLocationModel which provides unified hierarchy support

class StoreLocationModel(SQLModel, table=True):
    """Unified store location database model with hierarchy support"""
    __tablename__ = "store_locations"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    location_type: str = Field(index=True)  # WAREHOUSE, ZONE, BIN, AISLE, RACK, SHELF, etc.
    code: str
    name: Optional[str] = None
    parent_location_id: Optional[str] = Field(
        default=None, 
        index=True, 
        foreign_key="store_locations.id"
    )
    
    # Type-specific attributes (nullable, used based on type)
    sub_location_type: Optional[str] = Field(default=None, index=True)  # For ZONE (STOCK, PICKING, etc.)
    address: Optional[dict] = Field(default=None, sa_column=Column(JSONB))  # For WAREHOUSE
    bin_type: Optional[str] = Field(default=None, index=True)  # For BIN (PICK_FACE, BULK, etc.)
    max_weight: Optional[Decimal] = None  # For BIN
    max_volume: Optional[Decimal] = None  # For BIN
    attributes: dict = Field(default_factory=dict, sa_column=Column(JSONB))  # Flexible
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        # Unique code per type within tenant
        Index('ix_store_locations_tenant_type_code', 'tenant_id', 'location_type', 'code', unique=True),
        # Hierarchy queries
        Index('ix_store_locations_parent', 'tenant_id', 'parent_location_id'),
        # Type queries
        Index('ix_store_locations_type', 'tenant_id', 'location_type'),
    )


class PutawayRuleModel(SQLModel, table=True):
    """Putaway rule database model"""
    __tablename__ = "putaway_rules"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    warehouse_id: str = Field(index=True)
    selector: dict = Field(default_factory=dict, sa_column=Column(JSONB))  # item_group, temp, hazard class, etc.
    target_zone_id: Optional[str] = None
    target_bin_type: Optional[str] = None
    priority: int = Field(default=0)  # Higher priority rules evaluated first
    enabled: bool = Field(default=True, index=True)
    item_ids: list[str] = Field(default_factory=list, sa_column=Column(PG_ARRAY(String)))  # Specific item IDs
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        Index('ix_putaway_rules_warehouse', 'tenant_id', 'warehouse_id', 'enabled'),
        Index('ix_putaway_rules_selector', 'selector', postgresql_using='gin'),
        Index('ix_putaway_rules_priority', 'tenant_id', 'warehouse_id', 'priority'),
    )


class PutawayLocationModel(SQLModel, table=True):
    """Putaway location database model - stores planned putaway locations for goods receipt lines"""
    __tablename__ = "putaway_locations"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    goods_receipt_line_id: str = Field(
        index=True,
        foreign_key="goods_receipt_lines.id",
        description="Reference to the goods receipt line item"
    )
    location_id: str = Field(
        index=True,
        foreign_key="store_locations.id",
        description="Target storage location for putaway"
    )
    quantity: Decimal = Field(description="Quantity to be put away at this location")
    uom: str = Field(description="Unit of measure for the quantity")
    status: str = Field(
        default="planned",
        index=True,
        description="Status: planned, in_progress, completed, cancelled"
    )
    sequence_order: int = Field(
        default=0,
        description="Execution order (0 = first, 1 = second, etc.)"
    )
    executed_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True)),
        description="When putaway was executed"
    )
    executed_by: Optional[str] = Field(
        default=None,
        description="User ID who executed the putaway"
    )
    notes: Optional[str] = Field(
        default=None,
        description="Additional notes for this putaway location"
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        Index('ix_putaway_tenant_line', 'tenant_id', 'goods_receipt_line_id'),
        Index('ix_putaway_status', 'tenant_id', 'status'),
        Index('ix_putaway_location', 'tenant_id', 'location_id'),
    )


class PickingRuleModel(SQLModel, table=True):
    """Picking rule database model"""
    __tablename__ = "picking_rules"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    warehouse_id: str = Field(index=True)
    strategy: str  # FEFO, FIFO, zone-priority, wave, etc.
    params: dict = Field(default_factory=dict, sa_column=Column(JSONB))
    priority: int = Field(default=0)
    enabled: bool = Field(default=True, index=True)
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        Index('ix_picking_rules_warehouse', 'tenant_id', 'warehouse_id', 'enabled'),
        Index('ix_picking_rules_strategy', 'tenant_id', 'warehouse_id', 'strategy'),
    )
# ============================================================================
# LEGACY MODELS
# ============================================================================

class UserCacheModel(SQLModel, table=True):
    """
    Lightweight user cache for operational queries and joins
    
    This is a READ-ONLY cache synced from Platform DB.
    Source of truth is UserModel in Platform DB.
    
    Use Cases:
    - SQL joins with orders/products
    - Fast lookups in operational queries
    - Analytics and reporting
    
    DO NOT USE for:
    - Authentication (use Platform DB)
    - Permission checks (use Platform DB)
    - Sensitive operations (use Platform DB)
    """
    __tablename__ = "users_cache"
    metadata = operational_metadata
    
    # Core user data (synced from Platform DB)
    id: str = Field(primary_key=True)
    tenant_id: str = Field(index=True)
    name: str = Field(index=True)  # For display in joins
    email: str = Field(index=True)  # For display/filtering
    role: str = Field(default="user", index=True)  # For basic filtering
    is_active: bool = Field(default=True, index=True)  # For filtering inactive users
    
    # Sync metadata
    synced_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        index=True
    )
    version: int = Field(default=1)  # Increment on each sync for tracking
    
    # Composite indexes for common queries
    __table_args__ = (
        Index('ix_users_cache_tenant_active', 'tenant_id', 'is_active'),
        Index('ix_users_cache_tenant_email', 'tenant_id', 'email'),
    )


# ============================================================================
# UI BUILDER MODELS
# ============================================================================

class UISchemaModel(SQLModel, table=True):
    """UI Schema database model - stores visual UI definitions"""
    __tablename__ = "ui_schemas"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, index=True)
    tenant_id: str = Field(index=True)
    name: str = Field(index=True)  # Unique identifier (kebab-case)
    display_name: str
    description: Optional[str] = None
    category: Optional[str] = Field(default=None, index=True)
    version: int = Field(default=1)
    status: str = Field(default="draft", index=True)  # draft, published, archived
    schema_data: dict = Field(sa_column=Column(JSON))  # The actual JSON schema
    metadata_json: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    
    # Audit fields
    created_by: str = Field(index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)
    updated_by: Optional[str] = None
    updated_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    
    __table_args__ = (
        Index('ix_ui_schemas_tenant_name_version', 'tenant_id', 'name', 'version', unique=True),
        Index('ix_ui_schemas_tenant_status', 'tenant_id', 'status'),
    )


class UISchemaVersionModel(SQLModel, table=True):
    """UI Schema Version - version history for schemas"""
    __tablename__ = "ui_schema_versions"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, index=True)
    schema_id: str = Field(index=True)
    version: int
    schema_data: dict = Field(sa_column=Column(JSON))
    change_summary: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)
    
    __table_args__ = (
        Index('ix_ui_schema_versions_schema_version', 'schema_id', 'version', unique=True),
    )


class UIPageModel(SQLModel, table=True):
    """UI Page - pages in the application that use UI schemas"""
    __tablename__ = "ui_pages"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, index=True)
    tenant_id: str = Field(index=True)
    schema_id: str = Field(index=True)
    route_path: str = Field(index=True)  # URL path e.g., "/customers/list"
    title: str
    description: Optional[str] = None
    icon: Optional[str] = None
    permissions: Optional[list] = Field(default=None, sa_column=Column(JSON))
    is_public: bool = Field(default=False)
    is_active: bool = Field(default=True, index=True)
    order_index: int = Field(default=0)
    parent_id: Optional[str] = None
    
    # Audit fields
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_by: Optional[str] = None
    updated_at: Optional[datetime] = None
    
    __table_args__ = (
        Index('ix_ui_pages_tenant_route', 'tenant_id', 'route_path', unique=True),
        Index('ix_ui_pages_tenant_active', 'tenant_id', 'is_active'),
    )


class UICustomComponentModel(SQLModel, table=True):
    """UI Custom Component - user-defined components"""
    __tablename__ = "ui_custom_components"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, index=True)
    tenant_id: str = Field(index=True)
    name: str  # Unique identifier
    display_name: str
    description: Optional[str] = None
    category: str = Field(index=True)
    icon: Optional[str] = None
    component_type: str = Field(index=True)  # primitive, layout, data, business, custom
    schema_definition: dict = Field(sa_column=Column(JSON))
    default_props: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    code_implementation: Optional[str] = None  # Optional TypeScript/JavaScript code
    is_system: bool = Field(default=False)  # System components can't be deleted
    is_active: bool = Field(default=True, index=True)
    
    # Audit fields
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_by: Optional[str] = None
    updated_at: Optional[datetime] = None
    
    __table_args__ = (
        Index('ix_ui_custom_components_tenant_name', 'tenant_id', 'name', unique=True),
        Index('ix_ui_custom_components_tenant_type', 'tenant_id', 'component_type'),
    )


# ============================================================================
# AUDIT LOG MODELS
# ============================================================================

class AuditLogModel(SQLModel, table=True):
    """Audit log database model for activity tracking and compliance"""
    __tablename__ = "audit_logs"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    event_id: str = Field(unique=True, index=True)
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), server_default="NOW()", index=True)
    )
    
    # Event Classification
    event_type: str = Field(index=True, max_length=50)
    severity: str = Field(index=True, max_length=20)
    
    # Entity Information
    entity_type: str = Field(max_length=100)
    entity_id: str = Field(index=True)
    
    # User Context
    user_id: Optional[str] = Field(default=None, index=True)
    user_email: Optional[str] = None
    session_id: Optional[str] = None
    
    # Request Context
    request_id: Optional[str] = None
    ip_address: Optional[str] = Field(default=None, sa_column=Column(INET))  # PostgreSQL INET type
    user_agent: Optional[str] = None
    
    # Change Tracking
    old_values: Optional[Dict[str, Any]] = Field(
        default=None, 
        sa_column=Column(JSON)
    )
    new_values: Optional[Dict[str, Any]] = Field(
        default=None, 
        sa_column=Column(JSON)
    )
    changed_fields: Optional[List[str]] = Field(
        default=None,
        sa_column=Column(ARRAY(String))
    )
    
    # Metadata (renamed to avoid conflict with SQLModel.metadata)
    description: str = Field(default="")
    metadata_json: Optional[Dict[str, Any]] = Field(
        default_factory=dict, 
        sa_column=Column(JSON)
    )
    
    # Compliance
    retention_period_days: int = Field(default=2555)  # 7 years
    is_pii: bool = Field(default=False, index=True)
    is_sensitive: bool = Field(default=False, index=True)
    
    __table_args__ = (
        Index('ix_audit_logs_tenant_timestamp', 'tenant_id', 'timestamp'),
        Index('ix_audit_logs_entity', 'entity_type', 'entity_id', 'timestamp'),
        Index('ix_audit_logs_user', 'user_id', 'timestamp'),
        Index('ix_audit_logs_event_type', 'event_type', 'timestamp'),
        Index('ix_audit_logs_event_id', 'event_id'),
    )


# ============================================================================
# SHARED MODULE - SEQUENCE GENERATION
# ============================================================================

class SequenceModel(SQLModel, table=True):
    """Sequence counter for document code generation (PO, SO, WO, GR, IT, etc.)"""
    __tablename__ = "sequences"
    metadata = operational_metadata

    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    sequence_type: str = Field(index=True)  # "PO", "SO", "WO", "GR", "IT", etc.
    prefix: str = Field(default="")  # e.g., "PO-"
    digits: int = Field(default=6)  # Number of digits, e.g., 6 for "000001"
    current_value: int = Field(default=0)  # Current sequence number
    description: Optional[str] = None
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )

    __table_args__ = (
        Index('ix_sequences_tenant_type', 'tenant_id', 'sequence_type', unique=True),
    )


