"""Handlers for layout commands and queries."""
import logging

from app.application.ticketing.commands_layout import (
    CreateLayoutCommand,
    UpdateLayoutCommand,
    DeleteLayoutCommand
)
from app.application.ticketing.queries_layout import (
    GetLayoutByIdQuery,
    GetLayoutsByVenueIdQuery,
    GetLayoutWithSeatsQuery
)
from app.domain.ticketing.layout_repositories import LayoutRepository
from app.domain.ticketing.layout import Layout
from app.domain.ticketing.venue_repositories import VenueRepository
from app.domain.ticketing.seat_repositories import SeatRepository
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError
from app.shared.tenant_context import require_tenant_context

logger = logging.getLogger(__name__)


class LayoutCommandHandler:
    """Handles layout commands."""

    def __init__(self, layout_repository: LayoutRepository, venue_repository: VenueRepository):
        self._layout_repository = layout_repository
        self._venue_repository = venue_repository

    async def handle_create_layout(self, command: CreateLayoutCommand) -> Layout:
        tenant_id = require_tenant_context()
        
        # Verify venue exists
        venue = await self._venue_repository.get_by_id(tenant_id, command.venue_id)
        if not venue:
            raise NotFoundError(f"Venue {command.venue_id} not found")

        layout = Layout(
            tenant_id=tenant_id,
            venue_id=command.venue_id,
            name=command.name,
            description=command.description,
            file_id=command.file_id,
            design_mode=command.design_mode or "seat-level",
        )

        saved = await self._layout_repository.save(layout)
        logger.info("Created layout %s for venue %s, tenant=%s", saved.id, command.venue_id, tenant_id)
        return saved

    async def handle_update_layout(self, command: UpdateLayoutCommand) -> Layout:
        tenant_id = require_tenant_context()
        layout = await self._get_layout_or_raise(tenant_id, command.layout_id)

        update_kwargs = {}
        if command.name is not None:
            update_kwargs['name'] = command.name
        if command.description is not None:
            update_kwargs['description'] = command.description
        if command.file_id is not None:
            update_kwargs['file_id'] = command.file_id
        
        layout.update_details(**update_kwargs)

        saved = await self._layout_repository.save(layout)
        logger.info("Updated layout %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def handle_delete_layout(self, command: DeleteLayoutCommand) -> None:
        tenant_id = require_tenant_context()
        await self._layout_repository.delete(tenant_id, command.layout_id)
        logger.info("Soft deleted layout %s for tenant=%s", command.layout_id, tenant_id)

    async def _get_layout_or_raise(self, tenant_id: str, layout_id: str) -> Layout:
        if not layout_id or not layout_id.strip():
            raise ValidationError("Layout identifier is required")

        layout = await self._layout_repository.get_by_id(tenant_id, layout_id)
        if not layout:
            raise NotFoundError(f"Layout {layout_id} not found")
        return layout


class LayoutQueryHandler:
    """Handles layout queries."""

    def __init__(self, layout_repository: LayoutRepository, seat_repository: SeatRepository):
        self._layout_repository = layout_repository
        self._seat_repository = seat_repository

    async def handle_get_layout_by_id(self, query: GetLayoutByIdQuery) -> Layout:
        tenant_id = require_tenant_context()
        layout = await self._layout_repository.get_by_id(tenant_id, query.layout_id)
        if not layout:
            raise NotFoundError(f"Layout {query.layout_id} not found")
        return layout

    async def handle_get_layouts_by_venue_id(self, query: GetLayoutsByVenueIdQuery) -> list[Layout]:
        tenant_id = require_tenant_context()
        layouts = await self._layout_repository.get_by_venue_id(tenant_id, query.venue_id)
        return layouts

    async def handle_get_layout_with_seats(self, query: GetLayoutWithSeatsQuery) -> tuple[Layout, list]:
        """Get layout with its seats in one request."""
        tenant_id = require_tenant_context()
        
        # Get layout
        layout = await self._layout_repository.get_by_id(tenant_id, query.layout_id)
        if not layout:
            raise NotFoundError(f"Layout {query.layout_id} not found")
        
        # Get all seats for this layout (no pagination)
        seat_result = await self._seat_repository.get_by_layout(
            tenant_id,
            query.layout_id,
            skip=0,
            limit=10000,  # Large limit to get all seats
        )
        
        return layout, seat_result.items
