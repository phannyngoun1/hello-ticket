"""
Base Mapper implementation for Infrastructure layer.
"""
from abc import ABC, abstractmethod
from typing import Generic, TypeVar, Optional

TDomain = TypeVar("TDomain")
TModel = TypeVar("TModel")

class BaseMapper(ABC, Generic[TDomain, TModel]):
    """
    Abstract base class for data mappers that convert between 
    Domain Entities and Database Models.
    """

    @abstractmethod
    def to_domain(self, model: TModel) -> Optional[TDomain]:
        """
        Convert database model to domain entity.
        
        Args:
            model: Database model instance
            
        Returns:
            Domain entity instance or None if model is None
        """
        pass

    @abstractmethod
    def to_model(self, entity: TDomain) -> Optional[TModel]:
        """
        Convert domain entity to database model.
        
        Args:
            entity: Domain entity instance
            
        Returns:
            Database model instance or None if entity is None
        """
        pass
