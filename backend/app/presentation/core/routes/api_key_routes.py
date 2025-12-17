"""
API Key management routes
These endpoints allow administrators to create, list, and revoke API keys
"""
from typing import List
from fastapi import APIRouter, HTTPException, Depends, status
from app.presentation.api.core.api_key_schemas import (
    APIKeyCreate,
    APIKeyResponse,
    APIKeyCreatedResponse,
)
from app.infrastructure.shared.security.api_key_handler import api_key_handler, APIKey
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission
from app.presentation.core.dependencies.auth_dependencies import RequirePermission


router = APIRouter(prefix="/api-keys", tags=["API Keys"])


@router.post("/", response_model=APIKeyCreatedResponse, status_code=201)
async def create_api_key(
    key_data: APIKeyCreate,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.MANAGE_INTEGRATIONS))
):
    """Create a new API key for external system integration
    
    (requires MANAGE_INTEGRATIONS permission - Admin only)
    
    **Important**: The API key will only be shown once. Store it securely.
    
    Common permission patterns:
    - `products:read` - Read product data
    - `products:write` - Create/update products
    - `orders:read` - Read order data
    - `orders:write` - Create orders
    - `integrations:write` - Push to integrations
    - `*` - Full access (use with caution)
    """
    try:
        plain_key, api_key = api_key_handler.generate_api_key(
            name=key_data.name,
            description=key_data.description,
            expires_in_days=key_data.expires_in_days,
            permissions=key_data.permissions
        )
        
        return APIKeyCreatedResponse(
            api_key=plain_key,
            key_id=api_key.key_id,
            name=api_key.name,
            description=api_key.description,
            created_at=api_key.created_at,
            expires_at=api_key.expires_at,
            permissions=api_key.permissions,
            message="Store this API key securely. It will not be shown again."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create API key: {str(e)}"
        )


@router.get("/", response_model=List[APIKeyResponse])
async def list_api_keys(
    include_inactive: bool = False,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.MANAGE_INTEGRATIONS))
):
    """List all API keys (requires MANAGE_INTEGRATIONS permission - Admin only)
    
    Args:
        include_inactive: Include inactive/revoked keys in the list
    """
    try:
        api_keys = api_key_handler.list_api_keys(include_inactive=include_inactive)
        
        return [
            APIKeyResponse(
                key_id=key.key_id,
                name=key.name,
                description=key.description,
                created_at=key.created_at,
                expires_at=key.expires_at,
                is_active=key.is_active,
                permissions=key.permissions,
                last_used_at=key.last_used_at
            )
            for key in api_keys
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list API keys: {str(e)}"
        )


@router.get("/{key_id}", response_model=APIKeyResponse)
async def get_api_key(
    key_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.MANAGE_INTEGRATIONS))
):
    """Get API key details by ID (requires MANAGE_INTEGRATIONS permission - Admin only)"""
    try:
        api_key = api_key_handler.get_api_key(key_id)
        
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found"
            )
        
        return APIKeyResponse(
            key_id=api_key.key_id,
            name=api_key.name,
            description=api_key.description,
            created_at=api_key.created_at,
            expires_at=api_key.expires_at,
            is_active=api_key.is_active,
            permissions=api_key.permissions,
            last_used_at=api_key.last_used_at
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get API key: {str(e)}"
        )


@router.delete("/{key_id}", status_code=204)
async def revoke_api_key(
    key_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.MANAGE_INTEGRATIONS))
):
    """Revoke an API key (requires MANAGE_INTEGRATIONS permission - Admin only)
    
    Revoked keys cannot be reactivated. Create a new key if needed.
    """
    try:
        success = api_key_handler.revoke_api_key(key_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found"
            )
        
        return None  # 204 No Content
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to revoke API key: {str(e)}"
        )

