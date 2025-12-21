"""
Centralized Enumeration Definitions

This module contains all lookup-type enumerations used throughout the application.
These enums are stored as strings in the database (not in separate tables) for 
small, fixed sets of values that don't require relational integrity.

Usage in SQLModel:
    status: StatusEnum = Field(sa_column=Column(Enum(StatusEnum, native_enum=False)))

Usage in Domain:
    status = StatusEnum.ACTIVE
    
Benefits:
    - Type safety in Python
    - Validation at ORM level
    - Easy to extend
    - No separate database tables needed
    - Database stores as strings for flexibility
"""

from enum import Enum


# ============================================================================
# STATUS ENUMS
# ============================================================================

class StatusEnum(str, Enum):
    """General status enumeration for active/inactive states"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"
    SUSPENDED = "suspended"
    ARCHIVED = "archived"


class SessionStatusEnum(str, Enum):
    """User session status"""
    ACTIVE = "active"
    EXPIRED = "expired"
    REVOKED = "revoked"
    FORCE_LOGOUT = "force_logout"


class SubscriptionStatusEnum(str, Enum):
    """Subscription status"""
    ACTIVE = "active"
    CANCELLED = "cancelled"
    SUSPENDED = "suspended"
    EXPIRED = "expired"


# ============================================================================
# UNIT OF MEASUREMENT ENUMS
# ============================================================================

class UnitOfMeasureEnum(str, Enum):
    """Common units of measurement"""
    # Weight
    KG = "kg"  # Kilogram
    G = "g"  # Gram
    MG = "mg"  # Milligram
    T = "t"  # Metric Ton
    LB = "lb"  # Pound
    OZ = "oz"  # Ounce
    
    # Length/Distance
    KM = "km"  # Kilometer
    M = "m"  # Meter
    CM = "cm"  # Centimeter
    MM = "mm"  # Millimeter
    MI = "mi"  # Mile
    FT = "ft"  # Foot
    IN = "in"  # Inch
    YD = "yd"  # Yard
    
    # Volume
    L = "l"  # Liter
    ML = "ml"  # Milliliter
    GAL = "gal"  # Gallon (US)
    QT = "qt"  # Quart
    PT = "pt"  # Pint
    FL_OZ = "fl_oz"  # Fluid Ounce
    CU_M = "m³"  # Cubic Meter
    CU_CM = "cm³"  # Cubic Centimeter
    
    # Area
    SQ_KM = "km²"  # Square Kilometer
    SQ_M = "m²"  # Square Meter
    SQ_CM = "cm²"  # Square Centimeter
    SQ_MM = "mm²"  # Square Millimeter
    SQ_MI = "mi²"  # Square Mile
    SQ_FT = "ft²"  # Square Foot
    SQ_IN = "in²"  # Square Inch
    SQ_YD = "yd²"  # Square Yard
    ACRE = "acre"  # Acre
    HECTARE = "ha"  # Hectare
    
    # Count/Quantity
    EA = "ea"  # Each
    PC = "pc"  # Piece
    PKG = "pkg"  # Package
    BOX = "box"  # Box
    CASE = "case"  # Case
    PALLET = "pallet"  # Pallet
    CARTON = "carton"  # Carton
    DOZEN = "dozen"  # Dozen
    GROSS = "gross"  # Gross (144 pieces)
    
    # Time-based
    HR = "hr"  # Hour
    MIN = "min"  # Minute
    SEC = "sec"  # Second
    DAY = "day"  # Day
    WEEK = "week"  # Week
    MONTH = "month"  # Month
    YEAR = "year"  # Year
    
    # Currency (ISO 4217 codes)
    USD = "USD"  # US Dollar
    EUR = "EUR"  # Euro
    GBP = "GBP"  # British Pound
    JPY = "JPY"  # Japanese Yen
    CAD = "CAD"  # Canadian Dollar
    AUD = "AUD"  # Australian Dollar
    CNY = "CNY"  # Chinese Yuan
    INR = "INR"  # Indian Rupee


# ============================================================================
# CUSTOMER/TYPE ENUMS
# ============================================================================

class CustomerTypeEnum(str, Enum):
    """Customer classification types"""
    INDIVIDUAL = "individual"
    BUSINESS = "business"
    GOVERNMENT = "government"
    NON_PROFIT = "non_profit"
    RESELLER = "reseller"
    DISTRIBUTOR = "distributor"
    DEALER = "dealer"
    RETAILER = "retailer"
    WHOLESALER = "wholesaler"
    MANUFACTURER = "manufacturer"


class ContactTypeEnum(str, Enum):
    """Type of contact"""
    CUSTOMER = "customer"
    SUPPLIER = "supplier"
    VENDOR = "vendor"
    PARTNER = "partner"
    PROSPECT = "prospect"
    LEAD = "lead"


class BusinessTypeEnum(str, Enum):
    """Type of business entity"""
    SOLE_PROPRIETORSHIP = "sole_proprietorship"
    PARTNERSHIP = "partnership"
    LLC = "llc"
    CORPORATION = "corporation"
    S_CORP = "s_corp"
    NON_PROFIT = "non_profit"
    GOVERNMENT = "government"


# ============================================================================
# TRANSACTION/OPERATION ENUMS
# ============================================================================

class TransactionTypeEnum(str, Enum):
    """Inventory transaction types"""
    RECEIVE = "receive"
    ISSUE = "issue"
    MOVE = "move"
    TRANSFER_OUT = "transfer_out"
    TRANSFER_IN = "transfer_in"
    ADJUSTMENT = "adjustment"
    RETURN = "return"
    CONSUMPTION = "consumption"
    PRODUCTION = "production"
    SCRAP = "scrap"


class DocumentTypeEnum(str, Enum):
    """Document/Reference types"""
    PURCHASE_ORDER = "purchase_order"
    SALES_ORDER = "sales_order"
    INVOICE = "invoice"
    RECEIPT = "receipt"
    TRANSFER_ORDER = "transfer_order"
    ADJUSTMENT_ORDER = "adjustment_order"
    WORK_ORDER = "work_order"
    PRODUCTION_ORDER = "production_order"


class BinTypeEnum(str, Enum):
    """Warehouse bin types
    
    Bin types define storage purpose:
    - PICK_FACE: Fast-moving items for direct picking (does NOT accept pallets)
    - BULK: Large quantities and full pallets (accepts pallets)
    - RESERVE: Reserve stock storage for slow-moving items (accepts pallets)
    - STAGE: Temporary staging area (does NOT accept pallets)
    - RECEIVING: Receiving dock area (does NOT accept pallets)
    - SHIPPING: Shipping dock area (does NOT accept pallets)
    - QA: Quality assurance area (does NOT accept pallets)
    - HOLD: Items on hold (typically does NOT accept pallets)
    - QUARANTINE: Quarantined items (typically does NOT accept pallets)
    """
    PICK_FACE = "pick_face"
    BULK = "bulk"
    RESERVE = "reserve"
    STAGE = "stage"
    RECEIVING = "receiving"
    SHIPPING = "shipping"
    QA = "qa"
    HOLD = "hold"
    QUARANTINE = "quarantine"


class LocationTypeEnum(str, Enum):
    """Store location types for unified location hierarchy"""
    WAREHOUSE = "warehouse"
    ZONE = "zone"
    BIN = "bin"
    AISLE = "aisle"
    RACK = "rack"
    SHELF = "shelf"
    # Future extensibility: DOCK, STAGE_AREA, etc.


class SubLocationTypeEnum(str, Enum):
    """Sub location types that define what child locations a zone can contain
    
    Sub location types determine what kind of sub-locations can be added under a zone:
    - STOCK: Storage zones that can contain Zone, Aisle, or Rack
    - PICKING: Picking zones for order fulfillment
    - RECEIVING: Receiving areas for incoming goods
    - SHIPPING: Shipping areas for outgoing goods
    - INSPECTION: Quality inspection areas
    - LOCKED: Locked or restricted access areas
    - WIP: Work in progress areas
    """
    STOCK = "stock"
    PICKING = "picking"
    RECEIVING = "receiving"
    SHIPPING = "shipping"
    INSPECTION = "inspection"
    LOCKED = "locked"
    WIP = "wip"


class TrackingTypeEnum(str, Enum):
    """Inventory tracking types for unified tracking model"""
    SERIAL = "serial"
    EXPIRATION = "expiration"
    MANUFACTURING_DATE = "manufacturing_date"
    SUPPLIER_BATCH = "supplier_batch"
    COMBINED = "combined"
    # Future extensibility: QUALITY_CERT, WARRANTY, RECALL, etc.


class TrackingStatusEnum(str, Enum):
    """Inventory tracking status enumeration"""
    AVAILABLE = "available"
    HOLD = "hold"
    QUARANTINE = "quarantine"
    EXPIRED = "expired"
    IN_USE = "in_use"
    RESERVED = "reserved"
    SCRAPPED = "scrapped"
    # Future extensibility: RETURNED, DAMAGED, etc.


class ItemTypeEnum(str, Enum):
    """Item type classification - WHAT the item is"""
    SERVICE = "service"  # Services (no physical inventory)
    PRODUCT = "product"  # Finished goods/products
    RAW_MATERIAL = "raw_material"  # Raw materials for production
    WIP = "wip"  # Work in progress / unfinished product
    MANUFACTURING_STAGING = "manufacturing_staging"  # Items in manufacturing staging
    COMPONENT = "component"  # Components/parts
    PACKAGING = "packaging"  # Packaging materials
    TOOL = "tool"  # Tools and equipment
    # Future extensibility: EQUIPMENT, SUPPLIES, etc.


class ItemUsageEnum(str, Enum):
    """Item usage/purpose - WHO uses the item (separate from item type)"""
    FOR_SALE = "for_sale"  # Item can be sold to customers
    INTERNAL_USE = "internal_use"  # Item is for internal use only (not for sale)
    MANUFACTURED = "manufactured"  # Item is manufactured
    SAMPLE = "sample"  # Item is a sample
    # Note: This is separate from item_type. 
    # Example: A PRODUCT can be FOR_SALE or INTERNAL_USE
    # Example: A COMPONENT can be FOR_SALE (sold separately) or INTERNAL_USE (used in assembly)


class TrackingScopeEnum(str, Enum):
    """Scope of tracking for items"""
    NONE = "none"  # No tracking required
    INVENTORY_ONLY = "inventory_only"  # Track in inventory only (quantities, costs)
    # Future extensibility: PRODUCTION_ONLY, QUALITY_ONLY, etc.


class UoMContextEnum(str, Enum):
    """Context for unit of measure usage"""
    DEFAULT = "default"  # Default/base UoM
    PURCHASE = "purchase"  # UoM for purchase orders
    SALE = "sale"  # UoM for sales orders
    PRODUCTION = "production"  # UoM for production/manufacturing
    TRANSFER = "transfer"  # UoM for transfers between locations
    TRANSPORT = "transport"  # UoM for transportation/shipping
    STORAGE = "storage"  # UoM for storage/warehouse
    # Future extensibility: PACKAGING, QUALITY, etc.


# ============================================================================
# DEVICE/TECHNICAL ENUMS
# ============================================================================

class DeviceTypeEnum(str, Enum):
    """Device type enumeration"""
    WEB = "web"
    MOBILE = "mobile"
    TABLET = "tablet"
    DESKTOP = "desktop"
    UNKNOWN = "unknown"


# ============================================================================
# WAREHOUSE ENUMS
# ============================================================================

class VehicleTypeEnum(str, Enum):
    """Vehicle type enumeration for warehouse equipment"""
    LORY = "lory"
    FORKLIFT = "forklift"
    PALLET_JACK = "pallet_jack"
    REACH_TRUCK = "reach_truck"
    CART = "cart"
    TUGGER = "tugger"
    AMR_ROBOT = "amr_robot"


class VehicleStatusEnum(str, Enum):
    """Vehicle operational status"""
    AVAILABLE = "available"
    BUSY = "busy"
    UNDER_MAINTENANCE = "under_maintenance"


# ============================================================================
# PAYMENT/BILLING ENUMS
# ============================================================================

class PaymentStatusEnum(str, Enum):
    """Payment processing status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"


class PaymentMethodEnum(str, Enum):
    """Payment methods"""
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    BANK_TRANSFER = "bank_transfer"
    CHECK = "check"
    CASH = "cash"
    PAYPAL = "paypal"
    OTHER = "other"


class BillingCycleEnum(str, Enum):
    """Billing cycle types"""
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUAL = "annual"
    ONE_TIME = "one_time"


# ============================================================================
# UI/APPLICATION ENUMS
# ============================================================================

class UISchemaStatusEnum(str, Enum):
    """UI schema status"""
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class ComponentTypeEnum(str, Enum):
    """UI component type"""
    PRIMITIVE = "primitive"
    LAYOUT = "layout"
    DATA = "data"
    BUSINESS = "business"
    CUSTOM = "custom"


# ============================================================================
# INTEGRATION ENUMS
# ============================================================================

class IntegrationStatusEnum(str, Enum):
    """Integration status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"
    MAINTENANCE = "maintenance"


class MessageStatusEnum(str, Enum):
    """Message processing status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRY = "retry"


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_enum_values(enum_class: type[Enum]) -> list[str]:
    """Get all values from an enum class"""
    return [e.value for e in enum_class]


def get_enum_names(enum_class: type[Enum]) -> list[str]:
    """Get all names from an enum class"""
    return [e.name for e in enum_class]


def is_valid_enum_value(enum_class: type[Enum], value: str) -> bool:
    """Check if a value is valid for the given enum"""
    try:
        enum_class(value)
        return True
    except ValueError:
        return False
