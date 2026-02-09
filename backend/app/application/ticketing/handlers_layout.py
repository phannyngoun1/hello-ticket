"""Handlers for layout commands and queries."""
import logging
from datetime import datetime, timezone

from sqlmodel import select

from app.application.ticketing.commands_layout import (
    CreateLayoutCommand,
    UpdateLayoutCommand,
    DeleteLayoutCommand,
    CloneLayoutCommand,
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
from app.domain.ticketing.seat import Seat
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError
from app.shared.tenant_context import require_tenant_context
from app.infrastructure.shared.database.models import SectionModel
from app.infrastructure.shared.database.connection import get_session_sync
from app.shared.utils import generate_id

logger = logging.getLogger(__name__)


class LayoutCommandHandler:
    """Handles layout commands."""

    def __init__(
        self,
        layout_repository: LayoutRepository,
        venue_repository: VenueRepository,
        seat_repository: SeatRepository | None = None,
    ):
        self._layout_repository = layout_repository
        self._venue_repository = venue_repository
        self._seat_repository = seat_repository

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
            canvas_background_color=command.canvas_background_color or "#e5e7eb",
        )

        saved = await self._layout_repository.save(layout)
        logger.info("Created layout %s for venue %s, tenant=%s", saved.id, command.venue_id, tenant_id)
        
        # Create default section for section-level design mode
        design_mode = command.design_mode or "seat-level"
        if design_mode == "section-level":
            with get_session_sync() as session:
                default_section = SectionModel(
                    id=generate_id(),
                    tenant_id=tenant_id,
                    layout_id=saved.id,
                    name="Section A",
                    x_coordinate=50.0,  # Default center position
                    y_coordinate=50.0,  # Default center position
                    file_id=None,
                    is_active=True,
                    is_deleted=False,
                    version=0,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
                session.add(default_section)
                session.commit()
                logger.info("Created default section 'Section A' for layout %s, tenant=%s", saved.id, tenant_id)
        
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
        if command.canvas_background_color is not None:
            update_kwargs['canvas_background_color'] = command.canvas_background_color

        layout.update_details(**update_kwargs)

        saved = await self._layout_repository.save(layout)
        logger.info("Updated layout %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def handle_delete_layout(self, command: DeleteLayoutCommand) -> None:
        tenant_id = require_tenant_context()
        await self._layout_repository.delete(tenant_id, command.layout_id)
        logger.info("Soft deleted layout %s for tenant=%s", command.layout_id, tenant_id)

    async def handle_clone_layout(self, command: CloneLayoutCommand) -> Layout:
        """Clone a layout with all its sections and seats."""
        tenant_id = require_tenant_context()
        source = await self._get_layout_or_raise(tenant_id, command.layout_id)

        # Create new layout (metadata only)
        new_layout = Layout(
            tenant_id=tenant_id,
            venue_id=source.venue_id,
            name=f"{source.name} (Copy)",
            description=source.description,
            file_id=source.file_id,
            design_mode=source.design_mode or "seat-level",
        )
        saved_layout = await self._layout_repository.save(new_layout)
        logger.info("Cloned layout %s -> %s for tenant=%s", command.layout_id, saved_layout.id, tenant_id)

        # Clone sections
        section_id_map: dict[str, str] = {}
        with get_session_sync() as session:
            statement = select(SectionModel).where(
                SectionModel.layout_id == command.layout_id,
                SectionModel.is_deleted == False,
                SectionModel.tenant_id == tenant_id,
            )
            source_sections = list(session.exec(statement).all())
            for sec in source_sections:
                new_sec = SectionModel(
                    id=generate_id(),
                    tenant_id=tenant_id,
                    layout_id=saved_layout.id,
                    name=sec.name,
                    x_coordinate=sec.x_coordinate,
                    y_coordinate=sec.y_coordinate,
                    file_id=sec.file_id,
                    shape=sec.shape,
                    is_active=sec.is_active,
                    is_deleted=False,
                    version=0,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
                session.add(new_sec)
                section_id_map[sec.id] = new_sec.id
            session.commit()

        # Clone seats (requires seat_repository)
        if self._seat_repository:
            source_seats = await self._seat_repository.get_all_by_layout(tenant_id, command.layout_id)
            for seat in source_seats:
                new_section_id = section_id_map.get(seat.section_id)
                if new_section_id is None:
                    logger.warning("Skip cloning seat %s: section_id %s not in cloned sections", seat.id, seat.section_id)
                    continue
                new_seat = Seat(
                    tenant_id=tenant_id,
                    venue_id=seat.venue_id,
                    layout_id=saved_layout.id,
                    section_id=new_section_id,
                    row=seat.row,
                    seat_number=seat.seat_number,
                    seat_type=seat.seat_type,
                    x_coordinate=seat.x_coordinate,
                    y_coordinate=seat.y_coordinate,
                    shape=seat.shape,
                )
                await self._seat_repository.save(new_seat)
            logger.info("Cloned %d seats for layout %s", len(source_seats), saved_layout.id)

        return saved_layout

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
