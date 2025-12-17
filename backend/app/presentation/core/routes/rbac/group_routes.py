"""
Group management API routes
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.presentation.core.dependencies.auth_dependencies import get_current_active_user, require_admin
from app.presentation.api.rbac.group_schemas import (
    GroupCreate,
    GroupUpdate,
    GroupResponse,
    GroupListResponse,
    AddUserToGroupRequest,
    AddRoleToGroupRequest,
    UserGroupResponse,
    GroupRoleResponse,
    RoleResponse
)
from app.application.core.rbac import GroupManagementService
from app.infrastructure.core.rbac.group_repository import GroupRepository
from app.infrastructure.core.rbac.role_repository import RoleRepository
from app.infrastructure.shared.database.platform_connection import get_platform_session


router = APIRouter(prefix="/groups", tags=["groups"])


async def get_group_service():
    """Dependency to get group management service"""
    platform_session = get_platform_session()
    group_repo = GroupRepository(platform_session)
    role_repo = RoleRepository(platform_session)
    try:
        yield GroupManagementService(group_repo, role_repo)
    finally:
        await platform_session.close()


@router.post("/", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
async def create_group(
    group_data: GroupCreate,
    current_user: AuthenticatedUser = Depends(require_admin),
    group_service: GroupManagementService = Depends(get_group_service)
):
    """
    Create a new group (Admin only)
    """
    group = await group_service.create_group(
        tenant_id=current_user.tenant_id,
        name=group_data.name,
        description=group_data.description
    )
    
    return GroupResponse(
        id=group.id,
        tenant_id=group.tenant_id,
        name=group.name,
        description=group.description,
        is_active=group.is_active,
        created_at=group.created_at,
        updated_at=group.updated_at,
        members_count=0,  # Newly created group has no members yet
        roles_count=0  # Newly created group has no roles yet
    )


@router.get("/", response_model=GroupListResponse)
async def list_groups(
    include_inactive: bool = Query(False, description="Include inactive groups"),
    current_user: AuthenticatedUser = Depends(get_current_active_user),
    group_service: GroupManagementService = Depends(get_group_service)
):
    """
    List all groups for the current tenant with members and roles counts
    """
    groups = await group_service.list_groups(
        tenant_id=current_user.tenant_id,
        include_inactive=include_inactive
    )
    
    if not groups:
        return GroupListResponse(groups=[], total=0)
    
    # Fetch counts for all groups in batch (more efficient than N+1 queries)
    group_ids = [g.id for g in groups]
    member_counts = await group_service.get_groups_member_counts(group_ids, current_user.tenant_id)
    role_counts = await group_service.get_groups_role_counts(group_ids, current_user.tenant_id)
    
    group_responses = [
        GroupResponse(
            id=g.id,
            tenant_id=g.tenant_id,
            name=g.name,
            description=g.description,
            is_active=g.is_active,
            created_at=g.created_at,
            updated_at=g.updated_at,
            members_count=member_counts.get(g.id, 0),
            roles_count=role_counts.get(g.id, 0)
        )
        for g in groups
    ]
    
    return GroupListResponse(groups=group_responses, total=len(group_responses))


@router.get("/{group_id}", response_model=GroupResponse)
async def get_group(
    group_id: str,
    current_user: AuthenticatedUser = Depends(get_current_active_user),
    group_service: GroupManagementService = Depends(get_group_service)
):
    """
    Get a specific group by ID with members and roles counts
    """
    group = await group_service.get_group(group_id, current_user.tenant_id)
    
    # Fetch counts
    members = await group_service.get_group_members(group_id, current_user.tenant_id)
    roles = await group_service.get_group_roles(group_id, current_user.tenant_id)
    
    return GroupResponse(
        id=group.id,
        tenant_id=group.tenant_id,
        name=group.name,
        description=group.description,
        is_active=group.is_active,
        created_at=group.created_at,
        updated_at=group.updated_at,
        members_count=len(members),
        roles_count=len(roles)
    )


@router.patch("/{group_id}", response_model=GroupResponse)
async def update_group(
    group_id: str,
    group_data: GroupUpdate,
    current_user: AuthenticatedUser = Depends(require_admin),
    group_service: GroupManagementService = Depends(get_group_service)
):
    """
    Update a group (Admin only)
    """
    group = await group_service.update_group(
        group_id=group_id,
        tenant_id=current_user.tenant_id,
        name=group_data.name,
        description=group_data.description,
        is_active=group_data.is_active
    )
    
    # Fetch counts for updated group
    members = await group_service.get_group_members(group_id, current_user.tenant_id)
    roles = await group_service.get_group_roles(group_id, current_user.tenant_id)
    
    return GroupResponse(
        id=group.id,
        tenant_id=group.tenant_id,
        name=group.name,
        description=group.description,
        is_active=group.is_active,
        created_at=group.created_at,
        updated_at=group.updated_at,
        members_count=len(members),
        roles_count=len(roles)
    )


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(
    group_id: str,
    current_user: AuthenticatedUser = Depends(require_admin),
    group_service: GroupManagementService = Depends(get_group_service)
):
    """
    Delete a group (Admin only)
    """
    success = await group_service.delete_group(group_id, current_user.tenant_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Group {group_id} not found"
        )


# User-Group Membership Endpoints

@router.post("/{group_id}/users", response_model=UserGroupResponse, status_code=status.HTTP_201_CREATED)
async def add_user_to_group(
    group_id: str,
    request: AddUserToGroupRequest,
    current_user: AuthenticatedUser = Depends(require_admin),
    group_service: GroupManagementService = Depends(get_group_service)
):
    """
    Add a user to a group (Admin only)
    
    The user will inherit all roles from this group.
    """
    user_group = await group_service.add_user_to_group(
        user_id=request.user_id,
        group_id=group_id,
        tenant_id=current_user.tenant_id
    )
    
    return UserGroupResponse(
        user_id=user_group.user_id,
        group_id=user_group.group_id,
        tenant_id=user_group.tenant_id,
        assigned_at=user_group.added_at
    )


@router.delete("/{group_id}/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_user_from_group(
    group_id: str,
    user_id: str,
    current_user: AuthenticatedUser = Depends(require_admin),
    group_service: GroupManagementService = Depends(get_group_service)
):
    """
    Remove a user from a group (Admin only)
    """
    success = await group_service.remove_user_from_group(
        user_id=user_id,
        group_id=group_id,
        tenant_id=current_user.tenant_id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found in group {group_id}"
        )


@router.get("/{group_id}/users", response_model=List[str])
async def get_group_members(
    group_id: str,
    current_user: AuthenticatedUser = Depends(get_current_active_user),
    group_service: GroupManagementService = Depends(get_group_service)
):
    """
    Get all user IDs that are members of a group
    """
    return await group_service.get_group_members(group_id, current_user.tenant_id)


# Group-Role Assignment Endpoints

@router.post("/{group_id}/roles", response_model=GroupRoleResponse, status_code=status.HTTP_201_CREATED)
async def add_role_to_group(
    group_id: str,
    request: AddRoleToGroupRequest,
    current_user: AuthenticatedUser = Depends(require_admin),
    group_service: GroupManagementService = Depends(get_group_service)
):
    """
    Add a role to a group (Admin only)
    
    All users in this group will inherit this role's permissions.
    """
    group_role = await group_service.add_role_to_group(
        group_id=group_id,
        role_id=request.role_id,
        tenant_id=current_user.tenant_id
    )
    
    return GroupRoleResponse(
        group_id=group_role.group_id,
        role_id=group_role.role_id,
        tenant_id=group_role.tenant_id,
        assigned_at=group_role.added_at
    )


@router.delete("/{group_id}/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_role_from_group(
    group_id: str,
    role_id: str,
    current_user: AuthenticatedUser = Depends(require_admin),
    group_service: GroupManagementService = Depends(get_group_service)
):
    """
    Remove a role from a group (Admin only)
    """
    success = await group_service.remove_role_from_group(
        group_id=group_id,
        role_id=role_id,
        tenant_id=current_user.tenant_id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role {role_id} not found in group {group_id}"
        )


@router.get("/{group_id}/roles", response_model=List[RoleResponse])
async def get_group_roles(
    group_id: str,
    current_user: AuthenticatedUser = Depends(get_current_active_user),
    group_service: GroupManagementService = Depends(get_group_service)
):
    """
    Get all roles that belong to a group
    """
    roles = await group_service.get_group_roles(group_id, current_user.tenant_id)
    
    return [
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

