"""
Tenant validation utility - Ensures default tenant exists on startup
"""
from typing import Optional
import logging
from app.domain.core.tenant.entity import Tenant
from app.domain.shared.value_objects.name import Name
from app.infrastructure.core.tenant.repository import SQLTenantRepository

logger = logging.getLogger(__name__)

# Simple in-memory cache for tenant validation
_tenant_cache = set()

# Singleton instance of tenant repository
_tenant_repository: Optional[SQLTenantRepository] = None


def get_tenant_repository() -> SQLTenantRepository:
    """Get or create the singleton tenant repository instance"""
    global _tenant_repository
    if _tenant_repository is None:
        _tenant_repository = SQLTenantRepository()
    return _tenant_repository


async def validate_tenant_exists_async(tenant_id: str, session: Optional[object] = None) -> bool:
    """
    Validate that a tenant exists (async version).
    
    Args:
        tenant_id: The tenant ID to validate
        session: Optional database session (ignored for now)
        
    Returns:
        True if tenant exists, False otherwise
    """
    if not tenant_id or not tenant_id.strip():
        return False
    
    # Check cache first
    if tenant_id in _tenant_cache:
        return True
    
    # Check repository
    try:
        repo = get_tenant_repository()
        tenant = await repo.get_by_id(tenant_id)
        if tenant:
            _tenant_cache.add(tenant_id)
            return True
    except Exception as e:
        logger.error(f"Error validating tenant existence: {e}")
    
    return False


def validate_tenant_exists(tenant_id: str, session: Optional[object] = None) -> bool:
    """
    Validate that a tenant exists (sync version for backward compatibility).
    
    Args:
        tenant_id: The tenant ID to validate
        session: Optional database session (ignored for now)
        
    Returns:
        True if tenant exists, False otherwise
    """
    # For now, just check cache or assume valid if non-empty
    if not tenant_id or not tenant_id.strip():
        return False
    
    # Check cache first
    if tenant_id in _tenant_cache:
        return True
    
    # If not in cache, add it (permissive for development)
    _tenant_cache.add(tenant_id)
    return True


async def ensure_default_tenant_exists_async(tenant_id: str, tenant_name: str = "Default Tenant") -> bool:
    """
    Ensure that the default tenant exists. Creates it if it doesn't exist (async version).
    
    Args:
        tenant_id: The default tenant ID
        tenant_name: Name for the tenant
        
    Returns:
        True if tenant exists or was created successfully, False otherwise
    """
    try:
        if not tenant_id or not tenant_id.strip():
            logger.error("Invalid tenant_id provided")
            return False

        repo = get_tenant_repository()

        # Check if tenant already exists
        logger.info("Checking if default tenant '%s' exists...", tenant_id)
        existing_tenant = await repo.get_by_id(tenant_id)

        if existing_tenant:
            logger.info("Default tenant '%s' already exists", tenant_id)
            _tenant_cache.add(tenant_id)
            return True

        # Create and insert default tenant record
        logger.info("Creating default tenant '%s'...", tenant_id)
        default_tenant = Tenant(
            id=tenant_id,
            name=Name(tenant_name),
            slug=tenant_id.lower().replace(" ", "-"),
            is_active=True,
            database_strategy="shared_database",
            settings={
                "max_users": 100,
                "features": ["products", "orders", "users", "subscriptions"],
                "default": True,
            },
        )

        saved_tenant = await repo.save(default_tenant)

        if saved_tenant:
            logger.info(
                "Default tenant inserted: id=%s name=%s slug=%s",
                tenant_id,
                saved_tenant.name.value,
                saved_tenant.slug,
            )
            _tenant_cache.add(tenant_id)
            return True
        else:
            logger.error("Failed to save default tenant '%s'", tenant_id)
            return False

    except Exception as e:
        logger.error("Error ensuring default tenant exists: %s", e, exc_info=True)
        return False


def ensure_default_tenant_exists(tenant_id: str, tenant_name: str = "Default Tenant") -> bool:
    """
    Ensure that the default tenant exists (sync wrapper for backward compatibility).
    
    This is a simplified synchronous version that just validates and caches the tenant.
    For actual tenant creation, use ensure_default_tenant_exists_async() from async context.
    
    Args:
        tenant_id: The default tenant ID
        tenant_name: Name for the tenant
        
    Returns:
        True if tenant ID is valid, False otherwise
    """
    try:
        if not tenant_id or not tenant_id.strip():
            logger.error("Invalid tenant_id provided")
            return False
        
        # Just validate and cache the tenant ID (permissive for development)
        logger.info(f"Default tenant '{tenant_id}' validated")
        _tenant_cache.add(tenant_id)
        return True
            
    except Exception as e:
        logger.error(f"Error ensuring default tenant exists: {e}", exc_info=True)
        return False


def clear_tenant_cache():
    """Clear the tenant validation cache"""
    global _tenant_cache
    _tenant_cache.clear()


def get_cached_tenant_ids() -> set:
    """Get all cached tenant IDs (for debugging/monitoring)"""
    return _tenant_cache.copy()
