"""
Base Presenter for API Layer
"""
from typing import Generic, TypeVar, List, Optional
from abc import ABC, abstractmethod

T_Domain = TypeVar("T_Domain")
T_Schema = TypeVar("T_Schema")

class BasePresenter(ABC, Generic[T_Domain, T_Schema]):
    """Base presenter for converting domain entities to API responses"""

    @abstractmethod
    def from_domain(self, entity: T_Domain) -> T_Schema:
        """Convert a single domain entity to a response schema"""
        pass

    def from_domain_list(self, entities: List[T_Domain]) -> List[T_Schema]:
        """Convert a list of domain entities to a list of response schemas"""
        if not entities:
            return []
        return [self.from_domain(entity) for entity in entities]
