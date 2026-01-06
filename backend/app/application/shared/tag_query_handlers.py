"""Tag query handlers"""
import logging
from typing import List, Optional

from app.domain.shared.tag import Tag
from app.domain.shared.tag_repository import TagRepository, TagLinkRepository
from app.application.shared.tag_queries import (
    GetTagByIdQuery,
    GetTagByNameQuery,
    SearchTagsQuery,
    GetTagsForEntityQuery,
    GetAvailableTagsForEntityQuery,
)
from app.shared.tenant_context import require_tenant_context
from app.shared.exceptions import NotFoundError, ValidationError

logger = logging.getLogger(__name__)


class TagQueryHandler:
    """Handler for tag queries"""

    def __init__(
        self,
        tag_repository: TagRepository,
        tag_link_repository: TagLinkRepository,
    ):
        self._tag_repository = tag_repository
        self._tag_link_repository = tag_link_repository

    async def handle_get_tag_by_id(self, query: GetTagByIdQuery) -> Optional[Tag]:
        """Get tag by ID"""
        tenant_id = require_tenant_context()
        tag = await self._tag_repository.get_by_id(tenant_id, query.tag_id)
        return tag

    async def handle_get_tag_by_name(self, query: GetTagByNameQuery) -> Optional[Tag]:
        """Get tag by name and entity type"""
        tenant_id = require_tenant_context()
        tag = await self._tag_repository.get_by_name(tenant_id, query.entity_type, query.name)
        return tag

    async def handle_search_tags(self, query: SearchTagsQuery):
        """Search tags - returns list of tags with total count"""
        tenant_id = require_tenant_context()
        tags = await self._tag_repository.get_all(
            tenant_id=tenant_id,
            entity_type=query.entity_type,
            search=query.search,
            is_active=query.is_active,
            skip=query.skip,
            limit=query.limit + 1,  # Get one extra to check if there's more
        )
        
        has_next = len(tags) > query.limit
        if has_next:
            tags = tags[:query.limit]
        
        # Create a simple result object
        class TagSearchResult:
            def __init__(self, items, total, has_next):
                self.items = items
                self.total = len(items)  # Approximate total
                self.has_next = has_next
        
        return TagSearchResult(items=tags, total=len(tags), has_next=has_next)

    async def handle_get_tags_for_entity(self, query: GetTagsForEntityQuery) -> List[Tag]:
        """Get all tags for an entity"""
        tenant_id = require_tenant_context()
        tags = await self._tag_link_repository.get_tags_for_entity(
            tenant_id=tenant_id,
            entity_type=query.entity_type,
            entity_id=query.entity_id,
        )
        return tags

    async def handle_get_available_tags_for_entity(self, query: GetAvailableTagsForEntityQuery):
        """Get all available tags for an entity type with attachment status"""
        tenant_id = require_tenant_context()
        
        # Get all tags for the entity type
        all_tags = await self._tag_repository.get_all(
            tenant_id=tenant_id,
            entity_type=query.entity_type,
            search=query.search,
            is_active=True,
            skip=0,
            limit=query.limit,
        )
        
        # Get attached tags for this entity
        attached_tags = await self._tag_link_repository.get_tags_for_entity(
            tenant_id=tenant_id,
            entity_type=query.entity_type,
            entity_id=query.entity_id,
        )
        attached_tag_ids = {tag.id for tag in attached_tags}
        
        # Create result with attachment status
        class TagWithStatus:
            def __init__(self, tag, is_attached):
                self.tag = tag
                self.is_attached = is_attached
        
        result = [
            TagWithStatus(tag, tag.id in attached_tag_ids)
            for tag in all_tags
        ]

        print(f"DEBUG: Available tags for {query.entity_type}:{query.entity_id} - found {len(result)} tags")
        attached_count = sum(1 for r in result if r.is_attached)
        print(f"DEBUG: {attached_count} tags are attached")

        return result

