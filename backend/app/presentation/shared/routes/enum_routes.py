"""
Enum API Routes

Provides endpoints to fetch enum values, labels, and options for frontend use.
Supports tenant-specific extensions and internationalization.
"""
from typing import Optional, Dict, List, Any, Type
from fastapi import APIRouter, Query, Depends
from pydantic import BaseModel
from enum import Enum

from app.shared.enums import (
    StatusEnum,
    UnitOfMeasureEnum,
    CustomerTypeEnum,
    TransactionTypeEnum,
    get_enum_values,
    get_enum_names,
    is_valid_enum_value,
)
from app.shared.enum_extensions import (
    get_tenant_enum_values,
    get_tenant_enum_metadata,
    is_valid_tenant_enum_value,
)
from app.shared.enum_i18n import (
    get_enum_label,
    get_enum_labels,
    get_enum_options,
    get_available_locales,
)
from app.shared.tenant_context import get_tenant_context
from app.presentation.core.dependencies.auth_dependencies import get_current_user_optional

router = APIRouter(prefix="/enums", tags=["enums"])

# Map enum names to enum classes for dynamic lookup
ENUM_REGISTRY: Dict[str, Type[Enum]] = {
    "status": StatusEnum,
    "unit_of_measure": UnitOfMeasureEnum,
    "customer_type": CustomerTypeEnum,
    "transaction_type": TransactionTypeEnum,
}


class EnumValuesResponse(BaseModel):
    """Response containing enum values"""
    enum_name: str
    values: List[str]
    tenant_extensions: List[str] = []
    is_tenant_specific: bool = False


class EnumOptionsResponse(BaseModel):
    """Response containing enum options for dropdowns"""
    enum_name: str
    options: List[Dict[str, str]]  # [{"value": "...", "label": "..."}, ...]
    locale: str


class EnumMetadataResponse(BaseModel):
    """Response containing enum metadata"""
    enum_name: str
    values: List[str]
    base_values: List[str]
    extensions: List[str]
    is_tenant_specific: bool
    labels: Optional[Dict[str, str]] = None


class EnumLabelResponse(BaseModel):
    """Response containing translated label for an enum value"""
    enum_name: str
    value: str
    label: str
    locale: str


@router.get("/", response_model=Dict[str, List[str]])
async def list_available_enums():
    """
    List all available enum types.
    
    Returns:
        Dictionary mapping enum names to their available values
    """
    return {
        enum_name: get_enum_values(enum_class)
        for enum_name, enum_class in ENUM_REGISTRY.items()
    }


@router.get("/{enum_name}/values", response_model=EnumValuesResponse)
async def get_enum_values_endpoint(
    enum_name: str,
    tenant_id: Optional[str] = Query(None, description="Optional tenant ID for tenant-specific extensions"),
    user=Depends(get_current_user_optional),
):
    """
    Get enum values (base + tenant extensions if tenant provided).
    
    Args:
        enum_name: Name of the enum (e.g., "status", "unit_of_measure")
        tenant_id: Optional tenant ID for tenant-specific extensions
        
    Returns:
        Enum values response with base values and tenant extensions
    """
    enum_class = ENUM_REGISTRY.get(enum_name)
    if not enum_class:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=404,
            detail=f"Enum '{enum_name}' not found. Available: {list(ENUM_REGISTRY.keys())}"
        )
    
    # Use tenant_id from query or from authenticated user context
    if not tenant_id and user:
        tenant_id = user.tenant_id
    
    # Get tenant-specific values if tenant_id provided
    if tenant_id:
        values = get_tenant_enum_values(tenant_id, enum_class)
        metadata = get_tenant_enum_metadata(tenant_id, enum_class)
        return EnumValuesResponse(
            enum_name=enum_name,
            values=values,
            tenant_extensions=metadata["extensions"],
            is_tenant_specific=metadata["is_tenant_specific"],
        )
    else:
        # Base values only
        values = get_enum_values(enum_class)
        return EnumValuesResponse(
            enum_name=enum_name,
            values=values,
            tenant_extensions=[],
            is_tenant_specific=False,
        )


@router.get("/{enum_name}/options", response_model=EnumOptionsResponse)
async def get_enum_options_endpoint(
    enum_name: str,
    locale: str = Query("en", description="Locale code (e.g., 'en', 'es', 'fr')"),
    tenant_id: Optional[str] = Query(None, description="Optional tenant ID for tenant-specific extensions"),
    user=Depends(get_current_user_optional),
):
    """
    Get enum options with translated labels for dropdowns/selects.
    
    Args:
        enum_name: Name of the enum (e.g., "status", "unit_of_measure")
        locale: Locale code for translations (default: "en")
        tenant_id: Optional tenant ID for tenant-specific extensions
        
    Returns:
        Enum options with value/label pairs
    """
    enum_class = ENUM_REGISTRY.get(enum_name)
    if not enum_class:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=404,
            detail=f"Enum '{enum_name}' not found. Available: {list(ENUM_REGISTRY.keys())}"
        )
    
    # Use tenant_id from query or from authenticated user context
    if not tenant_id and user:
        tenant_id = user.tenant_id
    
    options = get_enum_options(enum_class, locale=locale, tenant_id=tenant_id)
    
    return EnumOptionsResponse(
        enum_name=enum_name,
        options=options,
        locale=locale,
    )


@router.get("/{enum_name}/labels", response_model=Dict[str, str])
async def get_enum_labels_endpoint(
    enum_name: str,
    locale: str = Query("en", description="Locale code (e.g., 'en', 'es', 'fr')"),
):
    """
    Get all translated labels for an enum.
    
    Args:
        enum_name: Name of the enum (e.g., "status", "unit_of_measure")
        locale: Locale code for translations (default: "en")
        
    Returns:
        Dictionary mapping enum values to their translated labels
    """
    enum_class = ENUM_REGISTRY.get(enum_name)
    if not enum_class:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=404,
            detail=f"Enum '{enum_name}' not found. Available: {list(ENUM_REGISTRY.keys())}"
        )
    
    return get_enum_labels(enum_class, locale=locale)


@router.get("/{enum_name}/metadata", response_model=EnumMetadataResponse)
async def get_enum_metadata_endpoint(
    enum_name: str,
    locale: Optional[str] = Query(None, description="Optional locale for labels"),
    tenant_id: Optional[str] = Query(None, description="Optional tenant ID for tenant-specific extensions"),
    user=Depends(get_current_user_optional),
):
    """
    Get detailed metadata about an enum, including base values, extensions, and labels.
    
    Args:
        enum_name: Name of the enum (e.g., "status", "unit_of_measure")
        locale: Optional locale code for labels
        tenant_id: Optional tenant ID for tenant-specific extensions
        
    Returns:
        Enum metadata with values, extensions, and optional labels
    """
    enum_class = ENUM_REGISTRY.get(enum_name)
    if not enum_class:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=404,
            detail=f"Enum '{enum_name}' not found. Available: {list(ENUM_REGISTRY.keys())}"
        )
    
    # Use tenant_id from query or from authenticated user context
    if not tenant_id and user:
        tenant_id = user.tenant_id
    
    metadata = get_tenant_enum_metadata(tenant_id, enum_class)
    
    # Add labels if locale provided
    labels = None
    if locale:
        labels = get_enum_labels(enum_class, locale=locale)
    
    return EnumMetadataResponse(
        enum_name=enum_name,
        values=metadata["values"],
        base_values=metadata["base_values"],
        extensions=metadata["extensions"],
        is_tenant_specific=metadata["is_tenant_specific"],
        labels=labels,
    )


@router.get("/{enum_name}/validate", response_model=Dict[str, bool])
async def validate_enum_value(
    enum_name: str,
    value: str = Query(..., description="Value to validate"),
    tenant_id: Optional[str] = Query(None, description="Optional tenant ID for tenant-specific validation"),
    user=Depends(get_current_user_optional),
):
    """
    Validate if a value is valid for an enum (base + tenant extensions if tenant provided).
    
    Args:
        enum_name: Name of the enum (e.g., "status", "unit_of_measure")
        value: Value to validate
        tenant_id: Optional tenant ID for tenant-specific validation
        
    Returns:
        Dictionary with validation result
    """
    enum_class = ENUM_REGISTRY.get(enum_name)
    if not enum_class:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=404,
            detail=f"Enum '{enum_name}' not found. Available: {list(ENUM_REGISTRY.keys())}"
        )
    
    # Use tenant_id from query or from authenticated user context
    if not tenant_id and user:
        tenant_id = user.tenant_id
    
    is_valid = is_valid_tenant_enum_value(tenant_id, enum_class, value) if tenant_id else is_valid_enum_value(enum_class, value)
    
    return {
        "valid": is_valid,
        "enum_name": enum_name,
        "value": value,
    }


@router.get("/locales", response_model=List[str])
async def get_available_locales_endpoint():
    """
    Get list of available locales for translations.
    
    Returns:
        List of locale codes (e.g., ["en", "es", "fr"])
    """
    return get_available_locales()

