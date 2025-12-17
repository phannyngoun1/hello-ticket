"""
User command and query handlers
"""
from typing import Optional, Dict, Any, List
from .commands import (
    CreateUserCommand,
    UpdateUserCommand,
    DeleteUserCommand,
    ActivateUserCommand,
    DeactivateUserCommand,
)
from .queries import (
    GetUserByIdQuery,
    GetUserByEmailQuery,
    GetAllUsersQuery,
    SearchUsersQuery,
    UserExistsQuery,
    ComplexUsersQuery,
)
from app.domain.core.user.entity import User
from app.domain.shared.value_objects.email import Email
from app.domain.shared.value_objects.first_name import FirstName
from app.domain.shared.value_objects.last_name import LastName
from app.domain.core.user.repository import UserRepository
from app.shared.exceptions import NotFoundError, BusinessRuleError
from app.shared.tenant_context import require_tenant_context
from app.infrastructure.shared.audit.audit_logger import (
    AuditEvent,
    AuditEventType,
    AuditSeverity,
    AuditLogger,
    get_audit_context,
    _audit_logger_var
)


class UserCommandHandler:
    """Handler for user commands"""
    
    def __init__(self, user_repository: UserRepository):
        self._user_repository = user_repository
    
    async def handle_create_user(self, command: CreateUserCommand) -> User:
        """Handle create user command"""
        # Get tenant_id from context
        tenant_id = require_tenant_context()
        
        # Validate input
        if not command.username or not command.username.strip():
            raise BusinessRuleError("Username is required")
        
        if not command.email or not command.email.strip():
            raise BusinessRuleError("Email is required")
        
        if not command.first_name or not command.first_name.strip():
            raise BusinessRuleError("First name is required")
        
        if not command.last_name or not command.last_name.strip():
            raise BusinessRuleError("Last name is required")
        
        # Check if user already exists by email
        existing_user = await self._user_repository.get_by_email(command.email)
        if existing_user:
            raise BusinessRuleError(f"User with email {command.email} already exists")
        
        # Check if username already exists
        existing_username = await self._user_repository.get_by_username(command.username)
        if existing_username:
            raise BusinessRuleError(f"Username {command.username} already exists")
        
        # Create new user
        user = User(
            username=command.username.strip(),
            first_name=FirstName(command.first_name.strip()),
            last_name=LastName(command.last_name.strip()),
            email=Email(command.email.strip()),
            tenant_id=tenant_id
        )
        
        created_user = await self._user_repository.save(user)
        
        # Log audit event
        await self._log_user_create(created_user.id, created_user)
        
        return created_user
    
    async def _log_user_create(self, user_id: str, user: User) -> None:
        """Log user creation to audit log"""
        try:
            audit_logger = _audit_logger_var.get()
            if not audit_logger:
                return
            
            context = get_audit_context()
            new_values = {
                "username": user.username,
                "first_name": user.first_name.value,
                "last_name": user.last_name.value,
                "email": user.email.value,
                "is_active": user.is_active,
                "tenant_id": user.tenant_id,
            }
            
            if context:
                audit_event = context.create_event(
                    event_type=AuditEventType.CREATE,
                    entity_type="user",
                    entity_id=user_id,
                    description=f"User created: {user.username} ({user.email.value})",
                    new_values=new_values,
                    severity=AuditSeverity.MEDIUM
                )
            else:
                from datetime import datetime, timezone
                from app.shared.utils import generate_id
                
                audit_event = AuditEvent(
                    event_id=generate_id(),
                    timestamp=datetime.now(timezone.utc),
                    event_type=AuditEventType.CREATE,
                    severity=AuditSeverity.MEDIUM,
                    entity_type="user",
                    entity_id=user_id,
                    description=f"User created: {user.username} ({user.email.value})",
                    new_values=new_values,
                    metadata={"logged_without_request_context": True}
                )
            
            await audit_logger.log_event(audit_event)
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Failed to log user create audit event: {e}")
    
    async def handle_update_user(self, command: UpdateUserCommand) -> User:
        """Handle update user command"""
        # Get tenant_id from context for security validation
        tenant_id = require_tenant_context()
        
        user = await self._user_repository.get_by_id(command.user_id)
        if not user:
            raise NotFoundError(f"User with ID {command.user_id} not found")
        
        # Validate user belongs to current tenant (prevent cross-tenant access)
        if user.tenant_id != tenant_id:
            raise NotFoundError(f"User with ID {command.user_id} not found")
        
        # Capture old values for audit log
        old_values: Dict[str, Any] = {
            "username": user.username,
            "first_name": user.first_name.value,
            "last_name": user.last_name.value,
            "email": user.email.value,
            "is_active": user.is_active,
        }
        
        changed_fields = []
        
        # Update fields if provided
        if command.username:
            # Check if username is already taken by another user
            existing_username = await self._user_repository.get_by_username(command.username)
            if existing_username and existing_username.id != command.user_id:
                raise BusinessRuleError(f"Username {command.username} is already taken")
            if user.username != command.username:
                changed_fields.append("username")
            user.update_username(command.username)
        
        if command.first_name:
            if user.first_name.value != command.first_name:
                changed_fields.append("first_name")
            user.update_first_name(FirstName(command.first_name))
        
        if command.last_name:
            if user.last_name.value != command.last_name:
                changed_fields.append("last_name")
            user.update_last_name(LastName(command.last_name))
        
        if command.email:
            # Check if email is already taken by another user
            existing_user = await self._user_repository.get_by_email(command.email)
            if existing_user and existing_user.id != command.user_id:
                raise BusinessRuleError(f"Email {command.email} is already taken")
            if user.email.value != command.email:
                changed_fields.append("email")
            user.update_email(Email(command.email))
        
        updated_user = await self._user_repository.save(user)
        
        # Capture new values for audit log
        new_values: Dict[str, Any] = {
            "username": updated_user.username,
            "first_name": updated_user.first_name.value,
            "last_name": updated_user.last_name.value,
            "email": updated_user.email.value,
            "is_active": updated_user.is_active,
        }
        
        # Log audit event
        await self._log_user_update(user.id, old_values, new_values, changed_fields)
        
        return updated_user
    
    async def _log_user_update(
        self,
        user_id: str,
        old_values: Dict[str, Any],
        new_values: Dict[str, Any],
        changed_fields: list
    ) -> None:
        """Log user update to audit log"""
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            # Try to get logger from context first, fallback to container
            audit_logger = _audit_logger_var.get()
            if not audit_logger:
                # Fallback: try to get from container
                try:
                    from app.shared.container import container
                    audit_logger = container.resolve(AuditLogger)
                    if audit_logger:
                        logger.debug("Retrieved audit logger from container")
                except Exception as e:
                    logger.warning(f"Could not retrieve audit logger: {e}")
                    return
            
            if not audit_logger:
                logger.warning("No audit logger available, skipping audit log")
                return
            
            context = get_audit_context()
            if context:
                # Create audit event with context
                audit_event = context.create_event(
                    event_type=AuditEventType.UPDATE,
                    entity_type="user",
                    entity_id=user_id,
                    description=f"User updated: {', '.join(changed_fields) if changed_fields else 'no changes'}",
                    old_values=old_values,
                    new_values=new_values,
                    severity=AuditSeverity.MEDIUM
                )
                audit_event.changed_fields = changed_fields
                logger.debug(f"Created audit event with context: {audit_event.event_id}")
            else:
                # No context (background job), create minimal event
                from datetime import datetime, timezone
                from app.shared.utils import generate_id
                from app.shared.tenant_context import get_tenant_context
                
                audit_event = AuditEvent(
                    event_id=generate_id(),
                    timestamp=datetime.now(timezone.utc),
                    event_type=AuditEventType.UPDATE,
                    severity=AuditSeverity.MEDIUM,
                    entity_type="user",
                    entity_id=user_id,
                    description=f"User updated: {', '.join(changed_fields) if changed_fields else 'no changes'}",
                    old_values=old_values,
                    new_values=new_values,
                    changed_fields=changed_fields,
                    metadata={"logged_without_request_context": True}
                )
                logger.debug(f"Created audit event without context: {audit_event.event_id}")
            
            # Log asynchronously (non-blocking)
            logger.debug(f"Logging audit event {audit_event.event_id} for user {user_id}")
            await audit_logger.log_event(audit_event)
            logger.debug(f"Successfully queued audit event {audit_event.event_id}")
        except Exception as e:
            # Don't fail the operation if audit logging fails, but log the error
            logger.error(f"Failed to log user update audit event: {e}", exc_info=True)
    
    async def handle_delete_user(self, command: DeleteUserCommand) -> bool:
        """Handle delete user command"""
        # Get tenant_id from context for security validation
        tenant_id = require_tenant_context()
        
        user = await self._user_repository.get_by_id(command.user_id)
        if not user:
            raise NotFoundError(f"User with ID {command.user_id} not found")
        
        # Validate user belongs to current tenant (prevent cross-tenant access)
        if user.tenant_id != tenant_id:
            raise NotFoundError(f"User with ID {command.user_id} not found")
        
        # Capture user data before deletion for audit log
        old_values = {
            "username": user.username,
            "first_name": user.first_name.value,
            "last_name": user.last_name.value,
            "email": user.email.value,
            "is_active": user.is_active,
        }
        
        deleted = await self._user_repository.delete(command.user_id)
        
        # Log audit event
        if deleted:
            await self._log_user_delete(command.user_id, old_values)
        
        return deleted
    
    async def _log_user_delete(self, user_id: str, old_values: Dict[str, Any]) -> None:
        """Log user deletion to audit log"""
        try:
            audit_logger = _audit_logger_var.get()
            if not audit_logger:
                return
            
            context = get_audit_context()
            if context:
                audit_event = context.create_event(
                    event_type=AuditEventType.DELETE,
                    entity_type="user",
                    entity_id=user_id,
                    description=f"User deleted: {old_values.get('username', 'unknown')}",
                    old_values=old_values,
                    severity=AuditSeverity.HIGH
                )
            else:
                from datetime import datetime, timezone
                from app.shared.utils import generate_id
                
                audit_event = AuditEvent(
                    event_id=generate_id(),
                    timestamp=datetime.now(timezone.utc),
                    event_type=AuditEventType.DELETE,
                    severity=AuditSeverity.HIGH,
                    entity_type="user",
                    entity_id=user_id,
                    description=f"User deleted: {old_values.get('username', 'unknown')}",
                    old_values=old_values,
                    metadata={"logged_without_request_context": True}
                )
            
            await audit_logger.log_event(audit_event)
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Failed to log user delete audit event: {e}")
    
    async def handle_activate_user(self, command: ActivateUserCommand) -> User:
        """Handle activate user command"""
        # Get tenant_id from context for security validation
        tenant_id = require_tenant_context()
        
        user = await self._user_repository.get_by_id(command.user_id)
        if not user:
            raise NotFoundError(f"User with ID {command.user_id} not found")
        
        # Validate user belongs to current tenant (prevent cross-tenant access)
        if user.tenant_id != tenant_id:
            raise NotFoundError(f"User with ID {command.user_id} not found")
        
        old_values = {"is_active": user.is_active}
        user.activate()
        updated_user = await self._user_repository.save(user)
        
        # Log audit event
        await self._log_user_status_change(
            user.id,
            "activated",
            old_values,
            {"is_active": updated_user.is_active}
        )
        
        return updated_user
    
    async def handle_deactivate_user(self, command: DeactivateUserCommand) -> User:
        """Handle deactivate user command"""
        # Get tenant_id from context for security validation
        tenant_id = require_tenant_context()
        
        user = await self._user_repository.get_by_id(command.user_id)
        if not user:
            raise NotFoundError(f"User with ID {command.user_id} not found")
        
        # Validate user belongs to current tenant (prevent cross-tenant access)
        if user.tenant_id != tenant_id:
            raise NotFoundError(f"User with ID {command.user_id} not found")
        
        old_values = {"is_active": user.is_active}
        user.deactivate()
        updated_user = await self._user_repository.save(user)
        
        # Log audit event
        await self._log_user_status_change(
            user.id,
            "deactivated",
            old_values,
            {"is_active": updated_user.is_active}
        )
        
        return updated_user
    
    async def _log_user_status_change(
        self,
        user_id: str,
        action: str,
        old_values: Dict[str, Any],
        new_values: Dict[str, Any]
    ) -> None:
        """Log user status change (activate/deactivate) to audit log"""
        try:
            audit_logger = _audit_logger_var.get()
            if not audit_logger:
                return
            
            # Determine event type based on action
            if action == "activated":
                event_type = AuditEventType.ACCOUNT_ACTIVATE
            elif action == "deactivated":
                event_type = AuditEventType.ACCOUNT_DEACTIVATE
            else:
                event_type = AuditEventType.UPDATE
            
            context = get_audit_context()
            if context:
                audit_event = context.create_event(
                    event_type=event_type,
                    entity_type="user",
                    entity_id=user_id,
                    description=f"User {action}",
                    old_values=old_values,
                    new_values=new_values,
                    severity=AuditSeverity.MEDIUM
                )
            else:
                from datetime import datetime, timezone
                from app.shared.utils import generate_id
                
                audit_event = AuditEvent(
                    event_id=generate_id(),
                    timestamp=datetime.now(timezone.utc),
                    event_type=event_type,
                    severity=AuditSeverity.MEDIUM,
                    entity_type="user",
                    entity_id=user_id,
                    description=f"User {action}",
                    old_values=old_values,
                    new_values=new_values,
                    metadata={"logged_without_request_context": True}
                )
            
            await audit_logger.log_event(audit_event)
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Failed to log user status change audit event: {e}")


class UserQueryHandler:
    """Handler for user queries"""
    
    def __init__(self, user_repository: UserRepository):
        self._user_repository = user_repository
    
    async def handle_get_user_by_id(self, query: GetUserByIdQuery) -> Optional[User]:
        """Handle get user by ID query"""
        return await self._user_repository.get_by_id(query.user_id)
    
    async def handle_get_user_by_email(self, query: GetUserByEmailQuery) -> Optional[User]:
        """Handle get user by email query"""
        # Validate input
        if not query.email or not query.email.strip():
            from app.shared.exceptions import ValidationError
            raise ValidationError("Email is required")
        
        return await self._user_repository.get_by_email(query.email.strip())
    
    async def handle_get_all_users(self, query: GetAllUsersQuery) -> List[User]:
        """Handle get all users query with filtering"""
        return await self._user_repository.get_all(
            skip=query.skip,
            limit=query.limit,
            search=query.search,
            role=query.role,
            is_active=query.is_active,
            created_after=query.created_after,
            created_before=query.created_before,
        )
    
    async def handle_count_all_users(self, query: GetAllUsersQuery) -> int:
        """Handle count all users query with filtering"""
        return await self._user_repository.count_all(
            search=query.search,
            role=query.role,
            is_active=query.is_active,
            created_after=query.created_after,
            created_before=query.created_before,
        )
    
    async def handle_user_exists(self, query: UserExistsQuery) -> bool:
        """Handle user exists query"""
        if query.user_id:
            user = await self._user_repository.get_by_id(query.user_id)
            return user is not None
        elif query.email:
            return await self._user_repository.exists_by_email(query.email)
        else:
            from app.shared.exceptions import ValidationError
            raise ValidationError("Either user_id or email must be provided")
    
    async def handle_search_users(self, query: SearchUsersQuery) -> List[User]:
        """Handle search users query"""
        return await self._user_repository.search(query.query, query.skip, query.limit)
    
    async def handle_complex_users_query(self, query: ComplexUsersQuery) -> List[User]:
        """Handle complex users query with arrays and nested filters"""
        return await self._user_repository.get_all_complex(
            skip=query.skip,
            limit=query.limit,
            search=query.search,
            role=query.role,
            is_active=query.is_active,
            created_after=query.created_after,
            created_before=query.created_before,
            user_ids=query.user_ids,
            tags=query.tags,
            additional_filters=query.additional_filters,
        )
    
    async def handle_count_complex_users(self, query: ComplexUsersQuery) -> int:
        """Handle count complex users query with arrays and nested filters"""
        return await self._user_repository.count_all_complex(
            search=query.search,
            role=query.role,
            is_active=query.is_active,
            created_after=query.created_after,
            created_before=query.created_before,
            user_ids=query.user_ids,
            tags=query.tags,
            additional_filters=query.additional_filters,
        )
