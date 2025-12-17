"""
Authentication user mapper - handles conversion between domain entities and database models
"""
from typing import List, Optional
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.email import Email
from app.domain.shared.value_objects.first_name import FirstName
from app.domain.shared.value_objects.last_name import LastName
from app.domain.shared.value_objects.role import Role, UserRole
from app.infrastructure.shared.database.platform_models import UserModel


class AuthMapper:
    """Mapper for AuthenticatedUser entity to UserModel conversion"""
    
    @staticmethod
    def to_domain(model: UserModel, all_permission_strings: Optional[List[str]] = None) -> AuthenticatedUser:
        """Convert database model to domain entity
        
        Args:
            model: UserModel from database
            all_permission_strings: Optional list of all permissions from roles+groups
            
        Returns:
            AuthenticatedUser domain entity
        """
        user = AuthenticatedUser(
            id=model.id,
            username=model.username,
            first_name=FirstName(model.first_name),
            last_name=LastName(model.last_name),
            email=Email(model.email),
            hashed_password=model.hashed_password,
            tenant_id=model.tenant_id,
            role=Role(UserRole(model.base_role)),  # Changed from model.role to model.base_role
            is_active=model.is_active,
            is_verified=model.is_verified,
            must_change_password=model.must_change_password,
            last_login=model.last_login,
            last_password_change=model.last_password_change,
            failed_login_attempts=model.failed_login_attempts,
            locked_until=model.locked_until,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
        
        # Set custom role permissions if provided
        if all_permission_strings:
            user.set_custom_role_permissions(all_permission_strings)
        
        return user
    
    @staticmethod
    def to_model(user: AuthenticatedUser) -> UserModel:
        """Convert domain entity to database model
        
        Args:
            user: AuthenticatedUser domain entity
            
        Returns:
            UserModel for database persistence
        """
        return UserModel(
            id=user.id,
            username=user.username,
            first_name=user.first_name.value,
            last_name=user.last_name.value,
            email=user.email.value,
            hashed_password=user.hashed_password,
            tenant_id=user.tenant_id,
            base_role=user.role.value,  # Changed from role to base_role
            is_active=user.is_active,
            is_verified=user.is_verified,
            must_change_password=user.must_change_password,
            last_login=user.last_login,
            last_password_change=user.last_password_change,
            failed_login_attempts=user.failed_login_attempts,
            locked_until=user.locked_until,
            created_at=user.created_at,
            updated_at=user.updated_at
        )

