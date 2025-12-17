"""
API Key authentication dependencies for external system integration
"""
from typing import Optional, List
from fastapi import Header, HTTPException, status, Security
from fastapi.security import APIKeyHeader
from app.infrastructure.shared.security.api_key_handler import APIKey, api_key_handler


# API Key security scheme
api_key_header = APIKeyHeader(
    name="X-API-Key",
    scheme_name="APIKeyHeader",
    auto_error=False
)


async def get_api_key(
    x_api_key: Optional[str] = Security(api_key_header)
) -> APIKey:
    """Validate API key from header
    
    Args:
        x_api_key: API key from X-API-Key header
        
    Returns:
        Validated APIKey object
        
    Raises:
        HTTPException: 401 if API key is invalid or missing
    """
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key missing. Provide X-API-Key header.",
            headers={"WWW-Authenticate": "ApiKey"}
        )
    
    api_key = api_key_handler.validate_api_key(x_api_key)
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired API key",
            headers={"WWW-Authenticate": "ApiKey"}
        )
    
    return api_key


async def get_api_key_optional(
    x_api_key: Optional[str] = Security(api_key_header)
) -> Optional[APIKey]:
    """Get API key if provided, None otherwise
    
    Args:
        x_api_key: API key from X-API-Key header
        
    Returns:
        APIKey object if valid, None otherwise
    """
    if not x_api_key:
        return None
    
    return api_key_handler.validate_api_key(x_api_key)


class RequireAPIKeyPermission:
    """Dependency class to require specific API key permission"""
    
    def __init__(self, permission: str):
        """
        Args:
            permission: Required permission (e.g., "products:read", "orders:write")
        """
        self.permission = permission
    
    async def __call__(
        self,
        api_key: APIKey = Security(get_api_key)
    ) -> APIKey:
        """Check if API key has required permission
        
        Args:
            api_key: Validated API key
            
        Returns:
            API key if authorized
            
        Raises:
            HTTPException: 403 if API key lacks permission
        """
        if not api_key_handler.has_permission(api_key, self.permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"API key lacks required permission: {self.permission}"
            )
        return api_key


class RequireAnyAPIKeyPermission:
    """Dependency class to require any of the specified API key permissions"""
    
    def __init__(self, permissions: List[str]):
        """
        Args:
            permissions: List of permissions (any one is sufficient)
        """
        self.permissions = permissions
    
    async def __call__(
        self,
        api_key: APIKey = Security(get_api_key)
    ) -> APIKey:
        """Check if API key has any of the required permissions
        
        Args:
            api_key: Validated API key
            
        Returns:
            API key if authorized
            
        Raises:
            HTTPException: 403 if API key lacks all permissions
        """
        for permission in self.permissions:
            if api_key_handler.has_permission(api_key, permission):
                return api_key
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"API key lacks required permissions. Need one of: {', '.join(self.permissions)}"
        )

