"""
Container and mediator registration for Lookup module.

Unified lookup/reference data - replaces customer_type, venue_type, event_type.
"""
from punq import Container
from app.shared.mediator import Mediator
from app.domain.shared.lookup_value_repositories import LookupRepository
from app.application.shared.handlers_lookup import LookupCommandHandler, LookupQueryHandler
from app.infrastructure.shared.lookup_value_repository import SQLLookupRepository
from app.application.shared.commands_lookup import (
    CreateLookupCommand,
    UpdateLookupCommand,
    DeleteLookupCommand,
)
from app.application.shared.queries_lookup import (
    GetLookupByIdQuery,
    GetLookupByCodeQuery,
    SearchLookupsQuery,
)


def register_lookup_container(container: Container) -> None:
    """Register all Lookup-related dependencies."""
    lookup_repository = SQLLookupRepository()
    container.register(LookupRepository, instance=lookup_repository)

    lookup_command_handler = LookupCommandHandler(lookup_repository=lookup_repository)
    container.register(LookupCommandHandler, instance=lookup_command_handler)

    lookup_query_handler = LookupQueryHandler(lookup_repository=lookup_repository)
    container.register(LookupQueryHandler, instance=lookup_query_handler)


def register_lookup_mediator(mediator: Mediator) -> None:
    """Register lookup command and query handlers with the mediator."""
    mediator.register_command_handler(CreateLookupCommand, LookupCommandHandler)
    mediator.register_command_handler(UpdateLookupCommand, LookupCommandHandler)
    mediator.register_command_handler(DeleteLookupCommand, LookupCommandHandler)
    mediator.register_query_handler(GetLookupByIdQuery, LookupQueryHandler)
    mediator.register_query_handler(GetLookupByCodeQuery, LookupQueryHandler)
    mediator.register_query_handler(SearchLookupsQuery, LookupQueryHandler)
