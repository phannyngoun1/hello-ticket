"""Attachment queries for CQRS pattern"""
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class GetAttachmentsForEntityQuery:
    """Query to get all attachments for an entity"""
    entity_type: str
    entity_id: str
    attachment_type: Optional[str] = None


@dataclass
class GetProfilePhotoQuery:
    """Query to get profile photo for an entity"""
    entity_type: str
    entity_id: str

