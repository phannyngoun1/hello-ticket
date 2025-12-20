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
    GetSeatByLocationQuery,
)
from app.domain.ticketing.seat_repositories import SeatRepository
from app.domain.ticketing.seat import Seat, SeatType
from app.domain.ticketing.venue_repositories import VenueRepository
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError
from app.shared.tenant_context import require_tenant_context

logger = logging.getLogger(__name__)


class SeatCommandHandler:
    """Handles seat master data commands."""

    def __init__(self, seat_repository: SeatRepository, venue_repository: VenueRepository):
        self._seat_repository = seat_repository
        self._venue_repository = venue_repository

    async def handle_create_seat(self, command: CreateSeatCommand) -> Seat:
        tenant_id = require_tenant_context()
        
        # Verify venue exists
        venue = await self._venue_repository.get_by_id(tenant_id, command.venue_id)
        if not venue:
            raise NotFoundError(f"Venue with ID '{command.venue_id}' not found")
        
        # Check if seat already exists at this location
        existing = await self._seat_repository.get_by_venue_and_location(
            tenant_id,
            command.venue_id,
            command.section,
            command.row,
            command.seat_number,
        )
        if existing:
            raise BusinessRuleError(
                f"Seat already exists at {command.section} {command.row} {command.seat_number}"
            )

        seat = Seat(
            tenant_id=tenant_id,
            venue_id=command.venue_id,
            section=command.section,
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
        if command.section or command.row or command.seat_number:
            new_section = command.section or seat.section
            new_row = command.row or seat.row
            new_seat_number = command.seat_number or seat.seat_number
            
            if (new_section != seat.section or 
                new_row != seat.row or 
                new_seat_number != seat.seat_number):
                existing = await self._seat_repository.get_by_venue_and_location(
                    tenant_id,
                    seat.venue_id,
                    new_section,
                    new_row,
                    new_seat_number,
                )
                if existing and existing.id != seat.id:
                    raise BusinessRuleError(
                        f"Seat already exists at {new_section} {new_row} {new_seat_number}"
                    )

        seat.update_details(
            section=command.section,
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

        created_seats = []
        errors = []

        for seat_data in command.seats:
            try:
                seat = Seat(
                    tenant_id=tenant_id,
                    venue_id=command.venue_id,
                    section=seat_data.get("section", ""),
                    row=seat_data.get("row", ""),
                    seat_number=seat_data.get("seat_number", ""),
                    seat_type=SeatType(seat_data.get("seat_type", "STANDARD")),
                    x_coordinate=seat_data.get("x_coordinate"),
                    y_coordinate=seat_data.get("y_coordinate"),
                )
                saved = await self._seat_repository.save(seat)
                created_seats.append(saved)
            except Exception as e:
                errors.append(f"Failed to create seat: {str(e)}")
                logger.warning("Failed to create seat: %s", str(e))

        if errors and not created_seats:
            raise BusinessRuleError(f"Failed to create seats: {'; '.join(errors)}")
        
        logger.info("Bulk created %d seats for venue=%s", len(created_seats), command.venue_id)
        return created_seats

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

    async def handle_get_seat_by_location(self, query: GetSeatByLocationQuery) -> Seat:
        tenant_id = require_tenant_context()
        seat = await self._seat_repository.get_by_venue_and_location(
            tenant_id,
            query.venue_id,
            query.section,
            query.row,
            query.seat_number,
        )
        if not seat:
            raise NotFoundError(
                f"Seat not found at {query.section} {query.row} {query.seat_number}"
            )
        return seat
