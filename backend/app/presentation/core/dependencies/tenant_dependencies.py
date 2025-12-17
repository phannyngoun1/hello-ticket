"""
Tenant identification dependencies for FastAPI Swagger UI

These dependencies are OPTIONAL and only needed if you want to explicitly 
show X-Tenant-ID in endpoint documentation. The TenantMiddleware automatically 
handles X-Tenant-ID extraction from headers.
"""
from typing import Optional
from fastapi import Header, Security
from fastapi.security import APIKeyHeader


# API Key security scheme for X-Tenant-ID
# This makes X-Tenant-ID appear in Swagger UI's "Authorize" dialog
tenant_header_scheme = APIKeyHeader(
    name="X-Tenant-ID",
    scheme_name="TenantAuth",
    auto_error=False,
    description="Tenant identifier for multi-tenancy. Use 'default-tenant' for testing."
)


async def get_tenant_id_optional(
    x_tenant_id: Optional[str] = Security(tenant_header_scheme)
) -> Optional[str]:
    """
    Optional dependency to get tenant ID from header.
    
    This is purely for Swagger UI documentation purposes.
    The actual tenant extraction is handled by TenantMiddleware.
    
    Args:
        x_tenant_id: Tenant ID from X-Tenant-ID header
        
    Returns:
        Tenant ID if provided, None otherwise
        
    Usage:
        @router.get("/example")
        async def example(tenant_id: Optional[str] = Depends(get_tenant_id_optional)):
            # tenant_id from dependency (for documentation)
            # Actual tenant is available via tenant_context
            pass
    """
    return x_tenant_id


async def get_tenant_id_from_header(
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID")
) -> Optional[str]:
    """
    Alternative: Get tenant ID directly from Header.
    
    This is a simpler approach that doesn't use the security scheme.
    Use this if you want the header to appear in endpoint parameters
    instead of the global "Authorize" dialog.
    
    Args:
        x_tenant_id: Tenant ID from X-Tenant-ID header
        
    Returns:
        Tenant ID if provided, None otherwise
    """
    return x_tenant_id
