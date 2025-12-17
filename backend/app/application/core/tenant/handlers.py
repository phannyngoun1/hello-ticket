"""
Tenant command and query handlers
"""
from typing import List, Optional, Tuple
from .commands import (
    CreateTenantCommand,
    UpdateTenantCommand,
    DeactivateTenantCommand,
    ActivateTenantCommand,
    DeleteTenantCommand,
    CreateTenantWithAdminCommand,
)
from .queries import (
    GetTenantByIdQuery,
    GetTenantBySlugQuery,
    GetAllTenantsQuery,
)
from app.domain.core.tenant.entity import Tenant
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.name import Name
from app.domain.shared.value_objects.first_name import FirstName
from app.domain.shared.value_objects.last_name import LastName
from app.domain.shared.value_objects.email import Email
from app.domain.shared.value_objects.role import Role, UserRole
from app.domain.core.tenant.repository import TenantRepository
from app.domain.core.auth.repository import AuthRepository
from app.infrastructure.shared.security.password_hasher import PasswordHasher
from app.shared.exceptions import NotFoundError, BusinessRuleError, ValidationError


class TenantCommandHandler:
    """Handler for tenant commands"""
    
    def __init__(
        self, 
        tenant_repository: TenantRepository,
        auth_repository: Optional[AuthRepository] = None,
        password_hasher: Optional[PasswordHasher] = None
    ):
        self.tenant_repository = tenant_repository
        self.auth_repository = auth_repository
        self.password_hasher = password_hasher
    
    async def handle_create_tenant(self, command: CreateTenantCommand) -> Tenant:
        """Handle create tenant command"""
        # Check if slug already exists
        if command.slug:
            exists = await self.tenant_repository.exists_by_slug(command.slug)
            if exists:
                raise BusinessRuleError(f"Tenant with slug '{command.slug}' already exists")
        
        # Create tenant
        tenant = Tenant(
            name=Name(command.name),
            slug=command.slug,
            settings=command.settings or {}
        )
        
        # Save tenant
        saved_tenant = await self.tenant_repository.save(tenant)
        return saved_tenant
    
    async def handle_update_tenant(self, command: UpdateTenantCommand) -> Tenant:
        """Handle update tenant command"""
        # Get existing tenant
        tenant = await self.tenant_repository.get_by_id(command.tenant_id)
        if not tenant:
            raise NotFoundError(f"Tenant with ID '{command.tenant_id}' not found")
        
        # Update fields
        if command.name:
            tenant.update_name(Name(command.name))
        
        if command.slug:
            # Check if slug is already taken by another tenant
            existing = await self.tenant_repository.get_by_slug(command.slug)
            if existing and existing.id != tenant.id:
                raise BusinessRuleError(f"Tenant with slug '{command.slug}' already exists")
            tenant.update_slug(command.slug)
        
        if command.settings is not None:
            tenant.update_settings(command.settings)
        
        # Save tenant
        saved_tenant = await self.tenant_repository.save(tenant)
        return saved_tenant
    
    async def handle_deactivate_tenant(self, command: DeactivateTenantCommand) -> Tenant:
        """Handle deactivate tenant command"""
        # Get existing tenant
        tenant = await self.tenant_repository.get_by_id(command.tenant_id)
        if not tenant:
            raise NotFoundError(f"Tenant with ID '{command.tenant_id}' not found")
        
        # Deactivate tenant
        tenant.deactivate()
        
        # Save tenant
        saved_tenant = await self.tenant_repository.save(tenant)
        return saved_tenant
    
    async def handle_activate_tenant(self, command: ActivateTenantCommand) -> Tenant:
        """Handle activate tenant command"""
        # Get existing tenant
        tenant = await self.tenant_repository.get_by_id(command.tenant_id)
        if not tenant:
            raise NotFoundError(f"Tenant with ID '{command.tenant_id}' not found")
        
        # Activate tenant
        tenant.activate()
        
        # Save tenant
        saved_tenant = await self.tenant_repository.save(tenant)
        return saved_tenant
    
    async def handle_delete_tenant(self, command: DeleteTenantCommand) -> bool:
        """Handle delete tenant command"""
        # Get existing tenant
        tenant = await self.tenant_repository.get_by_id(command.tenant_id)
        if not tenant:
            raise NotFoundError(f"Tenant with ID '{command.tenant_id}' not found")
        
        # Delete tenant
        result = await self.tenant_repository.delete(command.tenant_id)
        return result
    
    async def handle_create_tenant_with_admin(
        self, 
        command: CreateTenantWithAdminCommand
    ) -> Tuple[Tenant, AuthenticatedUser]:
        """
        Create tenant and admin user atomically.
        
        This solves the bootstrap problem:
        - Creates tenant first
        - Creates admin user for that tenant
        - Returns both
        - If either fails, entire operation rolls back (handled by DB transaction)
        
        Args:
            command: CreateTenantWithAdminCommand with tenant and admin info
            
        Returns:
            Tuple of (tenant, admin_user)
            
        Raises:
            BusinessRuleError: If slug or email already exists
            ValueError: If auth_repository or password_hasher not provided
        """
        # Validate dependencies are provided
        if not self.auth_repository:
            raise BusinessRuleError(
                "AuthRepository is required for tenant+admin creation",
                details={"component": "AuthRepository"}
            )
        if not self.password_hasher:
            raise BusinessRuleError(
                "PasswordHasher is required for tenant+admin creation",
                details={"component": "PasswordHasher"}
            )
        
        # Validate tenant slug doesn't already exist
        if command.tenant_slug:
            exists = await self.tenant_repository.exists_by_slug(command.tenant_slug)
            if exists:
                raise BusinessRuleError(f"Tenant with slug '{command.tenant_slug}' already exists")
        
        # Validate email is unique globally
        existing_user = await self.auth_repository.get_by_email(command.admin_email)
        if existing_user:
            raise BusinessRuleError(f"Email '{command.admin_email}' is already registered")
        
        # Validate username is unique (check if exists)
        existing_username = await self.auth_repository.get_by_username(command.admin_username)
        if existing_username:
            raise BusinessRuleError(f"Username '{command.admin_username}' is already taken")
        
        # Create tenant
        tenant = Tenant(
            name=Name(command.tenant_name),
            slug=command.tenant_slug,
            settings=command.tenant_settings or {}
        )
        saved_tenant = await self.tenant_repository.save(tenant)
        
        # Create admin user for this tenant
        hashed_password = self.password_hasher.hash(command.admin_password)
        
        # Split admin_name into first and last name
        name_parts = command.admin_name.strip().split(' ', 1)
        first_name = name_parts[0] if name_parts else "Admin"
        last_name = name_parts[1] if len(name_parts) > 1 else "User"
        
        admin_user = AuthenticatedUser(
            username=command.admin_username,
            email=Email(command.admin_email),
            hashed_password=hashed_password,
            first_name=FirstName(first_name),
            last_name=LastName(last_name),
            role=Role(UserRole.ADMIN),  # Admin role for tenant owner
            tenant_id=saved_tenant.id    # Belongs to new tenant
        )
        
        saved_user = await self.auth_repository.save(admin_user)
        
        # Create default subscription for new tenant
        from app.infrastructure.shared.subscription_repository import SubscriptionRepository
        subscription_repository = SubscriptionRepository()
        await subscription_repository.create_default_subscription(saved_tenant.id)
        
        return saved_tenant, saved_user


class TenantQueryHandler:
    """Handler for tenant queries"""
    
    def __init__(self, tenant_repository: TenantRepository):
        self.tenant_repository = tenant_repository
    
    async def handle_get_tenant_by_id(self, query: GetTenantByIdQuery) -> Tenant:
        """Handle get tenant by ID query"""
        # Validate input
        if not query.tenant_id or not query.tenant_id.strip():
            raise ValidationError("Tenant ID is required")
        
        tenant = await self.tenant_repository.get_by_id(query.tenant_id)
        if not tenant:
            raise NotFoundError(f"Tenant with ID '{query.tenant_id}' not found")
        return tenant
    
    async def handle_get_tenant_by_slug(self, query: GetTenantBySlugQuery) -> Tenant:
        """Handle get tenant by slug query"""
        # Validate input
        if not query.slug or not query.slug.strip():
            raise ValidationError("Tenant slug is required")
        
        tenant = await self.tenant_repository.get_by_slug(query.slug.strip())
        if not tenant:
            raise NotFoundError(f"Tenant with slug '{query.slug}' not found")
        return tenant
    
    async def handle_get_all_tenants(self, query: GetAllTenantsQuery) -> List[Tenant]:
        """Handle get all tenants query"""
        tenants = await self.tenant_repository.get_all(skip=query.skip, limit=query.limit)
        return tenants

