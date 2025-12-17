"""
CRUD Router Presets - Simplified configuration for common patterns

This module provides preset configurations and helper functions to make
creating CRUD routers even easier for common use cases.
"""
from typing import Callable, Optional, Tuple, Type

from pydantic import BaseModel

from app.domain.shared.value_objects.role import Permission
from app.presentation.shared.routes.base_crud_router import BaseCRUDRouter, CRUDRouterConfig


class CRUDPresets:
    """Predefined configurations for common CRUD patterns"""
    
    STANDARD_CRUD = {
        "description": "Standard CRUD with permission-based auth for all operations",
        "routes": ["create", "read", "update", "delete", "list"],
    }
    
    PUBLIC_READ_PROTECTED_WRITE = {
        "description": "Public read access, protected write operations",
        "routes": ["create", "read", "update", "delete", "list"],
        "public_operations": ["read", "list"],
    }
    
    READ_ONLY = {
        "description": "Read-only access (no create/update/delete)",
        "routes": ["read", "list"],
    }
    
    ADMIN_ONLY = {
        "description": "All operations require admin permission",
        "routes": ["create", "read", "update", "delete", "list"],
        "admin_only": True,
    }


def create_crud_router(
    resource_name: str,
    resource_name_plural: str,
    schemas: Tuple[Type[BaseModel], Type[BaseModel], Type[BaseModel]],
    commands: Tuple[Type, Type, Type],
    queries: Tuple[Type, Type],
    mapper: Callable,
    permissions: Optional[Tuple[Permission, Permission, Permission, Permission]] = None,
    list_mapper: Optional[Callable] = None,
    list_response_schema: Optional[Type[BaseModel]] = None,
    preset: str = "standard_crud",
    **kwargs
) -> BaseCRUDRouter:
    """
    Simplified helper function to create CRUD router with less boilerplate.
    
    Args:
        resource_name: Singular resource name (e.g., "User")
        resource_name_plural: Plural resource name (e.g., "Users")
        schemas: Tuple of (CreateSchema, UpdateSchema, ResponseSchema)
        commands: Tuple of (CreateCommand, UpdateCommand, DeleteCommand)
        queries: Tuple of (GetByIdQuery, GetAllQuery)
        mapper: Function to convert domain entity to response schema
        permissions: Optional tuple of (create, read, update, delete) permissions
        list_mapper: Optional mapper for list/paginated responses
        list_response_schema: Optional schema for list responses
        preset: Configuration preset to use
        **kwargs: Additional configuration overrides
    
    Returns:
        Configured BaseCRUDRouter instance ready to use
    
    Example:
        ```python
        router = create_crud_router(
            resource_name="User",
            resource_name_plural="Users",
            schemas=(UserCreate, UserUpdate, UserResponse),
            commands=(CreateUserCommand, UpdateUserCommand, DeleteUserCommand),
            queries=(GetUserByIdQuery, GetAllUsersQuery),
            mapper=user_to_response,
            permissions=(
                Permission.CREATE_USER,
                Permission.READ_USER,
                Permission.UPDATE_USER,
                Permission.DELETE_USER
            ),
        ).get_router()
        ```
    """
    create_schema, update_schema, response_schema = schemas
    create_cmd, update_cmd, delete_cmd = commands
    get_by_id_query, get_all_query = queries
    
    # Build config based on preset
    config_kwargs = {
        "resource_name": resource_name,
        "resource_name_plural": resource_name_plural,
        "create_schema": create_schema,
        "update_schema": update_schema,
        "response_schema": response_schema,
        "create_command_class": create_cmd,
        "update_command_class": update_cmd,
        "delete_command_class": delete_cmd,
        "get_by_id_query_class": get_by_id_query,
        "get_all_query_class": get_all_query,
        "to_response_mapper": mapper,
        "to_list_response_mapper": list_mapper,
        "list_response_schema": list_response_schema,
    }
    
    # Apply preset
    if preset == "standard_crud" and permissions:
        create_perm, read_perm, update_perm, delete_perm = permissions
        config_kwargs.update({
            "create_permission": create_perm,
            "read_permission": read_perm,
            "update_permission": update_perm,
            "delete_permission": delete_perm,
        })
    elif preset == "public_read_protected_write" and permissions:
        create_perm, _, update_perm, delete_perm = permissions
        config_kwargs.update({
            "create_permission": create_perm,
            "read_permission": None,  # Public read
            "update_permission": update_perm,
            "delete_permission": delete_perm,
            "list_auth_dependency": None,  # Public list
        })
    elif preset == "read_only":
        config_kwargs.update({
            "read_permission": permissions[1] if permissions else None,
            "create_command_class": None,
            "update_command_class": None,
            "delete_command_class": None,
        })
    
    # Apply any manual overrides
    config_kwargs.update(kwargs)
    
    config = CRUDRouterConfig(**config_kwargs)
    crud_router = BaseCRUDRouter(config)
    
    # Register routes based on preset
    if preset == "read_only":
        crud_router.register_get_by_id_route()
        crud_router.register_get_all_route()
    else:
        crud_router.register_all_routes()
    
    return crud_router


def quick_crud_router(
    resource: str,
    schemas: Tuple[Type[BaseModel], Type[BaseModel], Type[BaseModel]],
    commands: Tuple[Type, Type, Type],
    queries: Tuple[Type, Type],
    mapper: Callable,
    permissions: Tuple[Permission, Permission, Permission, Permission],
    **kwargs
):
    """
    Ultra-simplified CRUD router creation (infers plural from singular).
    
    Example:
        ```python
        router = quick_crud_router(
            resource="User",
            schemas=(UserCreate, UserUpdate, UserResponse),
            commands=(CreateUserCommand, UpdateUserCommand, DeleteUserCommand),
            queries=(GetUserByIdQuery, GetAllUsersQuery),
            mapper=user_to_response,
            permissions=(
                Permission.CREATE_USER,
                Permission.READ_USER,
                Permission.UPDATE_USER,
                Permission.DELETE_USER
            ),
        ).get_router()
        ```
    """
    # Simple pluralization (can be enhanced)
    plural = f"{resource}s"
    
    return create_crud_router(
        resource_name=resource,
        resource_name_plural=plural,
        schemas=schemas,
        commands=commands,
        queries=queries,
        mapper=mapper,
        permissions=permissions,
        **kwargs
    )


# Convenience type aliases for cleaner code
CRUDSchemas = Tuple[Type[BaseModel], Type[BaseModel], Type[BaseModel]]
CRUDCommands = Tuple[Type, Type, Type]
CRUDQueries = Tuple[Type, Type]
CRUDPermissions = Tuple[Permission, Permission, Permission, Permission]

