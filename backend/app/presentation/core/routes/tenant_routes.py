"""
Tenant management API routes
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.presentation.api.core.tenant_api import (
    CreateTenantRequest, UpdateTenantRequest, TenantResponse, TenantListResponse,
    CreateTenantWithAdminRequest, TenantWithAdminResponse
)
from app.application.core.tenant import (
    CreateTenantCommand,
    UpdateTenantCommand,
    DeactivateTenantCommand,
    ActivateTenantCommand,
    DeleteTenantCommand,
    CreateTenantWithAdminCommand,
    GetTenantByIdQuery,
    GetTenantBySlugQuery,
    GetAllTenantsQuery,
    TenantCommandHandler,
    TenantQueryHandler,
)
from app.application.core.auth import AuthService
from app.infrastructure.core.tenant.repository import SQLTenantRepository
from app.infrastructure.core.auth.repository import SQLAuthRepository
from app.infrastructure.shared.security.password_hasher import PasswordHasher
from app.infrastructure.shared.security.jwt_handler import JWTHandler
from app.shared.exceptions import NotFoundError, BusinessRuleError
from app.presentation.core.dependencies.auth_dependencies import (
    get_current_user,
    get_current_active_user,
    RequireRole
)
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import UserRole

router = APIRouter(prefix="/tenants", tags=["tenants"])


def get_tenant_command_handler() -> TenantCommandHandler:
    """Get tenant command handler"""
    tenant_repository = SQLTenantRepository()
    auth_repository = SQLAuthRepository()
    password_hasher = PasswordHasher()
    return TenantCommandHandler(tenant_repository, auth_repository, password_hasher)


def get_auth_service() -> AuthService:
    """Get auth service"""
    auth_repository = SQLAuthRepository()
    password_hasher = PasswordHasher()
    jwt_handler = JWTHandler()
    return AuthService(auth_repository, password_hasher, jwt_handler)


def get_tenant_query_handler() -> TenantQueryHandler:
    """Get tenant query handler"""
    repository = SQLTenantRepository()
    return TenantQueryHandler(repository)


def _map_to_response(tenant) -> TenantResponse:
    """Map tenant entity to response"""
    return TenantResponse(
        id=tenant.id,
        name=tenant.name.value,
        slug=tenant.slug,
        is_active=tenant.is_active,
        settings=tenant.settings,
        created_at=tenant.created_at,
        updated_at=tenant.updated_at
    )


@router.post("/", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    request: CreateTenantRequest,
    handler: TenantCommandHandler = Depends(get_tenant_command_handler),
    current_user: AuthenticatedUser = Depends(RequireRole(UserRole.ADMIN))
):
    """
    Create a new tenant
    
    **Requires:** Admin role and password change completed
    
    This endpoint allows creating a new tenant for multi-tenancy support.
    """
    try:
        command = CreateTenantCommand(
            name=request.name,
            slug=request.slug,
            settings=request.settings
        )
        tenant = await handler.handle_create_tenant(command)
        return _map_to_response(tenant)
    except BusinessRuleError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/", response_model=TenantListResponse)
async def get_all_tenants(
    skip: int = 0,
    limit: int = 100,
    handler: TenantQueryHandler = Depends(get_tenant_query_handler),
    current_user: AuthenticatedUser = Depends(RequireRole(UserRole.ADMIN))
):
    """
    Get all tenants
    
    **Requires:** Admin role and password change completed
    
    Retrieve a list of all tenants with pagination support.
    """
    query = GetAllTenantsQuery(skip=skip, limit=limit)
    tenants = await handler.handle_get_all_tenants(query)
    
    return TenantListResponse(
        tenants=[_map_to_response(t) for t in tenants],
        total=len(tenants),
        skip=skip,
        limit=limit
    )


@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant_by_id(
    tenant_id: str,
    handler: TenantQueryHandler = Depends(get_tenant_query_handler),
    current_user: AuthenticatedUser = Depends(get_current_active_user)
):
    """
    Get tenant by ID
    
    **Requires:** Authentication and password change completed
    
    Retrieve a specific tenant by its ID.
    """
    try:
        query = GetTenantByIdQuery(tenant_id=tenant_id)
        tenant = await handler.handle_get_tenant_by_id(query)
        return _map_to_response(tenant)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/slug/{slug}", response_model=TenantResponse)
async def get_tenant_by_slug(
    slug: str,
    handler: TenantQueryHandler = Depends(get_tenant_query_handler),
    current_user: AuthenticatedUser = Depends(get_current_active_user)
):
    """
    Get tenant by slug
    
    **Requires:** Authentication and password change completed
    
    Retrieve a specific tenant by its URL-friendly slug.
    """
    try:
        query = GetTenantBySlugQuery(slug=slug)
        tenant = await handler.handle_get_tenant_by_slug(query)
        return _map_to_response(tenant)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.put("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: str,
    request: UpdateTenantRequest,
    handler: TenantCommandHandler = Depends(get_tenant_command_handler),
    current_user: AuthenticatedUser = Depends(RequireRole(UserRole.ADMIN))
):
    """
    Update tenant
    
    **Requires:** Admin role and password change completed
    
    Update an existing tenant's information.
    """
    try:
        command = UpdateTenantCommand(
            tenant_id=tenant_id,
            name=request.name,
            slug=request.slug,
            settings=request.settings
        )
        tenant = await handler.handle_update_tenant(command)
        return _map_to_response(tenant)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except BusinessRuleError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{tenant_id}/deactivate", response_model=TenantResponse)
async def deactivate_tenant(
    tenant_id: str,
    handler: TenantCommandHandler = Depends(get_tenant_command_handler),
    current_user: AuthenticatedUser = Depends(RequireRole(UserRole.ADMIN))
):
    """
    Deactivate tenant
    
    **Requires:** Admin role and password change completed
    
    Deactivate a tenant, preventing access to its resources.
    """
    try:
        command = DeactivateTenantCommand(tenant_id=tenant_id)
        tenant = await handler.handle_deactivate_tenant(command)
        return _map_to_response(tenant)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{tenant_id}/activate", response_model=TenantResponse)
async def activate_tenant(
    tenant_id: str,
    handler: TenantCommandHandler = Depends(get_tenant_command_handler),
    current_user: AuthenticatedUser = Depends(RequireRole(UserRole.ADMIN))
):
    """
    Activate tenant
    
    **Requires:** Admin role and password change completed
    
    Activate a tenant, restoring access to its resources.
    """
    try:
        command = ActivateTenantCommand(tenant_id=tenant_id)
        tenant = await handler.handle_activate_tenant(command)
        return _map_to_response(tenant)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tenant(
    tenant_id: str,
    handler: TenantCommandHandler = Depends(get_tenant_command_handler),
    current_user: AuthenticatedUser = Depends(RequireRole(UserRole.ADMIN))
):
    """
    Delete tenant
    
    **Requires:** Admin role and password change completed
    
    Permanently delete a tenant. This action cannot be undone.
    Warning: This will not automatically delete tenant data. Consider deactivating instead.
    """
    try:
        command = DeleteTenantCommand(tenant_id=tenant_id)
        await handler.handle_delete_tenant(command)
        return None
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/signup", response_model=TenantWithAdminResponse, status_code=status.HTTP_201_CREATED)
async def signup_tenant(
    request: CreateTenantWithAdminRequest,
    handler: TenantCommandHandler = Depends(get_tenant_command_handler),
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Self-service tenant signup with admin user creation
    
    **Public Endpoint** - No authentication required
    
    Creates both:
    - New tenant (company/organization)
    - Admin user for that tenant (with ADMIN role)
    
    Returns access tokens so user can login immediately.
    
    **Use Case:** Shopify/Stripe-style self-service signup
    
    **Security:**
    - Password strength validation (uppercase, lowercase, number, special char)
    - Email format validation
    - Slug format validation (URL-friendly)
    - Duplicate email/username check
    - Duplicate tenant slug check
    
    **Example:**
    ```json
    {
      "company_name": "Acme Corporation",
      "slug": "acme-corp",
      "admin_email": "john@acme.com",
      "admin_password": "SecurePass123!",
      "admin_name": "John Doe",
      "admin_username": "john"
    }
    ```
    
    Returns tenant + admin user + tokens for immediate login.
    """
    try:
        # Create command
        command = CreateTenantWithAdminCommand(
            tenant_name=request.company_name,
            tenant_slug=request.slug,
            tenant_settings={},
            admin_email=request.admin_email,
            admin_password=request.admin_password,
            admin_name=request.admin_name,
            admin_username=request.admin_username
        )
        
        # Execute atomic creation (tenant + admin user)
        tenant, admin_user = await handler.handle_create_tenant_with_admin(command)
        
        # Generate tokens for immediate login
        tokens = auth_service._create_tokens(admin_user)
        
        return TenantWithAdminResponse(
            tenant=_map_to_response(tenant),
            admin_user={
                "id": admin_user.id,
                "username": admin_user.username,
                "email": admin_user.email.value,
                "name": f"{admin_user.first_name.value} {admin_user.last_name.value}",
                "role": admin_user.role.value,
                "tenant_id": admin_user.tenant_id
            },
            access_token=tokens["access_token"],
            refresh_token=tokens["refresh_token"],
            id_token=tokens["id_token"],
            token_type=tokens["token_type"]
        )
        
    except BusinessRuleError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# Super Admin Routes (require ADMIN role)
@router.post("/admin/create", response_model=TenantWithAdminResponse, status_code=status.HTTP_201_CREATED)
async def admin_create_tenant(
    request: CreateTenantWithAdminRequest,
    handler: TenantCommandHandler = Depends(get_tenant_command_handler),
    auth_service: AuthService = Depends(get_auth_service),
    current_user: AuthenticatedUser = Depends(RequireRole(UserRole.ADMIN))
):
    """
    Super Admin: Create tenant with admin user
    
    **Requires:** Admin role and password change completed
    
    This endpoint allows super admins to manually create tenants for customers.
    
    **Use Case:** 
    - Controlled onboarding
    - White-label solutions
    - Enterprise customer setup
    
    **Workflow:**
    1. Super admin creates tenant + admin user
    2. System generates invitation tokens
    3. Customer receives email with credentials
    4. Customer can login immediately
    
    **Security:**
    - Requires authentication
    - Requires ADMIN role
    - Same validations as public signup
    - Audit log of creation (TODO)
    
    **Note:** In production, consider:
    - Sending email invitation to admin user
    - Temporary password that must be changed
    - Email verification requirement
    """
    # Verify user is admin (super admin check)
    if current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can create tenants via admin portal"
        )
    
    try:
        # Create command
        command = CreateTenantWithAdminCommand(
            tenant_name=request.company_name,
            tenant_slug=request.slug,
            tenant_settings={},
            admin_email=request.admin_email,
            admin_password=request.admin_password,
            admin_name=request.admin_name,
            admin_username=request.admin_username
        )
        
        # Execute atomic creation
        tenant, admin_user = await handler.handle_create_tenant_with_admin(command)
        
        # Generate tokens
        tokens = auth_service._create_tokens(admin_user)
        
        # TODO: Send invitation email to admin user
        # TODO: Log admin action in audit log
        
        return TenantWithAdminResponse(
            tenant=_map_to_response(tenant),
            admin_user={
                "id": admin_user.id,
                "username": admin_user.username,
                "email": admin_user.email.value,
                "name": f"{admin_user.first_name.value} {admin_user.last_name.value}",
                "role": admin_user.role.value,
                "tenant_id": admin_user.tenant_id
            },
            access_token=tokens["access_token"],
            refresh_token=tokens["refresh_token"],
            id_token=tokens["id_token"],
            token_type=tokens["token_type"],
            message="Tenant and admin user created by super admin. Invitation should be sent to admin user."
        )
        
    except BusinessRuleError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

