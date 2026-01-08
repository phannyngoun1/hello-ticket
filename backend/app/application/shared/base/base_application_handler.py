"""
Base application handler providing common utilities for command/query handlers.
"""
from typing import TypeVar, Optional, Any, Type
from app.shared.tenant_context import require_tenant_context
from app.shared.exceptions import NotFoundError, ValidationError

T = TypeVar("T")


class BaseApplicationHandler:
    """
    Base class for application handlers providing common functionality.
    
    This class is designed to work with the Mediator pattern where handlers
    methods are invoked dynamically or via specific naming conventions.
    """
    
    def get_tenant_id(self) -> str:
        """
        Get the current tenant ID from context.
        
        Returns:
            str: The current tenant ID
            
        Raises:
            ValueError: If tenant context is not set
        """
        return require_tenant_context()

    async def get_entity_or_404(
        self, 
        repository: Any, 
        entity_id: str, 
        entity_name: str = "Entity",
        tenant_id: Optional[str] = None
    ) -> T:
        """
        Get an entity from repository by ID or raise NotFoundError.
        
        Args:
            repository: The repository instance to query
            entity_id: The ID of the entity to retrieve
            entity_name: Name of the entity for the error message
            tenant_id: Optional tenant ID (defaults to current context)
            
        Returns:
            The retrieved entity
            
        Raises:
            ValidationError: If entity_id is empty
            NotFoundError: If entity is not found
        """
        if not entity_id or not entity_id.strip():
            raise ValidationError(f"{entity_name} identifier is required")
            
        if tenant_id is None:
            tenant_id = self.get_tenant_id()
            
        entity = await repository.get_by_id(tenant_id, entity_id)
        if not entity:
            raise NotFoundError(f"{entity_name} {entity_id} not found")
            
        return entity
