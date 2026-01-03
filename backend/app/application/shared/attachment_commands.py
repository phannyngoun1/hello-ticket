"""Attachment commands for CQRS pattern"""
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class LinkAttachmentCommand:
    """Command to link a file upload to an entity"""
    file_upload_id: str
    entity_type: str
    entity_id: str
    attachment_type: str = "document"


@dataclass
class UnlinkAttachmentCommand:
    """Command to unlink a file upload from an entity"""
    file_upload_id: str
    entity_type: str
    entity_id: str


@dataclass
class SetAttachmentsCommand:
    """Command to set attachments for an entity (replaces existing attachments of the same type)"""
    entity_type: str
    entity_id: str
    file_upload_ids: List[str]
    attachment_type: str = "document"


@dataclass
class SetProfilePhotoCommand:
    """Command to set profile photo for an entity"""
    entity_type: str
    entity_id: str
    file_upload_id: str


@dataclass
class RemoveProfilePhotoCommand:
    """Command to remove profile photo from an entity"""
    entity_type: str
    entity_id: str

