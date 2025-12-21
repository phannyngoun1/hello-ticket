"""Handlers for seat commands and queries."""
import logging

from app.application.ticketing.commands_seat import (
    CreateSeatCommand,
    UpdateSeatCommand,
    UpdateSeatCoordinatesCommand,
    DeleteSeatCommand,
    BulkCreateSeatsCommand,
    DeleteSeatsByVenueCommand,
)
from app.application.ticketing.queries_seat import (
    GetSeatByIdQuery,
    GetSeatsByVenueQuery,
    GetSeatsByLayoutQuery,
    GetSeatByLocationQuery,
)
from app.domain.ticketing.seat_repositories import SeatRepository
from app.domain.ticketing.seat import Seat, SeatType
from app.domain.ticketing.venue_repositories import VenueRepository
from app.domain.ticketing.layout_repositories import LayoutRepository
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError
from app.shared.tenant_context import require_tenant_context

logger = logging.getLogger(__name__)


class SeatCommandHandler:
    """Handles seat master data commands."""

    def __init__(self, seat_repository: SeatRepository, venue_repository: VenueRepository, layout_repository: LayoutRepository):
        self._seat_repository = seat_repository
        self._venue_repository = venue_repository
        self._layout_repository = layout_repository

    async def handle_create_seat(self, command: CreateSeatCommand) -> Seat:
        tenant_id = require_tenant_context()
        
        # Verify venue exists
        venue = await self._venue_repository.get_by_id(tenant_id, command.venue_id)
        if not venue:
            raise NotFoundError(f"Venue with ID '{command.venue_id}' not found")
        
        # Verify layout exists
        layout = await self._layout_repository.get_by_id(tenant_id, command.layout_id)
        if not layout:
            raise NotFoundError(f"Layout with ID '{command.layout_id}' not found")
        
        # Check if seat already exists at this location
        existing = await self._seat_repository.get_by_layout_and_location(
            tenant_id,
            command.layout_id,
            command.section_id,
            command.row,
            command.seat_number,
        )
        if existing:
            raise BusinessRuleError(
                f"Seat already exists at section_id {command.section_id} {command.row} {command.seat_number}"
            )

        seat = Seat(
            tenant_id=tenant_id,
            venue_id=command.venue_id,
            layout_id=command.layout_id,
            section_id=command.section_id,
            row=command.row,
            seat_number=command.seat_number,
            seat_type=command.seat_type,
            x_coordinate=command.x_coordinate,
            y_coordinate=command.y_coordinate,
        )

        saved = await self._seat_repository.save(seat)
        logger.info("Created seat %s for venue=%s", saved.id, command.venue_id)
        return saved

    async def handle_update_seat(self, command: UpdateSeatCommand) -> Seat:
        tenant_id = require_tenant_context()
        
        seat = await self._seat_repository.get_by_id(tenant_id, command.seat_id)
        if not seat:
            raise NotFoundError(f"Seat with ID '{command.seat_id}' not found")

        # If location is being updated, check for conflicts
        if command.section_id or command.row or command.seat_number:
            new_section_id = command.section_id or seat.section_id
            new_row = command.row or seat.row
            new_seat_number = command.seat_number or seat.seat_number
            
            if (new_section_id != seat.section_id or 
                new_row != seat.row or 
                new_seat_number != seat.seat_number):
                existing = await self._seat_repository.get_by_layout_and_location(
                    tenant_id,
                    seat.layout_id,
                    new_section_id,
                    new_row,
                    new_seat_number,
                )
                if existing and existing.id != seat.id:
                    raise BusinessRuleError(
                        f"Seat already exists at section_id {new_section_id} {new_row} {new_seat_number}"
                    )

        seat.update_details(
            section_id=command.section_id,
            row=command.row,
            seat_number=command.seat_number,
            seat_type=command.seat_type,
            x_coordinate=command.x_coordinate,
            y_coordinate=command.y_coordinate,
        )

        saved = await self._seat_repository.save(seat)
        logger.info("Updated seat %s", saved.id)
        return saved

    async def handle_update_seat_coordinates(self, command: UpdateSeatCoordinatesCommand) -> Seat:
        tenant_id = require_tenant_context()
        
        seat = await self._seat_repository.get_by_id(tenant_id, command.seat_id)
        if not seat:
            raise NotFoundError(f"Seat with ID '{command.seat_id}' not found")

        seat.update_coordinates(command.x_coordinate, command.y_coordinate)
        saved = await self._seat_repository.save(seat)
        logger.info("Updated seat coordinates for seat %s", saved.id)
        return saved

    async def handle_delete_seat(self, command: DeleteSeatCommand) -> bool:
        tenant_id = require_tenant_context()
        
        deleted = await self._seat_repository.delete(tenant_id, command.seat_id, hard_delete=False)
        if not deleted:
            raise NotFoundError(f"Seat with ID '{command.seat_id}' not found")
        
        logger.info("Deleted seat %s", command.seat_id)
        return deleted

    async def handle_bulk_create_seats(self, command: BulkCreateSeatsCommand) -> list[Seat]:
        tenant_id = require_tenant_context()
        
        # Verify venue exists
        venue = await self._venue_repository.get_by_id(tenant_id, command.venue_id)
        if not venue:
            raise NotFoundError(f"Venue with ID '{command.venue_id}' not found")
        
        # Verify layout exists
        layout = await self._layout_repository.get_by_id(tenant_id, command.layout_id)
        if not layout:
            raise NotFoundError(f"Layout with ID '{command.layout_id}' not found")
        
        # Update layout file_id if provided
        if command.file_id and layout.file_id != command.file_id:
            layout.update_details(file_id=command.file_id)
            await self._layout_repository.save(layout)
            logger.info("Updated layout %s file_id to %s", command.layout_id, command.file_id)

        # Get or create sections based on section names in the seat data
        # Build a map of section_name -> section_id
        from app.infrastructure.shared.database.models import SectionModel
        from app.infrastructure.shared.database.connection import get_session_sync
        from sqlmodel import select
        from app.shared.utils import generate_id
        from datetime import datetime, timezone
        
        section_name_to_id = {}
        unique_section_names = {seat_data.get("section", "") for seat_data in command.seats if seat_data.get("section")}
        
        if unique_section_names:
            with get_session_sync() as session:
                # Get existing sections for this layout
                statement = select(SectionModel).where(
                    SectionModel.tenant_id == tenant_id,
                    SectionModel.layout_id == command.layout_id,
                    SectionModel.is_deleted == False
                )
                existing_sections = session.exec(statement).all()
                
                # Map existing sections
                for section in existing_sections:
                    section_name_to_id[section.name] = section.id
                
                # Create missing sections
                for section_name in unique_section_names:
                    if section_name and section_name not in section_name_to_id:
                        new_section = SectionModel(
                            id=generate_id(),
                            tenant_id=tenant_id,
                            layout_id=command.layout_id,
                            name=section_name,
                            is_active=True,
                            is_deleted=False,
                            version=0,
                            created_at=datetime.now(timezone.utc),
                            updated_at=datetime.now(timezone.utc),
                        )
                        session.add(new_section)
                        section_name_to_id[section_name] = new_section.id
                        logger.info("Created section '%s' with ID %s for layout %s", section_name, new_section.id, command.layout_id)
                
                session.commit()

        result_seats = []
        errors = []
        created_count = 0
        updated_count = 0
        deleted_count = 0

        from sqlalchemy.exc import ProgrammingError
        
        # Get all existing seats for this layout
        existing_seats = await self._seat_repository.get_all_by_layout(
            tenant_id=tenant_id,
            layout_id=command.layout_id,
        )
        
        # Extract IDs from frontend seats list (all seats with id, regardless of delete flag)
        # These are seats that the frontend knows about
        frontend_seat_ids = {
            seat_data.get("id")
            for seat_data in command.seats
            if seat_data.get("id")
        }
        
        # Delete seats that exist in database but are not in the frontend list
        for existing_seat in existing_seats:
            if existing_seat.id not in frontend_seat_ids:
                try:
                    deleted = await self._seat_repository.delete(
                        tenant_id, existing_seat.id, hard_delete=False
                    )
                    if deleted:
                        deleted_count += 1
                        logger.info("Deleted seat %s (not in frontend list)", existing_seat.id)
                    else:
                        errors.append(f"Seat with ID '{existing_seat.id}' not found for deletion")
                except Exception as e:
                    errors.append(f"Failed to delete seat {existing_seat.id}: {str(e)}")
                    logger.warning("Failed to delete seat %s: %s", existing_seat.id, str(e))
        
        # Process all seats from frontend - determine operation type by presence of 'id'
        # Deletion is handled above by comparing existing seats with frontend list
        for seat_data in command.seats:
            seat_id = seat_data.get("id")
            
            # Update operation: has id
            if seat_id:
                try:
                    seat = await self._seat_repository.get_by_id(tenant_id, seat_id)
                    if not seat:
                        errors.append(f"Seat with ID '{seat_id}' not found for update")
                        continue
                    
                    # Update seat details
                    update_kwargs = {}
                    if "section_id" in seat_data:
                        update_kwargs["section_id"] = seat_data["section_id"]
                    if "row" in seat_data:
                        update_kwargs["row"] = seat_data["row"]
                    if "seat_number" in seat_data:
                        update_kwargs["seat_number"] = seat_data["seat_number"]
                    if "seat_type" in seat_data:
                        update_kwargs["seat_type"] = SeatType(seat_data["seat_type"])
                    if "x_coordinate" in seat_data:
                        update_kwargs["x_coordinate"] = seat_data["x_coordinate"]
                    if "y_coordinate" in seat_data:
                        update_kwargs["y_coordinate"] = seat_data["y_coordinate"]
                    
                    seat.update_details(**update_kwargs)
                    saved = await self._seat_repository.save(seat)
                    result_seats.append(saved)
                    updated_count += 1
                except (BusinessRuleError, NotFoundError) as e:
                    errors.append(f"Failed to update seat: {str(e)}")
                    logger.warning("Failed to update seat: %s", str(e))
                except Exception as e:
                    errors.append(f"Failed to update seat: {str(e)}")
                    logger.warning("Failed to update seat: %s", str(e))
            
            # Create operation: no id
            else:
                try:
                    # Check if there's a soft-deleted seat at this location
                    # If so, hard delete it first to avoid unique constraint violation
                    section_name = seat_data.get("section", "")
                    section_id = section_name_to_id.get(section_name, "")
                    row = seat_data.get("row", "")
                    seat_number = seat_data.get("seat_number", "")
                    
                    if not section_id:
                        errors.append(f"Failed to create seat: Section '{section_name}' not found")
                        logger.warning("Section '%s' not found in section_name_to_id map", section_name)
                        continue
                    
                    existing_deleted_seat = await self._seat_repository.get_by_layout_and_location(
                        tenant_id=tenant_id,
                        layout_id=command.layout_id,
                        section_id=section_id,
                        row=row,
                        seat_number=seat_number,
                        include_deleted=True,
                    )
                    
                    if existing_deleted_seat:
                        # Hard delete the soft-deleted seat to free up the unique constraint
                        await self._seat_repository.delete(
                            tenant_id, existing_deleted_seat.id, hard_delete=True
                        )
                        logger.info(
                            "Hard deleted soft-deleted seat %s at section_id %s %s %s to allow recreation",
                            existing_deleted_seat.id, section_id, row, seat_number
                        )
                    
                    seat = Seat(
                        tenant_id=tenant_id,
                        venue_id=command.venue_id,
                        layout_id=command.layout_id,
                        section_id=section_id,
                        row=row,
                        seat_number=seat_number,
                        seat_type=SeatType(seat_data.get("seat_type", "STANDARD")),
                        x_coordinate=seat_data.get("x_coordinate"),
                        y_coordinate=seat_data.get("y_coordinate"),
                    )
                    saved = await self._seat_repository.save(seat)
                    result_seats.append(saved)
                    created_count += 1
                except (ProgrammingError, BusinessRuleError) as e:
                    error_msg = str(e)
                    # Check if it's the layout_id column issue
                    if "layout_id" in error_msg and "does not exist" in error_msg:
                        if not result_seats:
                            raise BusinessRuleError(
                                "Cannot create seats: layout_id column does not exist in database. "
                                "Please run database migration to add the layout_id column to the seats table."
                            )
                        errors.append("Failed to create seat: layout_id column does not exist in database")
                        logger.warning("Failed to create seat due to missing layout_id column")
                    # Check for unique constraint violation (IntegrityError converted to BusinessRuleError)
                    elif "UniqueViolation" in error_msg or "duplicate key" in error_msg.lower():
                        # Try to find and hard delete the conflicting soft-deleted seat
                        try:
                            section_name = seat_data.get("section", "")
                            section_id = section_name_to_id.get(section_name, "")
                            conflicting_seat = await self._seat_repository.get_by_layout_and_location(
                                tenant_id=tenant_id,
                                layout_id=command.layout_id,
                                section_id=section_id,
                                row=seat_data.get("row", ""),
                                seat_number=seat_data.get("seat_number", ""),
                                include_deleted=True,
                            )
                            if conflicting_seat:
                                await self._seat_repository.delete(
                                    tenant_id, conflicting_seat.id, hard_delete=True
                                )
                                # Retry creating the seat
                                seat = Seat(
                                    tenant_id=tenant_id,
                                    venue_id=command.venue_id,
                                    layout_id=command.layout_id,
                                    section_id=section_id,
                                    row=seat_data.get("row", ""),
                                    seat_number=seat_data.get("seat_number", ""),
                                    seat_type=SeatType(seat_data.get("seat_type", "STANDARD")),
                                    x_coordinate=seat_data.get("x_coordinate"),
                                    y_coordinate=seat_data.get("y_coordinate"),
                                )
                                saved = await self._seat_repository.save(seat)
                                result_seats.append(saved)
                                created_count += 1
                                logger.info("Retried creating seat after hard deleting conflicting soft-deleted seat")
                            else:
                                errors.append(f"Failed to create seat: {error_msg}")
                                logger.warning("Failed to create seat: %s (no conflicting seat found)", error_msg)
                        except Exception as retry_error:
                            errors.append(f"Failed to create seat: {error_msg} (retry also failed: {str(retry_error)})")
                            logger.warning("Failed to create seat: %s (retry also failed: %s)", error_msg, str(retry_error))
                    else:
                        errors.append(f"Failed to create seat: {error_msg}")
                        logger.warning("Failed to create seat: %s", error_msg)
                except Exception as e:
                    error_msg = str(e)
                    # Check for unique constraint violation - might be a race condition
                    if "UniqueViolation" in error_msg or "duplicate key" in error_msg.lower():
                        # Try to find and hard delete the conflicting seat
                        try:
                            section_name = seat_data.get("section", "")
                            section_id = section_name_to_id.get(section_name, "")
                            conflicting_seat = await self._seat_repository.get_by_layout_and_location(
                                tenant_id=tenant_id,
                                layout_id=command.layout_id,
                                section_id=section_id,
                                row=seat_data.get("row", ""),
                                seat_number=seat_data.get("seat_number", ""),
                                include_deleted=True,
                            )
                            if conflicting_seat:
                                await self._seat_repository.delete(
                                    tenant_id, conflicting_seat.id, hard_delete=True
                                )
                                # Retry creating the seat
                                seat = Seat(
                                    tenant_id=tenant_id,
                                    venue_id=command.venue_id,
                                    layout_id=command.layout_id,
                                    section_id=section_id,
                                    row=seat_data.get("row", ""),
                                    seat_number=seat_data.get("seat_number", ""),
                                    seat_type=SeatType(seat_data.get("seat_type", "STANDARD")),
                                    x_coordinate=seat_data.get("x_coordinate"),
                                    y_coordinate=seat_data.get("y_coordinate"),
                                )
                                saved = await self._seat_repository.save(seat)
                                result_seats.append(saved)
                                created_count += 1
                                logger.info("Retried creating seat after hard deleting conflicting soft-deleted seat")
                            else:
                                errors.append(f"Failed to create seat: {error_msg} (no conflicting seat found)")
                                logger.warning("Failed to create seat: %s (no conflicting seat found)", error_msg)
                        except Exception as retry_error:
                            errors.append(f"Failed to create seat: {error_msg} (retry also failed: {str(retry_error)})")
                            logger.warning("Failed to create seat: %s (retry also failed: %s)", error_msg, str(retry_error))
                    else:
                        errors.append(f"Failed to create seat: {error_msg}")
                        logger.warning("Failed to create seat: %s", error_msg)

        if errors and not result_seats and deleted_count == 0:
            raise BusinessRuleError(f"Failed to process seats: {'; '.join(errors)}")
        
        if errors:
            logger.warning("Bulk seat operation completed with %d errors: %s", len(errors), '; '.join(errors))
        
        logger.info(
            "Bulk seat operation: created=%d, updated=%d, deleted=%d for venue=%s",
            created_count,
            updated_count,
            deleted_count,
            command.venue_id
        )
        return result_seats

    async def handle_delete_seats_by_venue(self, command: DeleteSeatsByVenueCommand) -> int:
        tenant_id = require_tenant_context()
        
        count = await self._seat_repository.delete_by_venue(tenant_id, command.venue_id)
        logger.info("Deleted %d seats for venue=%s", count, command.venue_id)
        return count


class SeatQueryHandler:
    """Handles seat queries."""

    def __init__(self, seat_repository: SeatRepository):
        self._seat_repository = seat_repository

    async def handle_get_seat_by_id(self, query: GetSeatByIdQuery) -> Seat:
        tenant_id = require_tenant_context()
        seat = await self._seat_repository.get_by_id(tenant_id, query.seat_id)
        if not seat:
            raise NotFoundError(f"Seat with ID '{query.seat_id}' not found")
        return seat

    async def handle_get_seats_by_venue(self, query: GetSeatsByVenueQuery):
        tenant_id = require_tenant_context()
        return await self._seat_repository.get_by_venue(
            tenant_id,
            query.venue_id,
            skip=query.skip,
            limit=query.limit,
        )

    async def handle_get_seats_by_layout(self, query: GetSeatsByLayoutQuery):
        tenant_id = require_tenant_context()
        return await self._seat_repository.get_by_layout(
            tenant_id,
            query.layout_id,
            skip=query.skip,
            limit=query.limit,
        )

    async def handle_get_seat_by_location(self, query: GetSeatByLocationQuery) -> Seat:
        tenant_id = require_tenant_context()
        seat = await self._seat_repository.get_by_layout_and_location(
            tenant_id,
            # We need the layout_id here - let's get it from venue context or require it in the query
            # For now, we'll need to add a method that searches by venue + section_id
            query.venue_id,
            query.section_id,
            query.row,
            query.seat_number,
        )
        if not seat:
            raise NotFoundError(
                f"Seat not found at section_id {query.section_id} {query.row} {query.seat_number}"
            )
        return seat
