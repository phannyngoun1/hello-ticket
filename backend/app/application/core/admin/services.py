"""
Admin Bootstrap Service

Creates default admin user from .env on startup if not exists.
Forces password change on first login.
"""
import os
import logging
from typing import Optional
from app.application.core.auth import AuthService
from app.domain.shared.value_objects.role import UserRole
from app.domain.core.auth.repository import AuthRepository
from app.shared.exceptions import ValidationError

logger = logging.getLogger(__name__)


class AdminBootstrapService:
    """Service to bootstrap default admin user from environment variables"""
    
    def __init__(self, auth_service: AuthService, auth_repository: AuthRepository):
        self._auth_service = auth_service
        self._auth_repository = auth_repository
    
    async def ensure_default_admin_exists(self) -> bool:
        """
        Ensure default admin user exists from .env configuration
        
        Environment Variables:
            DEFAULT_ADMIN_USERNAME: Admin username (default: admin)
            DEFAULT_ADMIN_EMAIL: Admin email (required)
            DEFAULT_ADMIN_PASSWORD: Admin initial password (required)
            DEFAULT_ADMIN_NAME: Admin display name (default: System Administrator)
        
        Returns:
            True if admin exists or was created, False otherwise
        """
        try:
            # Get admin configuration from environment
            admin_username = os.getenv("DEFAULT_ADMIN_USERNAME", "admin")
            admin_email = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@example.com")
            admin_password = os.getenv("DEFAULT_ADMIN_PASSWORD", "ChangeMe123!")
            admin_name = os.getenv("DEFAULT_ADMIN_NAME", "System Administrator")
            tenant_id = os.getenv("DEFAULT_TENANT_ID", "default-tenant")
            
            # Validate required environment variables (set in .env locally or in Railway/host env)
            if not admin_email:
                logger.warning(
                    "DEFAULT_ADMIN_EMAIL not set - skipping admin creation. "
                    "Set it in .env (local) or in your deployment environment (e.g. Railway Variables)."
                )
                return False

            if not admin_password:
                logger.warning(
                    "DEFAULT_ADMIN_PASSWORD not set - skipping admin creation. "
                    "Set it in .env (local) or in your deployment environment (e.g. Railway Variables)."
                )
                return False
            
            # Check if admin already exists (by username or email)
            existing_by_username = await self._auth_repository.get_by_username(admin_username)
            existing_by_email = await self._auth_repository.get_by_email(admin_email)
            
            if existing_by_username or existing_by_email:
                logger.info(f"✓ Default admin user '{admin_username}' already exists")
                return True
            
            # Create admin user
            logger.info(f"Creating default admin user: {admin_username}")
            
            # Split admin_name into first and last name
            name_parts = admin_name.strip().split(' ', 1)
            first_name = name_parts[0] if name_parts else "Admin"
            last_name = name_parts[1] if len(name_parts) > 1 else "User"
            
            admin_user = await self._auth_service.register(
                username=admin_username,
                email=admin_email,
                password=admin_password,
                first_name=first_name,
                last_name=last_name,
                role=UserRole.ADMIN,
                tenant_id=tenant_id
            )
            
            # Force password change on first login
            admin_user.require_password_change()
            await self._auth_repository.save(admin_user)
            
            logger.info(f"✅ Default admin user created successfully:")
            logger.info(f"   - Username: {admin_username}")
            logger.info(f"   - Email: {admin_email}")
            logger.info(f"   - Role: ADMIN")
            logger.info(f"   - Password Change Required: YES")
            logger.info(f"   ⚠️  IMPORTANT: Admin MUST change password after first login!")
            
            return True
            
        except ValidationError as e:
            logger.error(f"Failed to create admin user: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error creating admin user: {str(e)}", exc_info=True)
            return False
    
    async def check_admin_exists(self) -> bool:
        """Check if any admin user exists in the system"""
        try:
            admin_username = os.getenv("DEFAULT_ADMIN_USERNAME", "admin")
            admin_email = os.getenv("DEFAULT_ADMIN_EMAIL")
            
            # Check by username
            if admin_username:
                user = await self._auth_repository.get_by_username(admin_username)
                if user:
                    return True
            
            # Check by email
            if admin_email:
                user = await self._auth_repository.get_by_email(admin_email)
                if user:
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error checking admin existence: {str(e)}")
            return False

