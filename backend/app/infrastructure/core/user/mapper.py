"""
User mapper - handles conversion between domain entities and database models
"""
import hashlib
from app.domain.core.user.entity import User
from app.domain.shared.value_objects.email import Email
from app.domain.shared.value_objects.first_name import FirstName
from app.domain.shared.value_objects.last_name import LastName
from app.infrastructure.shared.database.platform_models import UserModel


class UserMapper:
    """Mapper for User entity to UserModel conversion"""
    
    @staticmethod
    def to_domain(model: UserModel) -> User:
        """Convert database model to domain entity
        
        Args:
            model: UserModel from database
            
        Returns:
            User domain entity
        """
        return User(
            id=model.id,
            username=model.username,
            first_name=FirstName(model.first_name),
            last_name=LastName(model.last_name),
            email=Email(model.email),
            tenant_id=model.tenant_id,
            created_at=model.created_at,
            updated_at=model.updated_at,
            is_active=model.is_active,
            base_role=model.base_role,
            last_login=model.last_login,
            locked_until=model.locked_until
        )
    
    @staticmethod
    def to_model(user: User) -> UserModel:
        """Convert domain entity to database model
        
        Args:
            user: User domain entity
            
        Returns:
            UserModel for database persistence
        """
        # Generate a default password hash (users created via user routes can't login)
        # This is a placeholder hash - these users need to be activated via auth routes
        default_password_hash = hashlib.sha256(f"no-login-{user.id}".encode()).hexdigest()
        
        return UserModel(
            id=user.id,
            username=user.username,
            first_name=user.first_name.value,
            last_name=user.last_name.value,
            email=user.email.value,
            hashed_password=default_password_hash,
            tenant_id=user.tenant_id,
            created_at=user.created_at,
            updated_at=user.updated_at,
            is_active=user.is_active,
            base_role=user.base_role,
            last_login=user.last_login,
            locked_until=user.locked_until
        )

