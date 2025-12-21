"""
Tenant-Specific Enum Extensions

This module provides a hybrid approach for handling tenant-specific enum values.
Base enum values are defined in enums.py, but tenants can extend or override
these values through configuration stored in tenant settings.

Usage:
    # Get enum values for a tenant (includes base + tenant extensions)
    tenant_values = get_tenant_enum_values(tenant_id, StatusEnum)
    
    # Check if a value is valid for a tenant
    is_valid = is_valid_tenant_enum_value(tenant_id, StatusEnum, "custom_status")
"""

from typing import Optional, List, Dict, Any, Type
from enum import Enum
from app.shared.enums import (
    StatusEnum,
    UnitOfMeasureEnum,
    CustomerTypeEnum,
    TransactionTypeEnum,
    # Add other enums as needed
)
from app.shared.tenant_context import get_tenant_context
import logging

logger = logging.getLogger(__name__)

# Map enum classes to their setting keys in tenant configuration
ENUM_SETTING_KEYS: Dict[Type[Enum], str] = {
    StatusEnum: "enum_extensions.status",
    UnitOfMeasureEnum: "enum_extensions.unit_of_measure",
    CustomerTypeEnum: "enum_extensions.customer_type",
    TransactionTypeEnum: "enum_extensions.transaction_type",
    # Add mappings for other enums as needed
}


def get_tenant_settings(tenant_id: str) -> Dict[str, Any]:
    """
    Get tenant settings dictionary.
    
    This is a placeholder - you should implement actual tenant settings retrieval
    from your tenant repository or service.
    
    Args:
        tenant_id: Tenant identifier
        
    Returns:
        Dictionary of tenant settings
    """
    # TODO: Implement actual tenant settings retrieval
    # Example:
    # from app.infrastructure.core.tenant.repository import SQLTenantRepository
    # repo = SQLTenantRepository()
    # tenant = repo.get_by_id(tenant_id)
    # return tenant.settings if tenant else {}
    
    return {}


def get_tenant_enum_extensions(tenant_id: str, enum_class: Type[Enum]) -> List[str]:
    """
    Get tenant-specific enum extensions for a given enum class.
    
    Args:
        tenant_id: Tenant identifier
        enum_class: Enum class to get extensions for
        
    Returns:
        List of additional enum values (strings) for this tenant
    """
    setting_key = ENUM_SETTING_KEYS.get(enum_class)
    if not setting_key:
        return []
    
    settings = get_tenant_settings(tenant_id)
    
    # Navigate nested keys (e.g., "enum_extensions.status")
    keys = setting_key.split(".")
    value = settings
    for key in keys:
        if isinstance(value, dict):
            value = value.get(key, {})
        else:
            return []
    
    # Value should be a list of strings
    if isinstance(value, list):
        return [str(v) for v in value if isinstance(v, (str, int))]
    
    return []


def get_tenant_enum_values(tenant_id: Optional[str], enum_class: Type[Enum]) -> List[str]:
    """
    Get all enum values for a tenant (base enum values + tenant extensions).
    
    Args:
        tenant_id: Tenant identifier (optional, uses current context if not provided)
        enum_class: Enum class to get values for
        
    Returns:
        List of all valid enum values (base + tenant extensions)
    """
    # Get base enum values
    base_values = [e.value for e in enum_class]
    
    # If no tenant_id provided, try to get from context
    if not tenant_id:
        from app.shared.tenant_context import get_tenant_context
        context = get_tenant_context()
        tenant_id = context.tenant_id if context else None
    
    # If still no tenant_id, return only base values
    if not tenant_id:
        return base_values
    
    # Get tenant-specific extensions
    extensions = get_tenant_enum_extensions(tenant_id, enum_class)
    
    # Combine base values with extensions (extensions come first for priority)
    all_values = list(extensions) + base_values
    
    # Remove duplicates while preserving order
    seen = set()
    unique_values = []
    for value in all_values:
        if value not in seen:
            seen.add(value)
            unique_values.append(value)
    
    return unique_values


def is_valid_tenant_enum_value(
    tenant_id: Optional[str],
    enum_class: Type[Enum],
    value: str
) -> bool:
    """
    Check if a value is valid for a tenant's enum (base values + tenant extensions).
    
    Args:
        tenant_id: Tenant identifier (optional, uses current context if not provided)
        enum_class: Enum class to validate against
        value: Value to validate
        
    Returns:
        True if value is valid for the tenant, False otherwise
    """
    valid_values = get_tenant_enum_values(tenant_id, enum_class)
    return value in valid_values


def get_tenant_enum_metadata(
    tenant_id: Optional[str],
    enum_class: Type[Enum]
) -> Dict[str, Any]:
    """
    Get metadata about enum values for a tenant, including which are base vs extensions.
    
    Args:
        tenant_id: Tenant identifier (optional)
        enum_class: Enum class to get metadata for
        
    Returns:
        Dictionary with enum metadata:
        {
            "values": [...],
            "base_values": [...],
            "extensions": [...],
            "labels": {...}  # If available
        }
    """
    base_values = [e.value for e in enum_class]
    extensions = []
    
    if tenant_id:
        extensions = get_tenant_enum_extensions(tenant_id, enum_class)
    
    all_values = get_tenant_enum_values(tenant_id, enum_class)
    
    return {
        "values": all_values,
        "base_values": base_values,
        "extensions": extensions,
        "is_tenant_specific": len(extensions) > 0,
    }


def set_tenant_enum_extensions(
    tenant_id: str,
    enum_class: Type[Enum],
    extensions: List[str]
) -> None:
    """
    Set tenant-specific enum extensions.
    
    This is a placeholder - you should implement actual tenant settings update
    through your tenant service/repository.
    
    Args:
        tenant_id: Tenant identifier
        enum_class: Enum class to set extensions for
        extensions: List of additional enum values (strings)
        
    Raises:
        ValueError: If extensions contain invalid values
    """
    setting_key = ENUM_SETTING_KEYS.get(enum_class)
    if not setting_key:
        raise ValueError(f"Enum {enum_class.__name__} does not support tenant extensions")
    
    # Validate extensions don't conflict with base values
    base_values = [e.value for e in enum_class]
    conflicts = [ext for ext in extensions if ext in base_values]
    if conflicts:
        raise ValueError(
            f"Extensions conflict with base enum values: {conflicts}. "
            "Extensions should only add new values, not override base ones."
        )
    
    # TODO: Implement actual tenant settings update
    # Example:
    # from app.application.core.tenant.commands import UpdateTenantCommand
    # from app.application.core.tenant.handlers import TenantCommandHandler
    # 
    # settings = get_tenant_settings(tenant_id)
    # keys = setting_key.split(".")
    # # Navigate and update nested settings
    # # Then use tenant service to update
    
    logger.warning(
        f"set_tenant_enum_extensions not fully implemented. "
        f"Would set {setting_key} = {extensions} for tenant {tenant_id}"
    )

