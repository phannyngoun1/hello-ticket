"""
Authentication service - Application layer
"""
import os
from typing import Optional, Dict, Any
from datetime import datetime
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.core.auth.repository import AuthRepository
from app.domain.shared.value_objects.email import Email
from app.domain.shared.value_objects.first_name import FirstName
from app.domain.shared.value_objects.last_name import LastName
from app.domain.shared.value_objects.role import Role, UserRole
from app.domain.shared.value_objects.device_info import DeviceInfo
from app.infrastructure.shared.security.password_hasher import PasswordHasher
from app.infrastructure.shared.security.jwt_handler import JWTHandler
from app.shared.exceptions import ValidationError, BusinessRuleError, NotFoundError
from app.shared.tenant_context import get_tenant_context
from app.shared.tenant_validator import validate_tenant_exists


class AuthService:
    """Authentication service for user authentication and authorization"""
    
    def __init__(
        self,
        auth_repository: AuthRepository,
        password_hasher: PasswordHasher,
        jwt_handler: JWTHandler
    ):
        self._auth_repository = auth_repository
        self._password_hasher = password_hasher
        self._jwt_handler = jwt_handler
        self._session_service = None  # Will be set after initialization to avoid circular dependency
    
    async def register(
        self,
        username: str,
        email: str,
        password: str,
        first_name: str,
        last_name: str,
        role: UserRole = UserRole.USER,
        tenant_id: Optional[str] = None
    ) -> AuthenticatedUser:
        """Register new user
        
        Args:
            username: Unique username
            email: User email
            password: Plain text password
            first_name: User first name
            last_name: User last name
            role: User role (default: USER)
            tenant_id: Tenant ID (optional, will use context or default)
            
        Returns:
            Created user
            
        Raises:
            ValidationError: If username or email already exists
        """
        # Get tenant_id from parameter, context, or environment default
        if not tenant_id:
            tenant_id = get_tenant_context()
            if not tenant_id:
                tenant_id = os.getenv("DEFAULT_TENANT_ID", "default-tenant")
        
        # Validate tenant exists in database
        if not validate_tenant_exists(tenant_id):
            raise ValidationError(
                f"Tenant '{tenant_id}' does not exist. Please contact support or use a valid tenant ID."
            )
        
        # Check if username exists
        if await self._auth_repository.exists_by_username(username):
            raise ValidationError(f"Username '{username}' already exists")
        
        # Check if email exists
        if await self._auth_repository.exists_by_email(email):
            raise ValidationError(f"Email '{email}' already exists")
        
        # Hash password
        hashed_password = self._password_hasher.hash(password)
        
        # Create user
        user = AuthenticatedUser(
            username=username,
            email=Email(email),
            hashed_password=hashed_password,
            first_name=FirstName(first_name),
            last_name=LastName(last_name),
            role=Role(role),
            tenant_id=tenant_id
        )
        
        return await self._auth_repository.save(user)
    
    async def authenticate(
        self,
        username: str,
        password: str,
        device_info: Optional[DeviceInfo] = None
    ) -> tuple[AuthenticatedUser, Dict[str, str]]:
        """Authenticate user with username and password
        
        Args:
            username: Username or email
            password: Plain text password
            device_info: Device information for session tracking (optional)
            
        Returns:
            Tuple of (user, tokens) where tokens contains access_token, refresh_token, id_token
            
        Raises:
            ValidationError: If credentials are invalid
            BusinessRuleError: If account is locked or inactive
        """
        # Get user by username or email
        user = await self._auth_repository.get_by_username(username)
        if not user:
            user = await self._auth_repository.get_by_email(username)
        
        if not user:
            raise ValidationError("Invalid username or password")
        
        # Check if user can authenticate
        if not user.can_authenticate():
            if user.is_locked():
                raise BusinessRuleError(
                    f"Account is locked until {user.locked_until.isoformat()}"
                )
            raise BusinessRuleError("Account is inactive")
        
        # Verify password
        if not self._password_hasher.verify(password, user.hashed_password):
            # Record failed login
            user.record_failed_login()
            await self._auth_repository.save(user)
            raise ValidationError("Invalid username or password")
        
        # Record successful login
        user.record_successful_login()
        await self._auth_repository.save(user)
        
        # Create session if session service is available and device info is provided
        session_id = None
        if self._session_service and device_info:
            try:
                session = await self._session_service.create_session(
                    user_id=user.id,
                    tenant_id=user.tenant_id,
                    device_info=device_info
                )
                session_id = session.id
            except BusinessRuleError:
                # If session creation fails, still allow login but without session
                pass
        
        # Create tokens
        tokens = self._create_tokens(user, session_id)
        
        return user, tokens
    
    async def refresh_access_token(self, refresh_token: str) -> Dict[str, str]:
        """Refresh access token using refresh token
        
        Args:
            refresh_token: Valid refresh token
            
        Returns:
            New access token and optionally new refresh token
            
        Raises:
            ValidationError: If refresh token is invalid
        """
        # Verify refresh token specifically (must be type="refresh")
        user_id = self._jwt_handler.verify_refresh_token(refresh_token)
        if not user_id:
            raise ValidationError("Invalid refresh token")
        
        # Get user
        user = await self._auth_repository.get_by_id(user_id)
        if not user or not user.is_active:
            raise ValidationError("User not found or inactive")
        
        # Create new access token
        access_token = self._jwt_handler.create_access_token(
            subject=user.id,
            additional_claims={
                "username": user.username,
                "email": user.email.value,
                "role": user.role.value,
                "tenant_id": user.tenant_id,
                "permissions": [p.value for p in user.get_permissions()]
            }
        )
        
        # Optionally create a new refresh token (rotate refresh tokens)
        # For now, return only access token to maintain backward compatibility
        return {"access_token": access_token, "token_type": "bearer"}
    
    async def get_current_user(self, token: str) -> AuthenticatedUser:
        """Get current user from access token
        
        Args:
            token: Access token
            
        Returns:
            Current user
            
        Raises:
            ValidationError: If token is invalid
            NotFoundError: If user not found
        """
        user_id = self._jwt_handler.verify_token(token)
        if not user_id:
            raise ValidationError("Invalid or expired token")
        
        user = await self._auth_repository.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        
        if not user.is_active:
            raise BusinessRuleError("User account is inactive")
        
        return user
    
    async def change_password(
        self,
        user_id: str,
        old_password: str,
        new_password: str
    ) -> None:
        """Change user password
        
        Args:
            user_id: User ID
            old_password: Current password
            new_password: New password
            
        Raises:
            NotFoundError: If user not found
            ValidationError: If old password is incorrect
        """
        user = await self._auth_repository.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        
        # Verify old password
        if not self._password_hasher.verify(old_password, user.hashed_password):
            raise ValidationError("Current password is incorrect")
        
        # Hash and update password
        new_hashed_password = self._password_hasher.hash(new_password)
        user.update_password(new_hashed_password)
        
        await self._auth_repository.save(user)
    
    def set_session_service(self, session_service):
        """Set session service after initialization to avoid circular dependency
        
        Args:
            session_service: SessionService instance
        """
        self._session_service = session_service
    
    def _create_tokens(self, user: AuthenticatedUser, session_id: Optional[str] = None) -> Dict[str, str]:
        """Create authentication tokens
        
        Args:
            user: Authenticated user
            session_id: Session ID to include in tokens (optional)
            
        Returns:
            Dictionary with access_token, refresh_token, id_token
        """
        # Prepare additional claims
        additional_claims = {
            "username": user.username,
            "email": user.email.value,
            "role": user.role.value,
            "tenant_id": user.tenant_id,  # Include tenant_id in token
            "permissions": [p.value for p in user.get_permissions()]
        }
        
        # Add session_id if provided
        if session_id:
            additional_claims["session_id"] = session_id
        
        # Create access token with user claims
        access_token = self._jwt_handler.create_access_token(
            subject=user.id,
            additional_claims=additional_claims
        )
        
        # Create refresh token with session_id and tenant_id
        refresh_token_claims = {"tenant_id": user.tenant_id}
        if session_id:
            refresh_token_claims["session_id"] = session_id
        refresh_token = self._jwt_handler.create_refresh_token(
            subject=user.id,
            additional_claims=refresh_token_claims
        )
        
        # Create OpenID Connect ID token
        id_token = self._jwt_handler.create_id_token(
            subject=user.id,
            audience="design-code-api",
            user_info={
                "email": user.email.value,
                "first_name": user.first_name.value,
                "last_name": user.last_name.value,
                "username": user.username,
                "email_verified": user.is_verified,
                "role": user.role.value,
                "tenant_id": user.tenant_id  # Include tenant_id in ID token
            }
        )
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "id_token": id_token,
            "token_type": "bearer"
        }

