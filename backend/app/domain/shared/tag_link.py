"""TagLink value object for linking tags to domain entities."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from app.shared.utils import generate_id


class TagLink:
    """Represents a link between a tag and a domain entity (polymorphic relationship)."""

    def __init__(
        self,
        tag_id: str,
        entity_type: str,  # e.g., "customer", "event", "booking"
        entity_id: str,
        tag_link_id: Optional[str] = None,
        tenant_id: Optional[str] = None,
        created_at: Optional[datetime] = None,
    ):
        self.id = tag_link_id or generate_id()
        self.tag_id = tag_id
        self.entity_type = entity_type.lower()
        self.entity_id = entity_id
        self.tenant_id = tenant_id
        self.created_at = created_at or datetime.now(timezone.utc)

    def __eq__(self, other: object) -> bool:
        """Check equality based on tag_id, entity_type, and entity_id."""
        if not isinstance(other, TagLink):
            return False
        return (
            self.tag_id == other.tag_id
            and self.entity_type == other.entity_type
            and self.entity_id == other.entity_id
        )

    def __hash__(self) -> int:
        """Hash based on tag_id, entity_type, and entity_id."""
        return hash((self.tag_id, self.entity_type, self.entity_id))

