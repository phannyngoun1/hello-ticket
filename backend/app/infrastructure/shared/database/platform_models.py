"""
SQLModel models for tenant/auth data in the operational database.

Same database as business data; tables: tenants, users, sessions, roles, etc.
Connection and table creation: app.infrastructure.shared.database.connection.
"""
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field, Index, MetaData
from sqlalchemy import Column, DateTime, JSON as SQLJSON
import json

# Create separate metadata for platform models to avoid mixing with operational models
platform_metadata = MetaData()


class TenantModel(SQLModel, table=True):
    """Tenant database model - Platform database only"""
    __tablename__ = "tenants"
    metadata = platform_metadata
    
    id: str = Field(primary_key=True, index=True)
    name: str = Field(index=True)
    slug: Optional[str] = Field(default=None, index=True, unique=True)
    is_active: bool = Field(default=True, index=True)
    settings: str = Field(default="{}")  # JSON string
    database_strategy: str = Field(default="shared_database", index=True)
    database_config: str = Field(default="{}")  # JSON string
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    
    def get_settings_dict(self) -> dict:
        """Parse settings JSON string to dict"""
        try:
            return json.loads(self.settings) if self.settings else {}
        except (json.JSONDecodeError, TypeError):
            return {}
    
    def set_settings_dict(self, settings_dict: dict) -> None:
        """Convert settings dict to JSON string"""
        self.settings = json.dumps(settings_dict)
    
    def get_database_config_dict(self) -> dict:
        """Parse database_config JSON string to dict"""
        try:
            return json.loads(self.database_config) if self.database_config else {}
        except (json.JSONDecodeError, TypeError):
            return {}
    
    def set_database_config_dict(self, config_dict: dict) -> None:
        """Convert database config dict to JSON string"""
        self.database_config = json.dumps(config_dict)


class TenantSubscriptionModel(SQLModel, table=True):
    """Tenant subscription model - Platform database only"""
    metadata = platform_metadata
    __tablename__ = "tenant_subscriptions"
    
    id: str = Field(primary_key=True, index=True)
    tenant_id: str = Field(index=True)
    plan_tier: str = Field(default="free", index=True)  # free, starter, professional, enterprise
    billing_cycle: str = Field(default="monthly")  # monthly, annual
    status: str = Field(default="active", index=True)  # active, cancelled, suspended, expired
    is_locked: bool = Field(default=False, index=True)
    
    # Timestamps
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )


class UserModel(SQLModel, table=True):
    """User database model - Platform database (Authentication & Identity)"""
    __tablename__ = "users"
    metadata = platform_metadata
    
    id: str = Field(primary_key=True, index=True)
    tenant_id: str = Field(index=True)  # Multi-tenancy support
    username: str = Field(index=True)
    first_name: str = Field(index=True)
    last_name: str = Field(index=True)
    email: str = Field(index=True)
    hashed_password: str
    
    # Base system role (predefined: admin, manager, user, guest)
    # This is the user's primary role, always a system role
    base_role: str = Field(default="user", index=True)
    
    # User can have additional custom roles via user_roles table (Method 1)
    # User can have roles from groups via user_groups + group_roles (Method 2)
    
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)
    must_change_password: bool = Field(default=False)  # Force password change on next login
    last_login: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True)
    )
    last_password_change: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True)
    )
    failed_login_attempts: int = Field(default=0)
    locked_until: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True)
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    
    __table_args__ = (
        Index('ix_users_tenant_email', 'tenant_id', 'email', unique=True),
        Index('ix_users_tenant_username', 'tenant_id', 'username', unique=True),
        Index('ix_users_base_role', 'base_role'),
    )


class SessionModel(SQLModel, table=True):
    """Session database model - Platform database (Authentication & Session Management)"""
    __tablename__ = "sessions"
    metadata = platform_metadata
    
    id: str = Field(primary_key=True, index=True)
    user_id: str = Field(index=True)
    tenant_id: str = Field(index=True)
    status: str = Field(default="active", index=True)  # active, expired, revoked, force_logout, etc.
    
    # Device information
    device_type: str = Field(index=True)  # web, mobile, tablet, desktop, unknown
    user_agent: str
    ip_address: str = Field(index=True)
    device_name: Optional[str] = Field(default=None)
    os: Optional[str] = Field(default=None)
    browser: Optional[str] = Field(default=None)
    
    # Session lifecycle
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False, index=True)
    )
    expires_at: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False))
    last_activity_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False, index=True)
    )
    
    # Revocation tracking
    revoked_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True)
    )
    revoked_by: Optional[str] = Field(default=None)  # user_id who revoked (for admin actions)
    revocation_reason: Optional[str] = Field(default=None)
    
    __table_args__ = (
        Index('ix_sessions_user_tenant', 'user_id', 'tenant_id'),
        Index('ix_sessions_user_status', 'user_id', 'status'),
        Index('ix_sessions_tenant_status', 'tenant_id', 'status'),
        Index('ix_sessions_expires_at', 'expires_at'),
    )


class GroupModel(SQLModel, table=True):
    """Group database model - Platform database (Group Management)"""
    __tablename__ = "groups"
    metadata = platform_metadata
    
    id: str = Field(primary_key=True, index=True)
    tenant_id: str = Field(index=True)
    name: str = Field(index=True)
    description: Optional[str] = Field(default=None)
    is_active: bool = Field(default=True, index=True)
    created_by: Optional[str] = Field(default=None)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    
    __table_args__ = (
        Index('ix_groups_tenant_name', 'tenant_id', 'name', unique=True),
        Index('ix_groups_tenant_active', 'tenant_id', 'is_active'),
    )


class UserGroupModel(SQLModel, table=True):
    """User-Group relationship model - Platform database"""
    __tablename__ = "user_groups"
    metadata = platform_metadata
    
    id: str = Field(primary_key=True, index=True)
    user_id: str = Field(index=True)
    group_id: str = Field(index=True)
    tenant_id: str = Field(index=True)
    added_by: Optional[str] = Field(default=None)
    added_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    
    __table_args__ = (
        Index('ix_user_groups_user_group', 'user_id', 'group_id', unique=True),
        Index('ix_user_groups_group_tenant', 'group_id', 'tenant_id'),
        Index('ix_user_groups_user_tenant', 'user_id', 'tenant_id'),
    )


class RoleModel(SQLModel, table=True):
    """Role database model - Platform database"""
    __tablename__ = "roles"
    metadata = platform_metadata
    
    id: str = Field(primary_key=True, index=True)
    tenant_id: str = Field(index=True)
    name: str = Field(index=True)
    description: Optional[str] = Field(default=None)
    permissions: str = Field(default="[]")  # JSON array of permission strings
    is_active: bool = Field(default=True, index=True)
    is_system_role: bool = Field(default=False)
    created_by: Optional[str] = Field(default=None)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    
    __table_args__ = (
        Index('ix_roles_tenant_name', 'tenant_id', 'name', unique=True),
        Index('ix_roles_tenant_active', 'tenant_id', 'is_active'),
    )
    
    def get_permissions_list(self) -> list:
        """Parse permissions JSON string to list"""
        try:
            return json.loads(self.permissions) if self.permissions else []
        except (json.JSONDecodeError, TypeError):
            return []
    
    def set_permissions_list(self, permissions_list: list) -> None:
        """Convert permissions list to JSON string"""
        self.permissions = json.dumps(permissions_list)


class UserRoleModel(SQLModel, table=True):
    """
    User-Role direct assignment model - Platform database
    
    This represents DIRECT role assignment to users (Method 1)
    Users can also get roles through groups (Method 2 - via GroupRoleModel)
    """
    __tablename__ = "user_roles"
    metadata = platform_metadata
    
    id: str = Field(primary_key=True, index=True)
    user_id: str = Field(index=True)
    role_id: str = Field(index=True)
    tenant_id: str = Field(index=True)
    assigned_by: Optional[str] = Field(default=None)
    assigned_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    
    __table_args__ = (
        Index('ix_user_roles_user_role', 'user_id', 'role_id', unique=True),
        Index('ix_user_roles_role_tenant', 'role_id', 'tenant_id'),
        Index('ix_user_roles_user_tenant', 'user_id', 'tenant_id'),
    )


class GroupRoleModel(SQLModel, table=True):
    """
    Group-Role relationship model - Platform database
    
    This represents roles that belong to a group.
    All users in the group inherit these roles (Method 2 of role assignment)
    """
    __tablename__ = "group_roles"
    metadata = platform_metadata
    
    id: str = Field(primary_key=True, index=True)
    group_id: str = Field(index=True)
    role_id: str = Field(index=True)
    tenant_id: str = Field(index=True)
    added_by: Optional[str] = Field(default=None)
    added_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    
    __table_args__ = (
        Index('ix_group_roles_group_role', 'group_id', 'role_id', unique=True),
        Index('ix_group_roles_group_tenant', 'group_id', 'tenant_id'),
        Index('ix_group_roles_role_tenant', 'role_id', 'tenant_id'),
    )


class UserPreferenceModel(SQLModel, table=True):
    """
    User preferences model - Platform database
    
    Stores all user preferences in a JSON format for flexibility.
    Preferences are organized by category (ui, dataDisplay, notifications, etc.)
    """
    __tablename__ = "user_preferences"
    metadata = platform_metadata
    
    id: str = Field(primary_key=True, index=True)
    user_id: str = Field(index=True)
    tenant_id: str = Field(index=True)
    
    # Store all preferences as JSON
    preferences: dict = Field(
        default_factory=dict,
        sa_column=Column(SQLJSON, nullable=False)
    )
    
    # Timestamps
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    
    __table_args__ = (
        Index('ix_user_preferences_user_tenant', 'user_id', 'tenant_id', unique=True),
        Index('ix_user_preferences_tenant', 'tenant_id'),
    )

