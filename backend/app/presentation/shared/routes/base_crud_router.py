"""
Base CRUD router class to reduce code repetition across different resources.

This module provides a generic base class for creating CRUD routers with common
operations (Create, Read, Update, Delete) and consistent error handling.
"""
from typing import Any, Callable, Dict, Generic, List, Optional, Type, TypeVar, Union

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission
from app.presentation.core.dependencies.auth_dependencies import RequirePermission
from app.presentation.shared.dependencies import get_mediator_dependency
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError
from app.shared.mediator import Mediator


# Type variables for generic typing
TCreateSchema = TypeVar("TCreateSchema", bound=BaseModel)
TUpdateSchema = TypeVar("TUpdateSchema", bound=BaseModel)
TResponseSchema = TypeVar("TResponseSchema", bound=BaseModel)
TListResponseSchema = TypeVar("TListResponseSchema")
TCreateCommand = TypeVar("TCreateCommand")
TUpdateCommand = TypeVar("TUpdateCommand")
TDeleteCommand = TypeVar("TDeleteCommand")
TGetByIdQuery = TypeVar("TGetByIdQuery")
TGetAllQuery = TypeVar("TGetAllQuery")
TDomainEntity = TypeVar("TDomainEntity")


class CRUDRouterConfig(Generic[TCreateSchema, TUpdateSchema, TResponseSchema]):
    """Configuration for CRUD router"""
    
    def __init__(
        self,
        # Resource naming
        resource_name: str,
        resource_name_plural: str,
        
        # Schemas
        create_schema: Type[TCreateSchema],
        update_schema: Type[TUpdateSchema],
        response_schema: Type[TResponseSchema],
        list_response_schema: Optional[Type[TListResponseSchema]] = None,
        
        # Commands
        create_command_class: Type[TCreateCommand] = None,
        update_command_class: Type[TUpdateCommand] = None,
        delete_command_class: Type[TDeleteCommand] = None,
        
        # Queries
        get_by_id_query_class: Type[TGetByIdQuery] = None,
        get_all_query_class: Type[TGetAllQuery] = None,
        
        # Permissions
        create_permission: Optional[Permission] = None,
        read_permission: Optional[Permission] = None,
        update_permission: Optional[Permission] = None,
        delete_permission: Optional[Permission] = None,
        
        # Mapper functions
        to_response_mapper: Callable[[TDomainEntity], TResponseSchema] = None,
        to_list_response_mapper: Optional[Callable[[List[TDomainEntity]], TListResponseSchema]] = None,
        to_command_data_mapper: Optional[Callable[[TCreateSchema], Dict[str, Any]]] = None,
        
        # Custom authentication dependencies (for hybrid auth, etc.)
        create_auth_dependency: Optional[Callable] = None,
        read_auth_dependency: Optional[Callable] = None,
        update_auth_dependency: Optional[Callable] = None,
        delete_auth_dependency: Optional[Callable] = None,
        list_auth_dependency: Optional[Callable] = None,
        
        # Router configuration
        prefix: str = None,
        tags: List[str] = None,
    ):
        self.resource_name = resource_name
        self.resource_name_plural = resource_name_plural
        
        self.create_schema = create_schema
        self.update_schema = update_schema
        self.response_schema = response_schema
        self.list_response_schema = list_response_schema or List[response_schema]
        
        self.create_command_class = create_command_class
        self.update_command_class = update_command_class
        self.delete_command_class = delete_command_class
        
        self.get_by_id_query_class = get_by_id_query_class
        self.get_all_query_class = get_all_query_class
        
        self.create_permission = create_permission
        self.read_permission = read_permission
        self.update_permission = update_permission
        self.delete_permission = delete_permission
        
        self.to_response_mapper = to_response_mapper
        self.to_list_response_mapper = to_list_response_mapper
        self.to_command_data_mapper = to_command_data_mapper
        
        # Custom auth dependencies
        self.create_auth_dependency = create_auth_dependency
        self.read_auth_dependency = read_auth_dependency
        self.update_auth_dependency = update_auth_dependency
        self.delete_auth_dependency = delete_auth_dependency
        self.list_auth_dependency = list_auth_dependency
        
        self.prefix = prefix or f"/{resource_name_plural.lower()}"
        self.tags = tags or [resource_name_plural.lower()]


class BaseCRUDRouter:
    """Base class for CRUD routers with common operations"""
    
    def __init__(self, config: CRUDRouterConfig):
        self.config = config
        self.router = APIRouter(prefix=config.prefix, tags=config.tags)
        
    def _get_auth_dependency(self, operation: str) -> Optional[Callable]:
        """Get auth dependency for operation (custom or permission-based)"""
        custom_dep = getattr(self.config, f"{operation}_auth_dependency", None)
        if custom_dep:
            return custom_dep
        
        permission = getattr(self.config, f"{operation}_permission", None)
        if permission:
            return RequirePermission(permission)
        
        return None
    
    def _handle_error(self, e: Exception, default_message: str = "Internal server error"):
        """Centralized error handling"""
        if isinstance(e, NotFoundError):
            raise HTTPException(status_code=404, detail=str(e))
        elif isinstance(e, (ValidationError, BusinessRuleError)):
            raise HTTPException(status_code=400, detail=str(e))
        else:
            raise HTTPException(status_code=500, detail=default_message)
    
    def register_create_route(self, custom_handler: Optional[Callable] = None):
        """Register POST / endpoint for creating resources"""
        if not self.config.create_command_class:
            return
        
        auth_dep = self._get_auth_dependency("create")
        
        @self.router.post("/", response_model=self.config.response_schema, status_code=201)
        async def create_resource(
            data: self.config.create_schema,
            mediator: Mediator = Depends(get_mediator_dependency),
            auth_user = Depends(auth_dep) if auth_dep else None
        ):
            f"""Create a new {self.config.resource_name}"""
            try:
                if custom_handler:
                    return await custom_handler(data, mediator, auth_user)
                
                # Default implementation
                if self.config.to_command_data_mapper:
                    command_data = self.config.to_command_data_mapper(data)
                    command = self.config.create_command_class(**command_data)
                else:
                    command = self.config.create_command_class(**data.model_dump())
                
                entity = await mediator.send(command)
                return self.config.to_response_mapper(entity)
            except Exception as e:
                self._handle_error(e)
    
    def register_get_by_id_route(self, custom_handler: Optional[Callable] = None):
        """Register GET /{id} endpoint for retrieving a resource by ID"""
        if not self.config.get_by_id_query_class:
            return
        
        auth_dep = self._get_auth_dependency("read")
        id_param_name = f"{self.config.resource_name.lower()}_id"
        
        @self.router.get(f"/{{{id_param_name}}}", response_model=self.config.response_schema)
        async def get_resource_by_id(
            resource_id: str,
            mediator: Mediator = Depends(get_mediator_dependency),
            auth_user = Depends(auth_dep) if auth_dep else None
        ):
            f"""Get {self.config.resource_name} by ID"""
            try:
                if custom_handler:
                    return await custom_handler(resource_id, mediator, auth_user)
                
                # Default implementation
                query = self.config.get_by_id_query_class(**{id_param_name: resource_id})
                entity = await mediator.query(query)
                
                if not entity:
                    raise NotFoundError(f"{self.config.resource_name} not found")
                
                return self.config.to_response_mapper(entity)
            except Exception as e:
                self._handle_error(e)
    
    def register_get_all_route(
        self, 
        custom_handler: Optional[Callable] = None,
        default_limit: int = 100,
        max_limit: int = 1000
    ):
        """Register GET / endpoint for listing resources"""
        if not self.config.get_all_query_class:
            return
        
        auth_dep = self._get_auth_dependency("list")
        
        @self.router.get("/", response_model=self.config.list_response_schema)
        async def get_all_resources(
            skip: int = Query(0, ge=0, description="Number of items to skip"),
            limit: int = Query(default_limit, ge=1, le=max_limit, description="Maximum number of items to return"),
            mediator: Mediator = Depends(get_mediator_dependency),
            auth_user = Depends(auth_dep) if auth_dep else None
        ):
            f"""Get all {self.config.resource_name_plural} with pagination"""
            try:
                if custom_handler:
                    return await custom_handler(skip, limit, mediator, auth_user)
                
                # Default implementation
                query = self.config.get_all_query_class(skip=skip, limit=limit)
                result = await mediator.query(query)
                
                if self.config.to_list_response_mapper:
                    return self.config.to_list_response_mapper(result)
                
                # If no list mapper, assume result is list of entities
                return [self.config.to_response_mapper(entity) for entity in result]
            except Exception as e:
                self._handle_error(e)
    
    def register_update_route(self, custom_handler: Optional[Callable] = None):
        """Register PUT /{id} endpoint for updating resources"""
        if not self.config.update_command_class:
            return
        
        auth_dep = self._get_auth_dependency("update")
        id_param_name = f"{self.config.resource_name.lower()}_id"
        
        @self.router.put(f"/{{{id_param_name}}}", response_model=self.config.response_schema)
        async def update_resource(
            resource_id: str,
            data: self.config.update_schema,
            mediator: Mediator = Depends(get_mediator_dependency),
            auth_user = Depends(auth_dep) if auth_dep else None
        ):
            f"""Update {self.config.resource_name}"""
            try:
                if custom_handler:
                    return await custom_handler(resource_id, data, mediator, auth_user)
                
                # Default implementation
                command_data = {id_param_name: resource_id, **data.model_dump(exclude_unset=True)}
                command = self.config.update_command_class(**command_data)
                entity = await mediator.send(command)
                
                return self.config.to_response_mapper(entity)
            except Exception as e:
                self._handle_error(e)
    
    def register_delete_route(self, custom_handler: Optional[Callable] = None):
        """Register DELETE /{id} endpoint for deleting resources"""
        if not self.config.delete_command_class:
            return
        
        auth_dep = self._get_auth_dependency("delete")
        id_param_name = f"{self.config.resource_name.lower()}_id"
        
        @self.router.delete(f"/{{{id_param_name}}}", status_code=204)
        async def delete_resource(
            resource_id: str,
            mediator: Mediator = Depends(get_mediator_dependency),
            auth_user = Depends(auth_dep) if auth_dep else None
        ):
            f"""Delete {self.config.resource_name}"""
            try:
                if custom_handler:
                    return await custom_handler(resource_id, mediator, auth_user)
                
                # Default implementation
                command = self.config.delete_command_class(**{id_param_name: resource_id})
                success = await mediator.send(command)
                
                if not success:
                    raise NotFoundError(f"{self.config.resource_name} not found")
            except Exception as e:
                self._handle_error(e)
    
    def register_all_routes(
        self,
        include_create: bool = True,
        include_read: bool = True,
        include_update: bool = True,
        include_delete: bool = True,
        include_list: bool = True,
    ):
        """Register all standard CRUD routes"""
        if include_create:
            self.register_create_route()
        if include_read:
            self.register_get_by_id_route()
        if include_list:
            self.register_get_all_route()
        if include_update:
            self.register_update_route()
        if include_delete:
            self.register_delete_route()
    
    def get_router(self) -> APIRouter:
        """Get the configured router instance"""
        return self.router

