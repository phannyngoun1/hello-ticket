"""
Tenant database management API DTOs
"""
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class DatabaseStrategyEnum(str, Enum):
    """Database strategy options"""
    SHARED = "shared_database"
    DEDICATED = "dedicated_database"


class DatabaseConfigRequest(BaseModel):
    """Request to configure tenant database"""
    strategy: DatabaseStrategyEnum = Field(..., description="Database isolation strategy")
    database_name: Optional[str] = Field(None, description="Database name for dedicated strategy")
    host: Optional[str] = Field(None, description="Database host")
    port: Optional[int] = Field(None, description="Database port")
    username: Optional[str] = Field(None, description="Database username")
    password: Optional[str] = Field(None, description="Database password (will be securely stored)")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "strategy": "dedicated_database",
                "database_name": "tenant_acme_corp",
                "host": "localhost",
                "port": 5432,
                "username": "tenant_user",
                "password": "secure_password"
            }
        }
    }


class ProvisionDatabaseRequest(BaseModel):
    """Request to provision a dedicated database"""
    database_name: Optional[str] = Field(None, description="Custom database name (optional)")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "database_name": "tenant_acme_corp"
            }
        }
    }


class DatabaseHealthResponse(BaseModel):
    """Database health check response"""
    status: str
    database_size: Optional[str] = None
    table_count: Optional[int] = None
    strategy: str
    error: Optional[str] = None
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "status": "healthy",
                "database_size": "156 MB",
                "table_count": 12,
                "strategy": "dedicated_database"
            }
        }
    }


class ProvisionDatabaseResponse(BaseModel):
    """Response after provisioning database"""
    success: bool
    message: str
    database_name: str
    connection_url: Optional[str] = None  # Redacted for security
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Database provisioned successfully",
                "database_name": "tenant_acme_corp",
                "connection_url": "postgresql://***:***@localhost:5432/tenant_acme_corp"
            }
        }
    }

