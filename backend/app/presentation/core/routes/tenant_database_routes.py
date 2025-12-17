"""
Tenant database management API routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from app.presentation.api.core.tenant_database_api import (
    DatabaseConfigRequest, ProvisionDatabaseRequest,
    DatabaseHealthResponse, ProvisionDatabaseResponse
)
from app.infrastructure.shared.database.tenant_database_provisioner import TenantDatabaseProvisioner
from app.infrastructure.shared.database.tenant_connection_manager import get_connection_manager
from app.infrastructure.core.tenant.repository import SQLTenantRepository
from app.shared.database_strategy import TenantDatabaseConfig, DatabaseStrategy
from app.shared.exceptions import NotFoundError
from app.presentation.core.dependencies.auth_dependencies import RequireRole
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import UserRole
import re

router = APIRouter(prefix="/tenants", tags=["tenant-database"])


def _redact_connection_url(url: str) -> str:
    """Redact password from connection URL"""
    return re.sub(r'://([^:]+):([^@]+)@', r'://\1:***@', url)


@router.post("/{tenant_id}/database/provision", response_model=ProvisionDatabaseResponse)
async def provision_dedicated_database(
    tenant_id: str,
    request: ProvisionDatabaseRequest,
    current_user: AuthenticatedUser = Depends(RequireRole(UserRole.ADMIN))
):
    """
    Provision a dedicated database for a tenant
    
    **Requires:** Admin role and password change completed
    
    This will:
    1. Create a new PostgreSQL database
    2. Initialize the schema
    3. Register the connection with the tenant
    
    Requires admin database credentials to be configured.
    """
    try:
        # Get tenant
        tenant_repo = SQLTenantRepository()
        tenant = await tenant_repo.get_by_id(tenant_id)
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tenant '{tenant_id}' not found"
            )
        
        # Check if already using dedicated database
        if tenant.database_strategy == "dedicated_database":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tenant already has a dedicated database"
            )
        
        # Provision database
        provisioner = TenantDatabaseProvisioner()
        config = provisioner.create_database_for_tenant(
            tenant_id=tenant_id,
            database_name=request.database_name
        )
        
        # Update tenant configuration
        tenant.database_strategy = "dedicated_database"
        tenant.database_config = config.to_dict()
        await tenant_repo.save(tenant)
        
        return ProvisionDatabaseResponse(
            success=True,
            message="Database provisioned successfully",
            database_name=config.database_name,
            connection_url=_redact_connection_url(config.get_connection_url())
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to provision database: {str(e)}"
        )


@router.get("/{tenant_id}/database/health", response_model=DatabaseHealthResponse)
async def check_database_health(
    tenant_id: str,
    current_user: AuthenticatedUser = Depends(RequireRole(UserRole.ADMIN))
):
    """
    Check health of tenant's database
    
    **Requires:** Admin role and password change completed
    
    Returns information about:
    - Connection status
    - Database size
    - Table count
    - Database strategy
    """
    try:
        # Get tenant
        tenant_repo = SQLTenantRepository()
        tenant = await tenant_repo.get_by_id(tenant_id)
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tenant '{tenant_id}' not found"
            )
        
        # Get configuration
        if tenant.database_strategy == "shared_database":
            return DatabaseHealthResponse(
                status="healthy",
                strategy="shared_database",
                database_size="N/A (shared)",
                table_count=None
            )
        
        # Check dedicated database health
        config = TenantDatabaseConfig.from_dict(tenant.database_config)
        provisioner = TenantDatabaseProvisioner()
        health = provisioner.check_database_health(config)
        
        return DatabaseHealthResponse(**health)
        
    except Exception as e:
        return DatabaseHealthResponse(
            status="unhealthy",
            strategy=tenant.database_strategy if tenant else "unknown",
            error=str(e)
        )


@router.post("/{tenant_id}/database/migrate-to-dedicated", response_model=ProvisionDatabaseResponse)
async def migrate_to_dedicated_database(
    tenant_id: str,
    request: ProvisionDatabaseRequest,
    current_user: AuthenticatedUser = Depends(RequireRole(UserRole.ADMIN))
):
    """
    Migrate tenant from shared to dedicated database
    
    **Requires:** Admin role and password change completed
    
    ⚠️ WARNING: This operation:
    1. Creates a new dedicated database
    2. Requires manual data migration
    3. Updates tenant configuration
    
    Data migration must be handled separately.
    """
    try:
        # Get tenant
        tenant_repo = SQLTenantRepository()
        tenant = await tenant_repo.get_by_id(tenant_id)
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tenant '{tenant_id}' not found"
            )
        
        if tenant.database_strategy == "dedicated_database":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tenant already uses dedicated database"
            )
        
        # Migrate
        provisioner = TenantDatabaseProvisioner()
        config = provisioner.migrate_tenant_to_dedicated_database(
            tenant_id=tenant_id
        )
        
        # Update tenant
        tenant.database_strategy = "dedicated_database"
        tenant.database_config = config.to_dict()
        await tenant_repo.save(tenant)
        
        return ProvisionDatabaseResponse(
            success=True,
            message="Database created. Manual data migration required.",
            database_name=config.database_name,
            connection_url=_redact_connection_url(config.get_connection_url())
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to migrate database: {str(e)}"
        )


@router.delete("/{tenant_id}/database", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tenant_database(
    tenant_id: str,
    confirm: bool = False,
    current_user: AuthenticatedUser = Depends(RequireRole(UserRole.ADMIN))
):
    """
    Delete tenant's dedicated database
    
    **Requires:** Admin role and password change completed
    
    ⚠️ DANGER: This permanently deletes all tenant data!
    
    Requires confirm=true query parameter
    Only works for dedicated databases
    """
    if not confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must set confirm=true to delete database"
        )
    
    try:
        # Get tenant
        tenant_repo = SQLTenantRepository()
        tenant = await tenant_repo.get_by_id(tenant_id)
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tenant '{tenant_id}' not found"
            )
        
        if tenant.database_strategy != "dedicated_database":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tenant does not have a dedicated database"
            )
        
        # Get database name
        config = TenantDatabaseConfig.from_dict(tenant.database_config)
        
        # Delete database
        provisioner = TenantDatabaseProvisioner()
        success = provisioner.drop_database_for_tenant(
            tenant_id=tenant_id,
            database_name=config.database_name,
            force=True
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete database"
            )
        
        # Update tenant to shared database
        tenant.database_strategy = "shared_database"
        tenant.database_config = {}
        await tenant_repo.save(tenant)
        
        return None
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete database: {str(e)}"
        )

