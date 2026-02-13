"""Handlers for layout commands and queries."""
import logging
import json
from datetime import datetime, timezone

from sqlmodel import select

from app.application.ticketing.commands_layout import (
    CreateLayoutCommand,
    UpdateLayoutCommand,
    DeleteLayoutCommand,
    CloneLayoutCommand,
    BulkDesignerSaveCommand,
)
from app.application.ticketing.commands_seat import BulkCreateSeatsCommand
from typing import Tuple
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
            marker_fill_transparency=command.marker_fill_transparency or 1.0,
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
            # Empty string means "remove image" (file_id is optional)
            update_kwargs['file_id'] = command.file_id if command.file_id else None
        if command.canvas_background_color is not None:
            update_kwargs['canvas_background_color'] = command.canvas_background_color
        if command.marker_fill_transparency is not None:
            logger.info("Updating layout %s marker_fill_transparency from %s to %s", 
                       command.layout_id, 
                       layout.marker_fill_transparency, 
                       command.marker_fill_transparency)
            update_kwargs['marker_fill_transparency'] = command.marker_fill_transparency

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

    async def handle_bulk_designer_save(
        self, 
        command: BulkDesignerSaveCommand,
        seat_handler  # SeatCommandHandler instance for bulk seat operations
    ) -> Tuple[Layout, list[SectionModel], list[Seat]]:
        """Bulk save designer changes: layout properties, sections, and seats in one operation"""
        tenant_id = require_tenant_context()
        
        # Verify venue and layout exist
        venue = await self._venue_repository.get_by_id(tenant_id, command.venue_id)
        if not venue:
            raise NotFoundError(f"Venue {command.venue_id} not found")
        
        layout = await self._get_layout_or_raise(tenant_id, command.layout_id)
        
        # 1. Update layout properties
        update_kwargs = {}
        if command.canvas_background_color is not None:
            update_kwargs['canvas_background_color'] = command.canvas_background_color
        if command.marker_fill_transparency is not None:
            update_kwargs['marker_fill_transparency'] = command.marker_fill_transparency
        if command.file_id is not None:
            update_kwargs['file_id'] = command.file_id if command.file_id else None
        
        if update_kwargs:
            layout.update_details(**update_kwargs)
            layout = await self._layout_repository.save(layout)
            logger.info("Updated layout %s properties", layout.id)
        
        # 2. Process section operations
        saved_sections = []
        with get_session_sync() as session:
            # Get all existing sections for this layout
            statement = select(SectionModel).where(
                SectionModel.tenant_id == tenant_id,
                SectionModel.layout_id == command.layout_id,
                SectionModel.is_deleted == False
            )
            existing_sections = {s.id: s for s in session.exec(statement).all()}
            
            # Process deletions first
            for section_op in command.sections:
                section_id = section_op.get("id")
                if section_op.get("delete") and section_id:
                    if section_id in existing_sections:
                        section = existing_sections[section_id]
                        section.is_deleted = True
                        section.updated_at = datetime.now(timezone.utc)
                        session.add(section)
                        logger.info("Deleted section %s", section_id)
            
            # Process creates and updates
            for section_op in command.sections:
                if section_op.get("delete"):
                    continue  # Already handled
                
                section_id = section_op.get("id")
                
                # Parse shape if provided
                shape_data = None
                if section_op.get("shape"):
                    shape_val = section_op["shape"]
                    if isinstance(shape_val, str):
                        try:
                            shape_data = json.loads(shape_val)
                        except json.JSONDecodeError:
                            shape_data = shape_val
                    else:
                        shape_data = shape_val
                
                if section_id and section_id in existing_sections:
                    # Update existing section
                    section = existing_sections[section_id]
                    if "name" in section_op:
                        # Check name uniqueness if changed
                        if section_op["name"] != section.name:
                            check_statement = select(SectionModel).where(
                                SectionModel.layout_id == command.layout_id,
                                SectionModel.name == section_op["name"],
                                SectionModel.id != section_id,
                                SectionModel.is_deleted == False
                            )
                            if session.exec(check_statement).first():
                                raise BusinessRuleError(f"Section with name '{section_op['name']}' already exists")
                        section.name = section_op["name"]
                    if "x_coordinate" in section_op:
                        section.x_coordinate = section_op["x_coordinate"]
                    if "y_coordinate" in section_op:
                        section.y_coordinate = section_op["y_coordinate"]
                    if "file_id" in section_op:
                        section.file_id = section_op["file_id"] if section_op["file_id"] else None
                    if "canvas_background_color" in section_op:
                        # Preserve None if explicitly set - allows section to inherit from layout
                        section.canvas_background_color = section_op["canvas_background_color"] if section_op["canvas_background_color"] is not None else None
                    if "marker_fill_transparency" in section_op:
                        # Preserve None if explicitly set - allows section to inherit from layout
                        section.marker_fill_transparency = section_op["marker_fill_transparency"] if section_op["marker_fill_transparency"] is not None else None
                    if shape_data is not None:
                        section.shape = shape_data
                    section.updated_at = datetime.now(timezone.utc)
                    session.add(section)
                    saved_sections.append(section)
                    logger.info("Updated section %s", section_id)
                else:
                    # Create new section
                    if not section_op.get("name"):
                        raise ValidationError("Section name is required for creation")
                    
                    # Check name uniqueness
                    check_statement = select(SectionModel).where(
                        SectionModel.layout_id == command.layout_id,
                        SectionModel.name == section_op["name"],
                        SectionModel.is_deleted == False
                    )
                    if session.exec(check_statement).first():
                        raise BusinessRuleError(f"Section with name '{section_op['name']}' already exists")
                    
                    # Get values - preserve None if not provided (allows inheritance from layout)
                    canvas_bg_color = section_op.get("canvas_background_color")
                    marker_transparency = section_op.get("marker_fill_transparency")
                    
                    new_section = SectionModel(
                        id=generate_id(),
                        tenant_id=tenant_id,
                        layout_id=command.layout_id,
                        name=section_op["name"],
                        x_coordinate=section_op.get("x_coordinate"),
                        y_coordinate=section_op.get("y_coordinate"),
                        file_id=section_op.get("file_id"),
                        canvas_background_color=canvas_bg_color,  # Preserve None to allow inheritance from layout
                        marker_fill_transparency=marker_transparency,  # Preserve None to allow inheritance from layout
                        shape=shape_data,
                        is_active=True,
                        is_deleted=False,
                        version=0,
                        created_at=datetime.now(timezone.utc),
                        updated_at=datetime.now(timezone.utc),
                    )
                    session.add(new_section)
                    saved_sections.append(new_section)
                    logger.info("Created section %s", new_section.id)
            
            session.commit()
            # Refresh all saved sections
            for section in saved_sections:
                session.refresh(section)
        
        # 3. Process seat operations using existing bulk handler
        saved_seats = []
        if command.seats:
            bulk_seat_command = BulkCreateSeatsCommand(
                venue_id=command.venue_id,
                layout_id=command.layout_id,
                seats=command.seats,
                file_id=None,  # Already handled in layout update
            )
            saved_seats = await seat_handler.handle_bulk_create_seats(bulk_seat_command)
            logger.info("Processed %d seat operations", len(saved_seats))
        
        return layout, saved_sections, saved_seats

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
