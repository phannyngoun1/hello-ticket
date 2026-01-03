"""
Container and mediator registration for Tag module (Shared domain).

This module handles all dependency injection and mediator registrations
for the Tag domain entity.
"""
from punq import Container
from app.shared.mediator import Mediator
from app.domain.shared.tag_repository import TagRepository, TagLinkRepository
from app.infrastructure.shared.tag_repository import SQLTagRepository, SQLTagLinkRepository
from app.application.shared.tag_handlers import TagCommandHandler
from app.application.shared.tag_query_handlers import TagQueryHandler
from app.application.shared.tag_commands import (
    CreateTagCommand,
    UpdateTagCommand,
    DeleteTagCommand,
    SetEntityTagsCommand,
    LinkTagToEntityCommand,
    UnlinkTagFromEntityCommand,
    ManageEntityTagsCommand,
)
from app.application.shared.tag_queries import (
    GetTagByIdQuery,
    GetTagByNameQuery,
    SearchTagsQuery,
    GetTagsForEntityQuery,
    GetAvailableTagsForEntityQuery,
)


def register_tag_container(container: Container) -> None:
    """
    Register all Tag-related dependencies in the container.
    
    Args:
        container: The Punq container to register dependencies in
    """
    # Register TagLink repository
    tag_link_repository = SQLTagLinkRepository()
    container.register(TagLinkRepository, instance=tag_link_repository)
    
    # Register Tag repository
    tag_repository = SQLTagRepository()
    container.register(TagRepository, instance=tag_repository)
    
    # Register Tag command handler
    tag_command_handler = TagCommandHandler(
        tag_repository=tag_repository,
        tag_link_repository=tag_link_repository
    )
    container.register(TagCommandHandler, instance=tag_command_handler)
    
    # Register Tag query handler
    tag_query_handler = TagQueryHandler(
        tag_repository=tag_repository,
        tag_link_repository=tag_link_repository
    )
    container.register(TagQueryHandler, instance=tag_query_handler)


def register_tag_mediator(mediator: Mediator) -> None:
    """
    Register all Tag command and query handlers with the mediator.
    
    Args:
        mediator: The mediator instance to register handlers with
    """
    # Register Tag command handlers
    mediator.register_command_handler(CreateTagCommand, TagCommandHandler)
    mediator.register_command_handler(UpdateTagCommand, TagCommandHandler)
    mediator.register_command_handler(DeleteTagCommand, TagCommandHandler)
    mediator.register_command_handler(SetEntityTagsCommand, TagCommandHandler)
    mediator.register_command_handler(LinkTagToEntityCommand, TagCommandHandler)
    mediator.register_command_handler(UnlinkTagFromEntityCommand, TagCommandHandler)
    mediator.register_command_handler(ManageEntityTagsCommand, TagCommandHandler)
    
    # Register Tag query handlers
    mediator.register_query_handler(GetTagByIdQuery, TagQueryHandler)
    mediator.register_query_handler(GetTagByNameQuery, TagQueryHandler)
    mediator.register_query_handler(SearchTagsQuery, TagQueryHandler)
    mediator.register_query_handler(GetTagsForEntityQuery, TagQueryHandler)
    mediator.register_query_handler(GetAvailableTagsForEntityQuery, TagQueryHandler)

