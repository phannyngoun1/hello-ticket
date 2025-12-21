"""
Authentication and authorization dependencies for FastAPI
"""
from typing import List, Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from fastapi.security.utils import get_authorization_scheme_param
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission, UserRole
from app.application.core.auth import AuthService
from app.application.core.user import UserPermissionService
from app.infrastructure.core.rbac.role_repository import RoleRepository
from app.infrastructure.core.rbac.group_repository import GroupRepository
from app.infrastructure.shared.database.platform_connection import get_platform_session
from app.shared.container import container


# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/token",
    scheme_name="OAuth2PasswordBearer"
)

# OAuth2 scheme with auto_error=False for optional authentication
oauth2_scheme_optional = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/token",
    scheme_name="OAuth2PasswordBearer",
    auto_error=False
)


async def get_token_from_header(request: Request) -> str:
    """Extract token from Authorization header manually
    Useful for multipart/form-data requests where OAuth2PasswordBearer might have issues
    
    Uses the same token extraction logic as OAuth2PasswordBearer for consistency.
    
    Args:
        request: FastAPI request object
        
    Returns:
        Token string
        
    Raises:
        HTTPException: 401 if token is missing or invalid format
    """
    authorization = request.headers.get("Authorization")
    scheme, param = get_authorization_scheme_param(authorization)
    
    if not authorization or scheme.lower() != "bearer" or not param:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Strip any whitespace from the token
    return param.strip()


def get_auth_service() -> AuthService:
    """Get authentication service from container"""
    return container.resolve(AuthService)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    auth_service: AuthService = Depends(get_auth_service)
) -> AuthenticatedUser:
    """Get current authenticated user with all permissions loaded
    
    Args:
        token: JWT access token
        auth_service: Authentication service
        
    Returns:
        Current authenticated user with permissions from roles and groups
        
    Raises:
        HTTPException: 401 if authentication fails
    """
    try:
        # Get user from token
        user = await auth_service.get_current_user(token)
        
        # Load permissions from roles and groups
        try:
            platform_session = get_platform_session()
            role_repository = RoleRepository(platform_session)
            group_repository = GroupRepository(platform_session)
            permission_service = UserPermissionService(role_repository, group_repository)
            
            # Load group permissions and custom role permissions
            group_perms, custom_role_perms = await permission_service.load_user_permissions(
                user.id,
                user.tenant_id
            )
            
            # Set permissions on user
            user.set_group_permissions(group_perms)
            user.set_custom_role_permissions(custom_role_perms)
            
            # Close the session
            await platform_session.close()
        except Exception as perm_error:
            # Log error but continue - user still has base role permissions
            import logging
            logging.warning(f"Failed to load user permissions: {perm_error}")
        
        return user
    except Exception as e:
        # Log the actual error for debugging
        import logging
        logging.warning(f"Authentication failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_active_user(
    current_user: AuthenticatedUser = Depends(get_current_user)
) -> AuthenticatedUser:
    """Get current active user (checks password change requirement)
    
    This dependency enforces that users with must_change_password=True
    can only access the change-password endpoint.
    
    Args:
        current_user: Current user from token
        
    Returns:
        Current active user
        
    Raises:
        HTTPException: 403 if user is inactive or must change password
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    # Block all operations if user must change password
    if current_user.must_change_password:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Password change required. Please change your password before accessing other resources.",
            headers={"X-Password-Change-Required": "true"}
        )
    
    return current_user


async def get_current_user_bypass_password_check(
    current_user: AuthenticatedUser = Depends(get_current_user)
) -> AuthenticatedUser:
    """Get current active user WITHOUT checking password change requirement
    
    Use this ONLY for the change-password endpoint to allow users
    with must_change_password=True to change their password.
    
    Args:
        current_user: Current user from token
        
    Returns:
        Current active user
        
    Raises:
        HTTPException: 403 if user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


async def get_current_verified_user(
    current_user: AuthenticatedUser = Depends(get_current_active_user)
) -> AuthenticatedUser:
    """Get current verified user
    
    Args:
        current_user: Current active user
        
    Returns:
        Current verified user
        
    Raises:
        HTTPException: 403 if user is not verified
    """
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified"
        )
    return current_user


async def get_current_user_from_request(
    request: Request,
    auth_service: AuthService = Depends(get_auth_service)
) -> AuthenticatedUser:
    """Get current authenticated user by manually extracting token from request headers
    Useful for multipart/form-data requests where OAuth2PasswordBearer might have issues
    
    Args:
        request: FastAPI request object
        auth_service: Authentication service
        
    Returns:
        Current authenticated user with permissions from roles and groups
        
    Raises:
        HTTPException: 401 if authentication fails
    """
    try:
        # Extract token from header manually using same method as OAuth2PasswordBearer
        token = await get_token_from_header(request)
        
        # Get user from token
        user = await auth_service.get_current_user(token)
        
        # Load permissions from roles and groups
        try:
            platform_session = get_platform_session()
            role_repository = RoleRepository(platform_session)
            group_repository = GroupRepository(platform_session)
            permission_service = UserPermissionService(role_repository, group_repository)
            
            # Load group permissions and custom role permissions
            group_perms, custom_role_perms = await permission_service.load_user_permissions(
                user.id,
                user.tenant_id
            )
            
            # Set permissions on user
            user.set_group_permissions(group_perms)
            user.set_custom_role_permissions(custom_role_perms)
            
            # Close the session
            await platform_session.close()
        except Exception as perm_error:
            # Log error but continue - user still has base role permissions
            import logging
            logging.warning(f"Failed to load user permissions: {perm_error}")
        
        return user
    except HTTPException:
        raise
    except Exception as e:
        # Log the actual error for debugging
        import logging
        logging.warning(f"Authentication failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_active_user_from_request(
    request: Request,
    auth_service: AuthService = Depends(get_auth_service)
) -> AuthenticatedUser:
    """Get current active user by manually extracting token from request headers
    Useful for multipart/form-data requests where OAuth2PasswordBearer might have issues
    Includes password change requirement check.
    
    Args:
        request: FastAPI request object
        auth_service: Authentication service
        
    Returns:
        Current active authenticated user with permissions
        
    Raises:
        HTTPException: 401 if authentication fails, 403 if user is inactive or must change password
    """
    user = await get_current_user_from_request(request, auth_service)
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    # Block all operations if user must change password
    if user.must_change_password:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Password change required. Please change your password before accessing other resources.",
            headers={"X-Password-Change-Required": "true"}
        )
    
    return user


async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme_optional),
    auth_service: AuthService = Depends(get_auth_service)
) -> Optional[AuthenticatedUser]:
    """Get current user if authenticated, None otherwise
    
    This is useful for endpoints that work for both authenticated and unauthenticated users.
    
    Args:
        token: JWT access token (optional)
        auth_service: Authentication service
        
    Returns:
        Current authenticated user or None
    """
    if token is None:
        return None
    
    try:
        user = await auth_service.get_current_user(token)
        return user
    except Exception:
        return None


class RequirePermission:
    """Dependency class to require specific permission"""
    
    def __init__(self, permission: Permission):
        self.permission = permission
    
    async def __call__(
        self,
        current_user: AuthenticatedUser = Depends(get_current_active_user)
    ) -> AuthenticatedUser:
        """Check if user has required permission
        
        Args:
            current_user: Current active user
            
        Returns:
            Current user if authorized
            
        Raises:
            HTTPException: 403 if user lacks permission
        """
        if not current_user.has_permission(self.permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{self.permission.value}' required"
            )
        return current_user


class RequireAnyPermission:
    """Dependency class to require any of the specified permissions"""
    
    def __init__(self, permissions: List[Permission]):
        self.permissions = permissions
    
    async def __call__(
        self,
        current_user: AuthenticatedUser = Depends(get_current_active_user)
    ) -> AuthenticatedUser:
        """Check if user has any of the required permissions
        
        Args:
            current_user: Current active user
            
        Returns:
            Current user if authorized
            
        Raises:
            HTTPException: 403 if user lacks all permissions
        """
        if not current_user.has_any_permission(self.permissions):
            perm_names = [p.value for p in self.permissions]
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"One of permissions {perm_names} required"
            )
        return current_user


class RequireRole:
    """Dependency class to require specific role"""
    
    def __init__(self, role: UserRole):
        self.role = role
    
    async def __call__(
        self,
        current_user: AuthenticatedUser = Depends(get_current_active_user)
    ) -> AuthenticatedUser:
        """Check if user has required role
        
        Args:
            current_user: Current active user
            
        Returns:
            Current user if authorized
            
        Raises:
            HTTPException: 403 if user lacks role
        """
        if current_user.role.role != self.role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{self.role.value}' required"
            )
        return current_user


# Convenient role dependencies
require_admin = RequireRole(UserRole.ADMIN)
require_manager_or_admin = RequireAnyPermission([
    Permission.MANAGE_INTEGRATIONS,  # Example manager permission
    Permission.VIEW_AUDIT_LOGS       # Example admin permission
])

