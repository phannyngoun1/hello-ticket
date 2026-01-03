"""Tag commands for CQRS pattern"""
from dataclasses import dataclass
from typing import Optional, List


@dataclass
class CreateTagCommand:
    """Command to create a new tag"""
    name: str
    entity_type: str  # e.g., "customer", "event", "booking"
    description: Optional[str] = None
    color: Optional[str] = None


@dataclass
class UpdateTagCommand:
    """Command to update tag details"""
    tag_id: str
    name: Optional[str] = None
    entity_type: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None


@dataclass
class DeleteTagCommand:
    """Command to delete a tag"""
    tag_id: str


@dataclass
class SetEntityTagsCommand:
    """Command to set tags for an entity (replaces existing tags)"""
    entity_type: str  # e.g., "customer", "event"
    entity_id: str
    tag_ids: List[str]  # List of tag IDs to link


@dataclass
class LinkTagToEntityCommand:
    """Command to link a tag to an entity"""
    tag_id: str
    entity_type: str
    entity_id: str


@dataclass
class UnlinkTagFromEntityCommand:
    """Command to unlink a tag from an entity"""
    tag_id: str
    entity_type: str
    entity_id: str


@dataclass
class ManageEntityTagsCommand:
    """Command to manage entity tags - creates new tags and attaches them in one operation"""
    entity_type: str
    entity_id: str
    tag_names: List[str]  # List of tag names (will be created if they don't exist)

