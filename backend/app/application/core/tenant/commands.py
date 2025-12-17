"""
Tenant commands for multi-tenancy management
"""
from dataclasses import dataclass
from typing import Optional


@dataclass
class CreateTenantCommand:
    """Command to create a new tenant"""
    name: str
    slug: Optional[str] = None
    settings: dict = None
    
    def __post_init__(self):
        if self.settings is None:
            self.settings = {}


@dataclass
class UpdateTenantCommand:
    """Command to update an existing tenant"""
    tenant_id: str
    name: Optional[str] = None
    slug: Optional[str] = None
    settings: Optional[dict] = None


@dataclass
class DeactivateTenantCommand:
    """Command to deactivate a tenant"""
    tenant_id: str


@dataclass
class ActivateTenantCommand:
    """Command to activate a tenant"""
    tenant_id: str


@dataclass
class DeleteTenantCommand:
    """Command to delete a tenant"""
    tenant_id: str


@dataclass
class CreateTenantWithAdminCommand:
    """Command to create tenant with admin user atomically"""
    # Required fields (no defaults) - MUST come first
    tenant_name: str
    admin_email: str
    admin_password: str
    admin_name: str
    
    # Optional fields (with defaults) - MUST come after required fields
    tenant_slug: Optional[str] = None
    tenant_settings: Optional[dict] = None
    admin_username: Optional[str] = None  # Optional, can derive from email
    
    def __post_init__(self):
        if self.tenant_settings is None:
            self.tenant_settings = {}
        
        # Auto-generate username from email if not provided
        if not self.admin_username:
            self.admin_username = self.admin_email.split('@')[0]

