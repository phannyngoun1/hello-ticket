"""
Container and mediator registration for Attachment module (Shared domain).

This module handles all dependency injection and mediator registrations
for the Attachment domain entity.
"""
from punq import Container
from app.shared.mediator import Mediator
from app.domain.shared.attachment_repository import AttachmentLinkRepository
from app.domain.shared.file_upload_repository import FileUploadRepository
from app.infrastructure.shared.attachment_repository import SQLAttachmentLinkRepository
from app.infrastructure.shared.file_upload_repository import SQLFileUploadRepository
from app.application.shared.attachment_handlers import AttachmentCommandHandler, AttachmentQueryHandler
from app.application.shared.attachment_commands import (
    LinkAttachmentCommand,
    UnlinkAttachmentCommand,
    SetAttachmentsCommand,
    SetProfilePhotoCommand,
    RemoveProfilePhotoCommand,
)
from app.application.shared.attachment_queries import (
    GetAttachmentsForEntityQuery,
    GetProfilePhotoQuery,
)


def register_attachment_container(container: Container) -> None:
    """
    Register all Attachment-related dependencies in the container.
    
    Args:
        container: The Punq container to register dependencies in
    """
    # Register FileUpload repository
    file_upload_repository = SQLFileUploadRepository()
    container.register(FileUploadRepository, instance=file_upload_repository)
    
    # Register AttachmentLink repository
    attachment_link_repository = SQLAttachmentLinkRepository(
        file_upload_repository=file_upload_repository
    )
    container.register(AttachmentLinkRepository, instance=attachment_link_repository)
    
    # Register Attachment command handler
    attachment_command_handler = AttachmentCommandHandler(
        attachment_link_repository=attachment_link_repository
    )
    container.register(AttachmentCommandHandler, instance=attachment_command_handler)
    
    # Register Attachment query handler
    attachment_query_handler = AttachmentQueryHandler(
        attachment_link_repository=attachment_link_repository
    )
    container.register(AttachmentQueryHandler, instance=attachment_query_handler)


def register_attachment_mediator(mediator: Mediator) -> None:
    """
    Register all Attachment command and query handlers with the mediator.
    
    Args:
        mediator: The mediator instance to register handlers with
    """
    # Register Attachment command handlers
    mediator.register_command_handler(LinkAttachmentCommand, AttachmentCommandHandler)
    mediator.register_command_handler(UnlinkAttachmentCommand, AttachmentCommandHandler)
    mediator.register_command_handler(SetAttachmentsCommand, AttachmentCommandHandler)
    mediator.register_command_handler(SetProfilePhotoCommand, AttachmentCommandHandler)
    mediator.register_command_handler(RemoveProfilePhotoCommand, AttachmentCommandHandler)
    
    # Register Attachment query handlers
    mediator.register_query_handler(GetAttachmentsForEntityQuery, AttachmentQueryHandler)
    mediator.register_query_handler(GetProfilePhotoQuery, AttachmentQueryHandler)

