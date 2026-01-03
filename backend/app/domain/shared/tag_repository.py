"""Tag repository interface - Port in Hexagonal Architecture"""
from abc import ABC, abstractmethod
from typing import List, Optional

from app.domain.shared.tag import Tag
from app.domain.shared.tag_link import TagLink


class TagRepository(ABC):
    """Abstract tag repository"""
    
    @abstractmethod
    async def save(self, tag: Tag) -> Tag:
        """Save or update a tag"""
        pass
    
    @abstractmethod
    async def get_by_id(self, tenant_id: str, tag_id: str) -> Optional[Tag]:
        """Get tag by ID"""
        pass
    
    @abstractmethod
    async def get_by_name(self, tenant_id: str, entity_type: str, name: str) -> Optional[Tag]:
        """Get tag by name and entity type (normalized)"""
        pass
    
    @abstractmethod
    async def get_all(
        self,
        tenant_id: str,
        entity_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> List[Tag]:
        """Get all tags with pagination and filtering"""
        pass
    
    @abstractmethod
    async def delete(self, tenant_id: str, tag_id: str) -> bool:
        """Delete tag by ID"""
        pass
    
    @abstractmethod
    async def exists_by_name(self, tenant_id: str, entity_type: str, name: str) -> bool:
        """Check if tag exists by name and entity type"""
        pass


class TagLinkRepository(ABC):
    """Abstract tag link repository for managing tag-entity relationships"""
    
    @abstractmethod
    async def link_tag(
        self,
        tenant_id: str,
        tag_id: str,
        entity_type: str,
        entity_id: str,
    ) -> TagLink:
        """Link a tag to an entity"""
        pass
    
    @abstractmethod
    async def unlink_tag(
        self,
        tenant_id: str,
        tag_id: str,
        entity_type: str,
        entity_id: str,
    ) -> bool:
        """Unlink a tag from an entity"""
        pass
    
    @abstractmethod
    async def get_tags_for_entity(
        self,
        tenant_id: str,
        entity_type: str,
        entity_id: str,
    ) -> List[Tag]:
        """Get all tags linked to an entity"""
        pass
    
    @abstractmethod
    async def get_entities_for_tag(
        self,
        tenant_id: str,
        tag_id: str,
        entity_type: Optional[str] = None,
    ) -> List[TagLink]:
        """Get all entities linked to a tag"""
        pass
    
    @abstractmethod
    async def set_tags_for_entity(
        self,
        tenant_id: str,
        entity_type: str,
        entity_id: str,
        tag_ids: List[str],
    ) -> List[Tag]:
        """Set tags for an entity (replaces existing tags)"""
        pass
    
    @abstractmethod
    async def unlink_all_tags(
        self,
        tenant_id: str,
        entity_type: str,
        entity_id: str,
    ) -> bool:
        """Unlink all tags from an entity"""
        pass

