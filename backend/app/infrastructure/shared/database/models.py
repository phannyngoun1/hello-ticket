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
# SALES MODULE

class BookingModel(SQLModel, table=True):
    """Booking master data database model"""
    __tablename__ = "bookings"
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
        Index('ix_bookings_tenant_code', 'tenant_id', 'code', unique=True),
        Index('ix_bookings_tenant_active', 'tenant_id', 'is_active'),
        Index('ix_bookings_tenant_deleted', 'tenant_id', 'is_deleted'),  # For filtering deleted records
    )



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
# TICKETING MODULE

class ShowModel(SQLModel, table=True):
    """Show master data database model"""
    __tablename__ = "shows"
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
        Index('ix_shows_tenant_code', 'tenant_id', 'code', unique=True),
        Index('ix_shows_tenant_active', 'tenant_id', 'is_active'),
        Index('ix_shows_tenant_deleted', 'tenant_id', 'is_deleted'),  # For filtering deleted records
    )



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


class LayoutModel(SQLModel, table=True):
    """Layout database model - represents a seating layout for a venue"""
    __tablename__ = "layouts"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    venue_id: str = Field(index=True, foreign_key="venues.id")
    name: str
    description: Optional[str] = None
    file_id: Optional[str] = Field(default=None, index=True, foreign_key="file_uploads.id")  # Reference to uploaded file
    design_mode: str = Field(default="seat-level", index=True)  # "seat-level" or "section-level"
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
        Index('ix_layouts_venue', 'tenant_id', 'venue_id'),
        Index('ix_layouts_tenant_active', 'tenant_id', 'is_active'),
        Index('ix_layouts_tenant_deleted', 'tenant_id', 'is_deleted'),
    )


class SectionModel(SQLModel, table=True):
    """Section database model - represents a section within a layout"""
    __tablename__ = "sections"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    layout_id: str = Field(index=True, foreign_key="layouts.id")
    name: str = Field(index=True)
    x_coordinate: Optional[float] = None  # Position on main floor plan (percentage)
    y_coordinate: Optional[float] = None  # Position on main floor plan (percentage)
    file_id: Optional[str] = Field(default=None, index=True, foreign_key="file_uploads.id")  # Section floor plan image
    is_active: bool = Field(default=True, index=True)
    is_deleted: bool = Field(default=False, index=True)
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
        Index('ix_sections_layout', 'tenant_id', 'layout_id'),
        Index('ix_sections_layout_name', 'layout_id', 'name', unique=True),
        Index('ix_sections_tenant_active', 'tenant_id', 'is_active'),
        Index('ix_sections_tenant_deleted', 'tenant_id', 'is_deleted'),
    )


class SeatModel(SQLModel, table=True):
    """Seat master data database model"""
    __tablename__ = "seats"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    venue_id: str = Field(index=True, foreign_key="venues.id")
    layout_id: str = Field(index=True, foreign_key="layouts.id")
    section_id: str = Field(index=True, foreign_key="sections.id")
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
        Index('ix_seats_layout', 'tenant_id', 'layout_id'),
        Index('ix_seats_section', 'tenant_id', 'section_id'),
        Index('ix_seats_location', 'layout_id', 'section_id', 'row', 'seat_number', unique=True),
        Index('ix_seats_tenant_active', 'tenant_id', 'is_active'),
        Index('ix_seats_tenant_deleted', 'tenant_id', 'is_deleted'),
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


# ============================================================================
# SHARED MODULE - FILE UPLOADS
# ============================================================================

class FileUploadModel(SQLModel, table=True):
    """File upload database model for tracking uploaded files"""
    __tablename__ = "file_uploads"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    filename: str  # Unique filename on disk (UUID + extension)
    original_name: str  # Original filename from user
    mime_type: str
    size: int  # File size in bytes
    url: str  # URL path to access the file
    uploaded_by: Optional[str] = Field(default=None, index=True)  # User ID who uploaded
    uploaded_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), index=True)
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
        Index('ix_file_uploads_tenant_id', 'tenant_id', 'uploaded_at'),
        Index('ix_file_uploads_uploaded_by', 'tenant_id', 'uploaded_by'),
        Index('ix_file_uploads_filename', 'tenant_id', 'filename', unique=True),
    )


