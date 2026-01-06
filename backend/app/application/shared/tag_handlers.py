"""Tag command handlers"""
import logging
from typing import List

from app.domain.shared.tag import Tag
from app.domain.shared.tag_repository import TagRepository, TagLinkRepository
from app.application.shared.tag_commands import (
    CreateTagCommand,
    UpdateTagCommand,
    DeleteTagCommand,
    SetEntityTagsCommand,
    LinkTagToEntityCommand,
    UnlinkTagFromEntityCommand,
    ManageEntityTagsCommand,
)
from app.shared.tenant_context import require_tenant_context
from app.shared.exceptions import ValidationError, BusinessRuleError

logger = logging.getLogger(__name__)


class TagCommandHandler:
    """Handler for tag commands"""

    def __init__(
        self,
        tag_repository: TagRepository,
        tag_link_repository: TagLinkRepository,
    ):
        self._tag_repository = tag_repository
        self._tag_link_repository = tag_link_repository

    async def handle_create_tag(self, command: CreateTagCommand) -> Tag:
        """Create a new tag"""
        tenant_id = require_tenant_context()

        if not command.name or not command.name.strip():
            raise ValidationError("Tag name is required")
        if not command.entity_type or not command.entity_type.strip():
            raise ValidationError("Entity type is required")

        # Check if tag with same name and entity type already exists
        existing = await self._tag_repository.get_by_name(tenant_id, command.entity_type, command.name)
        if existing:
            raise BusinessRuleError(f"Tag with name '{command.name}' already exists for entity type '{command.entity_type}'")

        tag = Tag(
            tenant_id=tenant_id,
            name=command.name,
            entity_type=command.entity_type,
            description=command.description,
            color=command.color,
        )

        saved = await self._tag_repository.save(tag)
        logger.info("Created tag %s with name %s for entity_type %s for tenant=%s", saved.id, saved.name, saved.entity_type, tenant_id)
        return saved

    async def handle_update_tag(self, command: UpdateTagCommand) -> Tag:
        """Update tag details"""
        tenant_id = require_tenant_context()
        tag = await self._tag_repository.get_by_id(tenant_id, command.tag_id)
        if not tag:
            raise ValidationError(f"Tag with ID '{command.tag_id}' not found")

        # Check name uniqueness if name is being changed
        entity_type = command.entity_type if command.entity_type else tag.entity_type
        if command.name and command.name.strip().lower() != tag.name:
            existing = await self._tag_repository.get_by_name(tenant_id, entity_type, command.name)
            if existing and existing.id != tag.id:
                raise BusinessRuleError(f"Tag with name '{command.name}' already exists for entity type '{entity_type}'")

        tag.update_details(
            name=command.name,
            entity_type=command.entity_type,
            description=command.description,
            color=command.color,
        )

        saved = await self._tag_repository.save(tag)
        logger.info("Updated tag %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def handle_delete_tag(self, command: DeleteTagCommand) -> bool:
        """Delete a tag"""
        tenant_id = require_tenant_context()
        tag = await self._tag_repository.get_by_id(tenant_id, command.tag_id)
        if not tag:
            raise ValidationError(f"Tag with ID '{command.tag_id}' not found")

        deleted = await self._tag_repository.delete(tenant_id, command.tag_id)
        logger.info("Deleted tag %s for tenant=%s", command.tag_id, tenant_id)
        return deleted

    async def handle_set_entity_tags(
        self, command: SetEntityTagsCommand
    ) -> List[Tag]:
        """Set tags for an entity (replaces existing tags)"""
        tenant_id = require_tenant_context()

        # Validate all tag IDs exist and match entity type
        for tag_id in command.tag_ids:
            tag = await self._tag_repository.get_by_id(tenant_id, tag_id)
            if not tag:
                raise ValidationError(f"Tag with ID '{tag_id}' not found")
            if not tag.is_active:
                raise BusinessRuleError(f"Tag '{tag.name}' is not active")
            if tag.entity_type != command.entity_type.lower():
                raise BusinessRuleError(
                    f"Tag '{tag.name}' is for entity type '{tag.entity_type}', not '{command.entity_type}'"
                )

        tags = await self._tag_link_repository.set_tags_for_entity(
            tenant_id=tenant_id,
            entity_type=command.entity_type,
            entity_id=command.entity_id,
            tag_ids=command.tag_ids,
        )

        logger.info(
            "Set %d tags for entity %s:%s for tenant=%s",
            len(tags),
            command.entity_type,
            command.entity_id,
            tenant_id,
        )
        return tags

    async def handle_link_tag_to_entity(
        self, command: LinkTagToEntityCommand
    ) -> Tag:
        """Link a tag to an entity"""
        tenant_id = require_tenant_context()

        tag = await self._tag_repository.get_by_id(tenant_id, command.tag_id)
        if not tag:
            raise ValidationError(f"Tag with ID '{command.tag_id}' not found")
        if not tag.is_active:
            raise BusinessRuleError(f"Tag '{tag.name}' is not active")
        if tag.entity_type != command.entity_type.lower():
            raise BusinessRuleError(
                f"Tag '{tag.name}' is for entity type '{tag.entity_type}', not '{command.entity_type}'"
            )

        await self._tag_link_repository.link_tag(
            tenant_id=tenant_id,
            tag_id=command.tag_id,
            entity_type=command.entity_type,
            entity_id=command.entity_id,
        )

        logger.info(
            "Linked tag %s to entity %s:%s for tenant=%s",
            command.tag_id,
            command.entity_type,
            command.entity_id,
            tenant_id,
        )
        return tag

    async def handle_unlink_tag_from_entity(
        self, command: UnlinkTagFromEntityCommand
    ) -> bool:
        """Unlink a tag from an entity"""
        tenant_id = require_tenant_context()

        unlinked = await self._tag_link_repository.unlink_tag(
            tenant_id=tenant_id,
            tag_id=command.tag_id,
            entity_type=command.entity_type,
            entity_id=command.entity_id,
        )

        if unlinked:
            logger.info(
                "Unlinked tag %s from entity %s:%s for tenant=%s",
                command.tag_id,
                command.entity_type,
                command.entity_id,
                tenant_id,
            )
        return unlinked

    async def handle_manage_entity_tags(self, command: ManageEntityTagsCommand) -> tuple[List[Tag], int]:
        """Manage entity tags - creates new tags and attaches them in one operation"""
        tenant_id = require_tenant_context()
        
        if not command.entity_type or not command.entity_type.strip():
            raise ValidationError("Entity type is required")
        
        tag_ids = []
        created_count = 0
        
        # Process each tag name
        for tag_name in command.tag_names:
            if not tag_name or not tag_name.strip():
                continue
            
            normalized_name = tag_name.strip().lower()
            
            # Try to find existing tag
            existing_tag = await self._tag_repository.get_by_name(
                tenant_id, command.entity_type, normalized_name
            )
            
            if existing_tag:
                # Use existing tag
                tag_ids.append(existing_tag.id)
            else:
                # Create new tag
                try:
                    new_tag = Tag(
                        tenant_id=tenant_id,
                        entity_type=command.entity_type,
                        name=normalized_name,
                    )
                    saved_tag = await self._tag_repository.save(new_tag)
                    tag_ids.append(saved_tag.id)
                    created_count += 1
                    logger.info(
                        "Created new tag '%s' for entity type '%s' during tag management",
                        normalized_name,
                        command.entity_type,
                    )
                except BusinessRuleError as e:
                    # Tag might have been created by another request, try to get it again
                    existing_tag = await self._tag_repository.get_by_name(
                        tenant_id, command.entity_type, normalized_name
                    )
                    if existing_tag:
                        tag_ids.append(existing_tag.id)
                    else:
                        logger.error(
                            "Failed to create or find tag '%s' for entity type '%s': %s",
                            normalized_name,
                            command.entity_type,
                            str(e),
                        )
                        raise
        
        # Set tags for entity (replaces existing tags)
        print(f"DEBUG: Setting tags for entity {command.entity_type}:{command.entity_id} - tag_ids: {tag_ids}")
        attached_tags = await self._tag_link_repository.set_tags_for_entity(
            tenant_id=tenant_id,
            entity_type=command.entity_type,
            entity_id=command.entity_id,
            tag_ids=tag_ids,
        )
        print(f"DEBUG: Attached tags: {[tag.name for tag in attached_tags]}")
        
        logger.info(
            "Managed tags for entity %s:%s - attached %d tags (%d newly created) for tenant=%s",
            command.entity_type,
            command.entity_id,
            len(attached_tags),
            created_count,
            tenant_id,
        )
        
        return attached_tags, created_count

