"""Tag queries for CQRS pattern"""
from dataclasses import dataclass
from typing import Optional, List

from app.domain.shared.tag import Tag


@dataclass
class GetTagByIdQuery:
    """Query to retrieve a tag by ID"""
    tag_id: str


@dataclass
class GetTagByNameQuery:
    """Query to retrieve a tag by name"""
    name: str
    entity_type: str  # Required to get tag by name


@dataclass
class SearchTagsQuery:
    """Query to search tags with optional filters"""
    entity_type: Optional[str] = None  # Filter by entity type
    search: Optional[str] = None
    is_active: Optional[bool] = None
    skip: int = 0
    limit: int = 100


@dataclass
class GetTagsForEntityQuery:
    """Query to get all tags for an entity"""
    entity_type: str
    entity_id: str


@dataclass
class GetAvailableTagsForEntityQuery:
    """Query to get all available tags for an entity type with attachment status"""
    entity_type: str
    entity_id: str
    search: Optional[str] = None
    limit: int = 200

