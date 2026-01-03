"""AttachmentLink value object for linking file uploads to domain entities."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from app.shared.utils import generate_id


class AttachmentLink:
    """Represents a link between a file upload and a domain entity (polymorphic relationship)."""

    def __init__(
        self,
        file_upload_id: str,
        entity_type: str,  # e.g., "customer", "event", "booking"
        entity_id: str,
        attachment_type: str = "document",  # e.g., "profile_photo", "document", "contract", etc.
        attachment_link_id: Optional[str] = None,
        tenant_id: Optional[str] = None,
        created_at: Optional[datetime] = None,
    ):
        self.id = attachment_link_id or generate_id()
        self.file_upload_id = file_upload_id
        self.entity_type = entity_type.lower()
        self.entity_id = entity_id
        self.attachment_type = attachment_type.lower()
        self.tenant_id = tenant_id
        self.created_at = created_at or datetime.now(timezone.utc)

    def __eq__(self, other: object) -> bool:
        """Check equality based on file_upload_id, entity_type, and entity_id."""
        if not isinstance(other, AttachmentLink):
            return False
        return (
            self.file_upload_id == other.file_upload_id
            and self.entity_type == other.entity_type
            and self.entity_id == other.entity_id
        )

    def __hash__(self) -> int:
        """Hash based on file_upload_id, entity_type, and entity_id."""
        return hash((self.file_upload_id, self.entity_type, self.entity_id))

