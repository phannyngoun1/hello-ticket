"""
User API routes with authentication and authorization
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Query
from app.presentation.api.core.user_schemas import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserDetailResponse,
    ComplexUsersSearchRequest,
    PaginatedUserResponse,
    ResetPasswordRequest,
)
from app.shared.container import container
from app.application.core.user import (
    UserQueryHandler,
    CreateUserCommand,
    UpdateUserCommand,
    DeleteUserCommand,
    ActivateUserCommand,
    DeactivateUserCommand,
    LockUserCommand,
    UnlockUserCommand,
    GetUserByIdQuery,
    GetUserByEmailQuery,
    GetAllUsersQuery,
    SearchUsersQuery,
    ComplexUsersQuery,
)
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission, UserRole
from app.presentation.core.dependencies.auth_dependencies import (
    get_current_active_user,
    RequirePermission,
    get_auth_service,
)
from app.application.core.auth import AuthService
from app.presentation.shared.dependencies import get_mediator_dependency
from app.shared.mediator import Mediator
from fastapi import Request
from app.infrastructure.shared.audit.audit_logger import (
    AuditLogEvent,
    AuditEventType,
    AuditSeverity,
    get_audit_context,
    _audit_logger_var
)


router = APIRouter(prefix="/users", tags=["users"])


# Helper functions for audit logging
async def _log_account_lock_event(user_id: str, lockout_minutes: int, locked_until, request: Request) -> None:
    """Log account lock event to audit log"""
    try:
        audit_logger = _audit_logger_var.get()
        if not audit_logger:
            return
        
        context = get_audit_context()
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("User-Agent")
        
        if context:
            audit_event = context.create_event(
                event_type=AuditEventType.ACCOUNT_LOCK,
                entity_type="user",
                entity_id=user_id,
                description=f"User account locked for {lockout_minutes} minutes",
                new_values={
                    "locked_until": locked_until.isoformat() if locked_until else None,
                    "lockout_minutes": lockout_minutes
                },
                severity=AuditSeverity.HIGH
            )
            audit_event.ip_address = ip_address or context.ip_address
            audit_event.user_agent = user_agent or context.user_agent
        else:
            from datetime import datetime, timezone
            from app.shared.utils import generate_id
            
            audit_event = AuditLogEvent(
                event_id=generate_id(),
                timestamp=datetime.now(timezone.utc),
                event_type=AuditEventType.ACCOUNT_LOCK,
                severity=AuditSeverity.HIGH,
                entity_type="user",
                entity_id=user_id,
                user_id=user_id,
                ip_address=ip_address,
                user_agent=user_agent,
                description=f"User account locked for {lockout_minutes} minutes",
                new_values={
                    "locked_until": locked_until.isoformat() if locked_until else None,
                    "lockout_minutes": lockout_minutes
                },
                metadata={"logged_without_request_context": True}
            )
        
        await audit_logger.log_event(audit_event)
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Failed to log account lock audit event: {e}")


async def _log_account_unlock_event(user_id: str, request: Request) -> None:
    """Log account unlock event to audit log"""
    try:
        audit_logger = _audit_logger_var.get()
        if not audit_logger:
            return
        
        context = get_audit_context()
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("User-Agent")
        
        if context:
            audit_event = context.create_event(
                event_type=AuditEventType.ACCOUNT_UNLOCK,
                entity_type="user",
                entity_id=user_id,
                description="User account unlocked",
                new_values={
                    "locked_until": None,
                    "failed_login_attempts": 0
                },
                severity=AuditSeverity.MEDIUM
            )
            audit_event.ip_address = ip_address or context.ip_address
            audit_event.user_agent = user_agent or context.user_agent
        else:
            from datetime import datetime, timezone
            from app.shared.utils import generate_id
            
            audit_event = AuditLogEvent(
                event_id=generate_id(),
                timestamp=datetime.now(timezone.utc),
                event_type=AuditEventType.ACCOUNT_UNLOCK,
                severity=AuditSeverity.MEDIUM,
                entity_type="user",
                entity_id=user_id,
                user_id=user_id,
                ip_address=ip_address,
                user_agent=user_agent,
                description="User account unlocked",
                new_values={
                    "locked_until": None,
                    "failed_login_attempts": 0
                },
                metadata={"logged_without_request_context": True}
            )
        
        await audit_logger.log_event(audit_event)
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Failed to log account unlock audit event: {e}")


def _user_to_response(user) -> UserResponse:
    """Convert domain user to response schema"""
    # Handle base_role - User has it directly, AuthenticatedUser has it in role.value
    base_role = getattr(user, 'base_role', None)
    if base_role is None and hasattr(user, 'role'):
        # AuthenticatedUser has role as a Role object with a value property
        try:
            if user.role and hasattr(user.role, 'value'):
                base_role = user.role.value
        except (AttributeError, TypeError):
            base_role = None
    
    # Handle last_login - both User and AuthenticatedUser have this attribute
    last_login =user.last_login
    
    return UserResponse(
        id=user.id,
        username=user.username,
        first_name=user.first_name.value,
        last_name=user.last_name.value,
        email=user.email.value,
        created_at=user.created_at,
        updated_at=user.updated_at,
        is_active=user.is_active,
        base_role=base_role,
        last_login=last_login,
        locked_until=getattr(user, 'locked_until', None)
    )


def _user_to_detail_response(user) -> UserDetailResponse:
    """Convert domain user to detailed response schema with additional fields"""
    # Handle base_role - User has it directly, AuthenticatedUser has it in role.value
    base_role = getattr(user, 'base_role', None)
    if base_role is None and hasattr(user, 'role'):
        try:
            if user.role and hasattr(user.role, 'value'):
                base_role = user.role.value
        except (AttributeError, TypeError):
            base_role = None
    
    # Handle last_login - both User and AuthenticatedUser have this attribute
    last_login = user.last_login
    
    return UserDetailResponse(
        id=user.id,
        username=user.username,
        first_name=user.first_name.value,
        last_name=user.last_name.value,
        email=user.email.value,
        created_at=user.created_at,
        updated_at=user.updated_at,
        is_active=user.is_active,
        base_role=base_role,
        last_login=last_login,
        is_verified=getattr(user, 'is_verified', False),
        must_change_password=getattr(user, 'must_change_password', False),
        last_password_change=getattr(user, 'last_password_change', None),
        failed_login_attempts=getattr(user, 'failed_login_attempts', 0),
        locked_until=getattr(user, 'locked_until', None),
        tenant_id=getattr(user, 'tenant_id', None)
    )


@router.post("/", response_model=UserResponse, status_code=201)
async def create_user(
    user_data: UserCreate,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.CREATE_USER)),
    mediator: Mediator = Depends(get_mediator_dependency),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Create a new user (requires CREATE_USER permission - Admin/Manager only)
    
    If password is provided, creates an authenticated user that can login.
    If password is not provided, creates a simple user record (cannot login).
    """
    # Auto-generate username from email if not provided
    username = user_data.username
    if not username:
        username = user_data.email.split('@')[0]
    
    # If password is provided, use auth service to create authenticated user
    if user_data.password:
        # Parse role
        role = UserRole.USER
        if user_data.role:
            try:
                role = UserRole(user_data.role)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid role: {user_data.role}")
        
        # Create authenticated user (can login)
        auth_user = await auth_service.register(
            username=username,
            email=user_data.email,
            password=user_data.password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            role=role
        )
        return _user_to_response(auth_user)
    else:
        # Create simple user (cannot login)
        command = CreateUserCommand(
            username=username,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            email=user_data.email
        )
        user = await mediator.send(command)
        return _user_to_response(user)


# IMPORTANT: /search routes must be defined BEFORE /{user_id} route
# FastAPI matches routes in order, so specific routes should come before parameterized routes
@router.get("/search", response_model=List[UserResponse])
async def search_users(
    q: str = Query(..., min_length=1, description="Search query for name, email, or username"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.READ_USER)),
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """Search users by name, email, or username (requires READ_USER permission - Admin/Manager/User)"""
    query = SearchUsersQuery(query=q, skip=skip, limit=limit)
    users = await mediator.query(query)
    return [_user_to_response(user) for user in users]


@router.post("/search", response_model=PaginatedUserResponse)
async def complex_search_users(
    request: ComplexUsersSearchRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.READ_USER)),
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """
    Complex user search with arrays and nested filters (POST method for large filter criteria)
    
    Use this endpoint when filters include:
    - Arrays of IDs or values
    - Complex nested filter objects
    - Large filter payloads (>1500 chars estimated)
    
    Requires READ_USER permission - Admin/Manager/User
    
    Returns paginated response with:
    - items: List of users in current page
    - total: Total number of users matching filters
    - skip: Number of users skipped
    - limit: Maximum users per page
    - page: Current page number (1-based)
    - total_pages: Total number of pages
    """
    filter_data = request.filter or {}
    pagination = request.pagination or {"skip": 0, "limit": 100}
    skip = pagination.get("skip", 0)
    limit = min(pagination.get("limit", 100), 1000)  # Enforce max limit
    
    # Parse dates if provided
    created_after_dt = None
    created_before_dt = None
    if filter_data.get("created_after"):
        try:
            created_after_dt = datetime.fromisoformat(
                str(filter_data["created_after"]).replace('Z', '+00:00')
            )
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=400,
                detail="Invalid created_after date format. Use ISO format."
            )
    if filter_data.get("created_before"):
        try:
            created_before_dt = datetime.fromisoformat(
                str(filter_data["created_before"]).replace('Z', '+00:00')
            )
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=400,
                detail="Invalid created_before date format. Use ISO format."
            )
    
    # Build query
    query = ComplexUsersQuery(
        skip=skip,
        limit=limit,
        search=filter_data.get("search"),
        role=filter_data.get("role"),
        is_active=filter_data.get("is_active"),
        created_after=created_after_dt,
        created_before=created_before_dt,
        user_ids=filter_data.get("userIds") or filter_data.get("user_ids"),
        tags=filter_data.get("tags"),
        additional_filters={
            k: v for k, v in filter_data.items()
            if k not in ["search", "role", "is_active", "created_after", "created_before", "userIds", "user_ids", "tags"]
        }
    )
    
    # Get users and total count in parallel
    users = await mediator.query(query)
    
    # Get total count using the same filters
    handler = container.resolve(UserQueryHandler)
    total = await handler.handle_count_complex_users(query)
    
    # Calculate pagination metadata
    page = (skip // limit) + 1 if limit > 0 else 1
    total_pages = (total + limit - 1) // limit if limit > 0 else 1
    
    return PaginatedUserResponse(
        items=[_user_to_response(user) for user in users],
        total=total,
        skip=skip,
        limit=limit,
        page=page,
        total_pages=total_pages
    )


# IMPORTANT: GET / route must be defined BEFORE GET /{user_id} route
# FastAPI matches routes in order, so specific routes should come before parameterized routes
@router.get("/", response_model=PaginatedUserResponse)
async def get_users(
    skip: int = Query(0, ge=0, description="Number of users to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of users to return"),
    search: Optional[str] = Query(None, description="Search query for name, email, or username"),
    role: Optional[str] = Query(None, description="Filter by base role"),
    is_active: Optional[bool] = Query(None, description="Filter by active status (true/false)"),
    created_after: Optional[str] = Query(None, description="Filter users created after this date (ISO format)"),
    created_before: Optional[str] = Query(None, description="Filter users created before this date (ISO format)"),
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.READ_USER)),
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """
    Get all users with pagination and filtering (requires READ_USER permission - Admin/Manager/User)
    
    Returns paginated response with:
    - items: List of users in current page
    - total: Total number of users matching filters
    - skip: Number of users skipped
    - limit: Maximum users per page
    - page: Current page number (1-based)
    - total_pages: Total number of pages
    """
    # Parse date strings to datetime if provided
    created_after_dt = None
    created_before_dt = None
    if created_after:
        try:
            created_after_dt = datetime.fromisoformat(created_after.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid created_after date format. Use ISO format.")
    if created_before:
        try:
            created_before_dt = datetime.fromisoformat(created_before.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid created_before date format. Use ISO format.")
    
    query = GetAllUsersQuery(
        skip=skip,
        limit=limit,
        search=search,
        role=role,
        is_active=is_active,
        created_after=created_after_dt,
        created_before=created_before_dt,
    )
    
    # Get users
    users = await mediator.query(query)
    
    # Get total count using the same filters
    handler = container.resolve(UserQueryHandler)
    total = await handler.handle_count_all_users(query)
    
    # Calculate pagination metadata
    page = (skip // limit) + 1 if limit > 0 else 1
    total_pages = (total + limit - 1) // limit if limit > 0 else 1
    
    return PaginatedUserResponse(
        items=[_user_to_response(user) for user in users],
        total=total,
        skip=skip,
        limit=limit,
        page=page,
        total_pages=total_pages
    )


@router.get("/{user_id}", response_model=UserDetailResponse)
async def get_user(
    user_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.READ_USER)),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Get user by ID with full details (requires READ_USER permission - Admin/Manager/User)
    
    Returns detailed user information including:
    - Basic user info (name, email, username, role, status)
    - Authentication status (verified, password change requirements)
    - Security info (failed login attempts, lockout status)
    - Last password change timestamp
    - Last login timestamp
    """
    # Use auth repository to get AuthenticatedUser with all security fields
    user = await auth_service._auth_repository.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_to_detail_response(user)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.UPDATE_USER)),
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """Update user (requires UPDATE_USER permission - Admin/Manager only)"""
    command = UpdateUserCommand(
        user_id=user_id,
        username=user_data.username,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        email=user_data.email
    )
    user = await mediator.send(command)
    return _user_to_response(user)


@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.DELETE_USER)),
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """Delete user (requires DELETE_USER permission - Admin only)"""
    command = DeleteUserCommand(user_id=user_id)
    success = await mediator.send(command)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")


@router.post("/{user_id}/activate", response_model=UserResponse)
async def activate_user(
    user_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.UPDATE_USER)),
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """Activate user (requires UPDATE_USER permission - Admin/Manager only)"""
    command = ActivateUserCommand(user_id=user_id)
    user = await mediator.send(command)
    return _user_to_response(user)


@router.post("/{user_id}/deactivate", response_model=UserResponse)
async def deactivate_user(
    user_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.UPDATE_USER)),
    mediator: Mediator = Depends(get_mediator_dependency)
):
    """Deactivate user (requires UPDATE_USER permission - Admin/Manager only)"""
    command = DeactivateUserCommand(user_id=user_id)
    user = await mediator.send(command)
    return _user_to_response(user)


@router.post("/{user_id}/lock", response_model=UserDetailResponse)
async def lock_user(
    request: Request,
    user_id: str,
    lockout_minutes: int = 60,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.UPDATE_USER)),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Lock user account (requires UPDATE_USER permission - Admin/Manager only)"""
    from datetime import timedelta
    from datetime import timezone as tz
    
    # Get user by ID - we need to access via auth repository
    user = await auth_service._auth_repository.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Lock the account
    from datetime import datetime
    locked_until = datetime.now(tz.utc) + timedelta(minutes=lockout_minutes)
    user.locked_until = locked_until
    user.updated_at = datetime.now(tz.utc)
    
    # Save the user and return the saved version
    saved_user = await auth_service._auth_repository.save(user)
    
    # Log account lock event
    await _log_account_lock_event(user_id, lockout_minutes, locked_until, request)
    
    return _user_to_detail_response(saved_user)


@router.post("/{user_id}/unlock", response_model=UserDetailResponse)
async def unlock_user(
    request: Request,
    user_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.UPDATE_USER)),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Unlock user account (requires UPDATE_USER permission - Admin/Manager only)"""
    from datetime import datetime
    from datetime import timezone as tz
    
    # Get user by ID
    user = await auth_service._auth_repository.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Unlock the account
    user.locked_until = None
    user.failed_login_attempts = 0
    user.updated_at = datetime.now(tz.utc)
    
    # Save the user and return the saved version
    saved_user = await auth_service._auth_repository.save(user)
    
    # Log account unlock event
    await _log_account_unlock_event(user_id, request)
    
    return _user_to_detail_response(saved_user)


@router.post("/{user_id}/reset-password", response_model=UserDetailResponse)
async def reset_password(
    user_id: str,
    request: ResetPasswordRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.UPDATE_USER)),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Reset user password (requires UPDATE_USER permission - Admin/Manager only)
    
    This endpoint is for admin-initiated password resets. The user will be required
    to change their password on next login for security.
    """
    # Get user by ID
    user = await auth_service._auth_repository.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Hash and update password
    new_hashed_password = auth_service._password_hasher.hash(request.new_password)
    user.update_password(new_hashed_password)
    
    # Force password change on next login (admin reset requires user to set own password)
    user.require_password_change()
    
    # Save the user and return the saved version
    saved_user = await auth_service._auth_repository.save(user)
    return _user_to_detail_response(saved_user)


# Role and Group Assignment Endpoints

@router.get("/{user_id}/groups")
async def get_user_groups(
    user_id: str,
    current_user: AuthenticatedUser = Depends(get_current_active_user),
):
    """Get all groups a user belongs to (requires READ_USER permission)
    
    Users can view their own groups, or admins can view any user's groups.
    """
    from app.application.core.rbac import GroupManagementService
    from app.infrastructure.core.rbac.group_repository import GroupRepository
    from app.infrastructure.core.rbac.role_repository import RoleRepository
    from app.infrastructure.shared.database.platform_connection import get_platform_session
    from app.presentation.api.rbac.group_schemas import GroupListResponse, GroupResponse
    
    # Check authorization - user can view their own groups, or admin can view any
    if user_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(
            status_code=403,
            detail="You can only view your own groups unless you are an admin"
        )
    
    platform_session = get_platform_session()
    try:
        group_repo = GroupRepository(platform_session)
        role_repo = RoleRepository(platform_session)
        group_service = GroupManagementService(group_repo, role_repo)
        
        groups = await group_service.get_user_groups(user_id, current_user.tenant_id)
        
        group_responses = [
            GroupResponse(
                id=g.id,
                tenant_id=g.tenant_id,
                name=g.name,
                description=g.description,
                is_active=g.is_active,
                created_at=g.created_at,
                updated_at=g.updated_at,
                members_count=0,  # Would need separate query for counts
                roles_count=0
            )
            for g in groups
        ]
        
        return GroupListResponse(groups=group_responses, total=len(group_responses))
    finally:
        await platform_session.close()


@router.get("/{user_id}/roles/all")
async def get_user_all_roles(
    user_id: str,
    current_user: AuthenticatedUser = Depends(get_current_active_user),
):
    """Get all roles for a user including direct roles and roles from groups (requires READ_USER permission)
    
    This includes:
    - Direct role assignments (Method 1)
    - Roles inherited from groups (Method 2)
    
    Users can view their own roles, or admins can view any user's roles.
    """
    from app.application.core.rbac import GroupManagementService
    from app.infrastructure.core.rbac.group_repository import GroupRepository
    from app.infrastructure.core.rbac.role_repository import RoleRepository
    from app.infrastructure.shared.database.platform_connection import get_platform_session
    from app.presentation.api.rbac.role_schemas import RoleListResponse, RoleResponse
    
    # Check authorization - user can view their own roles, or admin can view any
    if user_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(
            status_code=403,
            detail="You can only view your own roles unless you are an admin"
        )
    
    platform_session = get_platform_session()
    try:
        group_repo = GroupRepository(platform_session)
        role_repo = RoleRepository(platform_session)
        group_service = GroupManagementService(group_repo, role_repo)
        
        roles = await group_service.get_user_all_roles(user_id, current_user.tenant_id)
        
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
    finally:
        await platform_session.close()
