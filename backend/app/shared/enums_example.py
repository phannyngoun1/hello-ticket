"""
Example: Migrating Existing Models to Use Enums

This file shows examples of how to update existing SQLModel classes
to use the centralized enum system.
"""

from sqlmodel import SQLModel, Field, Index
from sqlalchemy import Column, Enum, DateTime, String
from datetime import datetime, timezone
from app.shared import (
    StatusEnum,
    UnitOfMeasureEnum,
    InventoryStatusEnum,
    TransactionTypeEnum,
    BinTypeEnum,
    CustomerTypeEnum,
)


# ============================================================================
# EXAMPLE 1: Before and After - Item Model
# ============================================================================

# BEFORE (using plain strings):
class ItemModelOld(SQLModel, table=True):
    """Old version with string fields"""
    __tablename__ = "items_old"
    
    id: str = Field(primary_key=True)
    name: str
    status: str = Field(default="active")  # ❌ No type safety
    default_uom: str  # ❌ No validation


# AFTER (using enums):
class ItemModelNew(SQLModel, table=True):
    """New version with enum fields"""
    __tablename__ = "items"
    
    id: str = Field(primary_key=True)
    name: str
    status: StatusEnum = Field(
        default=StatusEnum.ACTIVE,
        sa_column=Column(Enum(StatusEnum, native_enum=False))
    )  # ✅ Type safe with validation
    default_uom: UnitOfMeasureEnum = Field(
        sa_column=Column(Enum(UnitOfMeasureEnum, native_enum=False))
    )  # ✅ Validated enum


# ============================================================================
# EXAMPLE 2: Inventory Balance with Status
# ============================================================================

class InventoryBalanceExample(SQLModel, table=True):
    """Example: Inventory balance with enum status"""
    __tablename__ = "inventory_balances_example"
    
    id: str = Field(primary_key=True)
    item_id: str
    warehouse_id: str
    quantity: float
    
    # Using enum for status with default
    status: InventoryStatusEnum = Field(
        default=InventoryStatusEnum.AVAILABLE,
        index=True,
        sa_column=Column(Enum(InventoryStatusEnum, native_enum=False))
    )
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        Index('ix_inv_balance_status', 'status'),
    )


# ============================================================================
# EXAMPLE 3: Transaction with Type Enum
# ============================================================================

class TransactionExample(SQLModel, table=True):
    """Example: Transaction with enum type"""
    __tablename__ = "transactions_example"
    
    id: str = Field(primary_key=True)
    item_id: str
    quantity: float
    
    # Required enum field (no default)
    type: TransactionTypeEnum = Field(
        sa_column=Column(Enum(TransactionTypeEnum, native_enum=False))
    )
    
    # Optional enum field
    reason_code: str = None
    
    occurred_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )


# ============================================================================
# EXAMPLE 4: Bin with Type Enum
# ============================================================================

class BinExample(SQLModel, table=True):
    """Example: Warehouse bin with type enum"""
    __tablename__ = "bins_example"
    
    id: str = Field(primary_key=True)
    warehouse_id: str
    code: str
    
    # Enum with index for fast queries
    type: BinTypeEnum = Field(
        index=True,
        sa_column=Column(Enum(BinTypeEnum, native_enum=False))
    )
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        Index('ix_bins_type', 'type'),
    )


# ============================================================================
# EXAMPLE 5: Customer with Type Enum
# ============================================================================

class CustomerExample(SQLModel, table=True):
    """Example: Customer with type enum"""
    __tablename__ = "customers_example"
    
    id: str = Field(primary_key=True)
    name: str
    email: str
    
    # Customer type enum
    customer_type: CustomerTypeEnum = Field(
        default=CustomerTypeEnum.BUSINESS,
        sa_column=Column(Enum(CustomerTypeEnum, native_enum=False))
    )
    
    # Status enum
    status: StatusEnum = Field(
        default=StatusEnum.ACTIVE,
        sa_column=Column(Enum(StatusEnum, native_enum=False))
    )
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )


# ============================================================================
# EXAMPLE 6: Query Usage
# ============================================================================

def query_examples():
    """Examples of querying with enums"""
    from sqlmodel import select
    
    # Query active items
    stmt = select(ItemModelNew).where(
        ItemModelNew.status == StatusEnum.ACTIVE
    )
    
    # Query available inventory
    stmt = select(InventoryBalanceExample).where(
        InventoryBalanceExample.status == InventoryStatusEnum.AVAILABLE
    )
    
    # Query specific transaction type
    stmt = select(TransactionExample).where(
        TransactionExample.type == TransactionTypeEnum.RECEIVE
    )
    
    # Multiple enum conditions
    stmt = select(ItemModelNew).where(
        ItemModelNew.status == StatusEnum.ACTIVE,
        ItemModelNew.default_uom == UnitOfMeasureEnum.KG
    )


# ============================================================================
# EXAMPLE 7: Creating Records
# ============================================================================

def create_examples():
    """Examples of creating records with enums"""
    
    # Create item with enum values
    item = ItemModelNew(
        id="item-123",
        name="Widget",
        status=StatusEnum.ACTIVE,  # Use enum member
        default_uom=UnitOfMeasureEnum.KG
    )
    
    # Create transaction
    transaction = TransactionExample(
        id="tx-456",
        item_id="item-123",
        quantity=10.0,
        type=TransactionTypeEnum.RECEIVE  # Required enum
    )
    
    # Status defaults to ACTIVE if not specified
    customer = CustomerExample(
        id="cust-789",
        name="Acme Corp",
        email="contact@acme.com",
        customer_type=CustomerTypeEnum.BUSINESS
        # status defaults to StatusEnum.ACTIVE
    )
