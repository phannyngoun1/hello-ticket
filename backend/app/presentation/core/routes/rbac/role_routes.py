"""
Custom role management API routes
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.presentation.core.dependencies.auth_dependencies import get_current_active_user, require_admin
from app.presentation.api.rbac.role_schemas import (
    CustomRoleCreate,
    CustomRoleUpdate,
    RoleResponse,
    RoleListResponse,
    AssignRoleToUserRequest,
    UserRoleResponse
)
from app.application.core.rbac import CustomRoleManagementService
from app.infrastructure.core.rbac.role_repository import RoleRepository
from app.infrastructure.shared.database.platform_connection import get_platform_session


router = APIRouter(prefix="/roles", tags=["roles"])


async def get_role_service():
    """Dependency to get custom role management service"""
    platform_session = get_platform_session()
    role_repo = RoleRepository(platform_session)
    try:
        yield CustomRoleManagementService(role_repo)
    finally:
        await platform_session.close()


@router.post("/", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
async def create_custom_role(
    role_data: CustomRoleCreate,
    current_user: AuthenticatedUser = Depends(require_admin),
    role_service: CustomRoleManagementService = Depends(get_role_service)
):
    """
    Create a new custom role (Admin only)
    
    Custom roles are tenant-specific and can have any combination of permissions.
    System roles (admin, manager, user, guest) cannot be created or modified.
    """
    role = await role_service.create_custom_role(
        tenant_id=current_user.tenant_id,
        name=role_data.name,
        permissions=role_data.permissions,
        description=role_data.description
    )
    
    return RoleResponse(
        id=role.id,
        tenant_id=role.tenant_id,
        name=role.name,
        description=role.description,
        permissions=role.permissions,
        is_system_role=role.is_system_role,
        created_at=role.created_at,
        updated_at=role.updated_at
    )


@router.get("/", response_model=RoleListResponse)
async def list_roles(
    include_system_roles: bool = Query(True, description="Include system roles in the list"),
    current_user: AuthenticatedUser = Depends(get_current_active_user),
    role_service: CustomRoleManagementService = Depends(get_role_service)
):
    """
    List all roles for the current tenant
    
    By default, includes both system roles and custom roles.
    Set include_system_roles=false to see only custom roles.
    """
    roles = await role_service.list_roles(
        tenant_id=current_user.tenant_id,
        include_system_roles=include_system_roles
    )
    
    role_responses = [
        RoleResponse(
            id=role.id,
            tenant_id=role.tenant_id,
            name=role.name,
            description=role.description,
            permissions=role.permissions,
            is_system_role=role.is_system_role,
            created_at=role.created_at,
            updated_at=role.updated_at
        )
        for role in roles
    ]
    
    return RoleListResponse(roles=role_responses, total=len(role_responses))


@router.get("/{role_id}", response_model=RoleResponse)
async def get_role(
    role_id: str,
    current_user: AuthenticatedUser = Depends(get_current_active_user),
    role_service: CustomRoleManagementService = Depends(get_role_service)
):
    """
    Get a specific role by ID
    """
    role = await role_service.get_role(role_id, current_user.tenant_id)
    
    return RoleResponse(
        id=role.id,
        tenant_id=role.tenant_id,
        name=role.name,
        description=role.description,
        permissions=role.permissions,
        is_system_role=role.is_system_role,
        created_at=role.created_at,
        updated_at=role.updated_at
    )


@router.patch("/{role_id}", response_model=RoleResponse)
async def update_custom_role(
    role_id: str,
    role_data: CustomRoleUpdate,
    current_user: AuthenticatedUser = Depends(require_admin),
    role_service: CustomRoleManagementService = Depends(get_role_service)
):
    """
    Update a custom role (Admin only)
    
    Note: System roles cannot be updated. Attempting to update a system role
    will result in a validation error.
    """
    role = await role_service.update_custom_role(
        role_id=role_id,
        tenant_id=current_user.tenant_id,
        name=role_data.name,
        permissions=role_data.permissions,
        description=role_data.description
    )
    
    return RoleResponse(
        id=role.id,
        tenant_id=role.tenant_id,
        name=role.name,
        description=role.description,
        permissions=role.permissions,
        is_system_role=role.is_system_role,
        created_at=role.created_at,
        updated_at=role.updated_at
    )


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_custom_role(
    role_id: str,
    current_user: AuthenticatedUser = Depends(require_admin),
    role_service: CustomRoleManagementService = Depends(get_role_service)
):
    """
    Delete a custom role (Admin only)
    
    Note: System roles cannot be deleted. Attempting to delete a system role
    will result in a validation error.
    """
    success = await role_service.delete_custom_role(role_id, current_user.tenant_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role {role_id} not found"
        )


# User-Role Assignment Endpoints (Direct Assignment - Method 1)

@router.post("/assign", response_model=UserRoleResponse, status_code=status.HTTP_201_CREATED)
async def assign_role_to_user(
    request: AssignRoleToUserRequest,
    current_user: AuthenticatedUser = Depends(require_admin),
    role_service: CustomRoleManagementService = Depends(get_role_service)
):
    """
    Assign a role directly to a user (Admin only) - Method 1
    
    This creates a direct user-role assignment. The user will have this role's
    permissions in addition to:
    - Their base role permissions
    - Any roles inherited from groups (Method 2)
    """
    user_role = await role_service.assign_role_to_user(
        user_id=request.user_id,
        role_id=request.role_id,
        tenant_id=current_user.tenant_id,
        assigned_by=current_user.id
    )
    
    return UserRoleResponse(
        user_id=user_role.user_id,
        role_id=user_role.role_id,
        tenant_id=user_role.tenant_id,
        assigned_at=user_role.assigned_at
    )


@router.delete("/assign/{user_id}/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_role_from_user(
    user_id: str,
    role_id: str,
    current_user: AuthenticatedUser = Depends(require_admin),
    role_service: CustomRoleManagementService = Depends(get_role_service)
):
    """
    Remove a role from a user (Admin only)
    
    This removes a direct user-role assignment only. It does not affect roles
    inherited from groups.
    """
    success = await role_service.remove_role_from_user(
        user_id=user_id,
        role_id=role_id,
        tenant_id=current_user.tenant_id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role {role_id} not assigned to user {user_id}"
        )


@router.get("/users/{user_id}/direct", response_model=RoleListResponse)
async def get_user_direct_roles(
    user_id: str,
    current_user: AuthenticatedUser = Depends(get_current_active_user),
    role_service: CustomRoleManagementService = Depends(get_role_service)
):
    """
    Get roles directly assigned to a user (Method 1 only)
    
    This does NOT include roles inherited from groups.
    For all roles including group roles, use /users/{user_id}/all endpoint.
    """
    # Check authorization - user can view their own roles, or admin can view any
    if user_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own roles unless you are an admin"
        )
    
    roles = await role_service.get_user_direct_roles(user_id, current_user.tenant_id)
    
    role_responses = [
        RoleResponse(
            id=role.id,
            tenant_id=role.tenant_id,
            name=role.name,
            description=role.description,
            permissions=role.permissions,
            is_system_role=role.is_system_role,
            created_at=role.created_at,
            updated_at=role.updated_at
        )
        for role in roles
    ]
    
    return RoleListResponse(roles=role_responses, total=len(role_responses))

