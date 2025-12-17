"""
Tenant API DTOs for multi-tenancy management
"""
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
import re


class CreateTenantRequest(BaseModel):
    """Request to create a new tenant"""
    name: str = Field(..., min_length=1, max_length=100, description="Tenant name")
    slug: Optional[str] = Field(None, min_length=1, max_length=100, description="URL-friendly identifier")
    settings: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Tenant settings")

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "Acme Corporation",
                "slug": "acme-corp",
                "settings": {
                    "timezone": "UTC",
                    "currency": "USD"
                }
            }
        }
    }


class UpdateTenantRequest(BaseModel):
    """Request to update a tenant"""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Tenant name")
    slug: Optional[str] = Field(None, min_length=1, max_length=100, description="URL-friendly identifier")
    settings: Optional[Dict[str, Any]] = Field(None, description="Tenant settings")

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "Acme Corporation Updated",
                "slug": "acme-corp-updated",
                "settings": {
                    "timezone": "America/New_York",
                    "currency": "USD"
                }
            }
        }
    }


class TenantResponse(BaseModel):
    """Tenant response"""
    id: str
    name: str
    slug: Optional[str] = None
    is_active: bool
    settings: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "tenant_abc123",
                "name": "Acme Corporation",
                "slug": "acme-corp",
                "is_active": True,
                "settings": {
                    "timezone": "UTC",
                    "currency": "USD"
                },
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            }
        }
    }


class TenantListResponse(BaseModel):
    """List of tenants response"""
    tenants: list[TenantResponse]
    total: int
    skip: int
    limit: int


class CreateTenantWithAdminRequest(BaseModel):
    """Request to create tenant with admin user (self-service signup)"""
    # Tenant info
    company_name: str = Field(..., min_length=1, max_length=100, description="Company/Organization name")
    slug: Optional[str] = Field(None, min_length=3, max_length=50, description="URL-friendly identifier")
    
    # Admin user info
    admin_email: str = Field(..., description="Admin user email address")
    admin_password: str = Field(..., min_length=8, description="Admin password (min 8 characters)")
    admin_name: str = Field(..., min_length=1, max_length=100, description="Admin full name")
    admin_username: Optional[str] = Field(None, min_length=3, max_length=50, description="Admin username (optional, derived from email if not provided)")
    
    @field_validator('admin_password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password meets security requirements"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one number')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character (!@#$%^&*...)')
        return v
    
    @field_validator('admin_email')
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        """Validate email format"""
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, v):
            raise ValueError('Invalid email format')
        return v.lower()  # Normalize to lowercase
    
    @field_validator('slug')
    @classmethod
    def validate_slug_format(cls, v: Optional[str]) -> Optional[str]:
        """Validate slug is URL-friendly"""
        if v is None:
            return v
        slug_pattern = r'^[a-z0-9-]+$'
        if not re.match(slug_pattern, v):
            raise ValueError('Slug must contain only lowercase letters, numbers, and hyphens')
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "company_name": "Acme Corporation",
                "slug": "acme-corp",
                "admin_email": "john@acme.com",
                "admin_password": "SecurePass123!",
                "admin_name": "John Doe",
                "admin_username": "john"
            }
        }
    }


class TenantWithAdminResponse(BaseModel):
    """Response after creating tenant with admin"""
    tenant: TenantResponse
    admin_user: Dict[str, Any]  # Basic user info
    access_token: str  # Can login immediately!
    refresh_token: str
    id_token: str
    token_type: str = "bearer"
    message: str = "Tenant and admin user created successfully. You can now login!"
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "tenant": {
                    "id": "tenant_abc123",
                    "name": "Acme Corporation",
                    "slug": "acme-corp",
                    "is_active": True,
                    "settings": {},
                    "created_at": "2024-01-01T00:00:00Z",
                    "updated_at": "2024-01-01T00:00:00Z"
                },
                "admin_user": {
                    "id": "user_xyz789",
                    "username": "john",
                    "email": "john@acme.com",
                    "name": "John Doe",
                    "role": "admin"
                },
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "id_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "message": "Tenant and admin user created successfully. You can now login!"
            }
        }
    }

