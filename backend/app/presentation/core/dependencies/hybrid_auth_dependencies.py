"""
Hybrid authentication dependencies that support both JWT and API key authentication
"""
from typing import Optional, Union
from fastapi import Depends, HTTPException, status
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.infrastructure.shared.security.api_key_handler import APIKey
from app.presentation.core.dependencies.auth_dependencies import (
    get_current_user_optional,
    RequirePermission
)
from app.presentation.core.dependencies.api_key_dependencies import (
    get_api_key_optional
)


class RequireAnyAuth:
    """Dependency that accepts either JWT or API key authentication"""
    
    def __init__(self, permission: Optional[str] = None):
        """
        Args:
            permission: Optional permission to check (for API keys only)
        """
        self.permission = permission
    
    async def __call__(
        self,
        current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
        api_key: Optional[APIKey] = Depends(get_api_key_optional)
    ) -> Union[AuthenticatedUser, APIKey]:
        """Check if user has JWT or API key authentication
        
        Args:
            current_user: JWT authenticated user (optional)
            api_key: API key authenticated user (optional)
            
        Returns:
            Either AuthenticatedUser or APIKey if authenticated
            
        Raises:
            HTTPException: 401 if neither authentication method is valid
        """
        # Check JWT authentication first
        if current_user:
            return current_user
        
        # Check API key authentication
        if api_key:
            # If permission is specified, check API key permissions
            if self.permission:
                from app.infrastructure.shared.security.api_key_handler import api_key_handler
                if not api_key_handler.has_permission(api_key, self.permission):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"API key lacks required permission: {self.permission}"
                    )
            return api_key
        
        # Neither authentication method succeeded
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Provide either Bearer token or X-API-Key header.",
            headers={"WWW-Authenticate": "Bearer, ApiKey"}
        )


