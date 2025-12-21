"""Handlers for booking commands and queries."""
import logging

from app.application.sales.commands_booking import (
    CreateBookingCommand,
    UpdateBookingCommand,
    DeleteBookingCommand
)
from app.application.sales.queries_booking import (
    GetBookingByIdQuery,
    GetBookingByCodeQuery,
    SearchBookingsQuery
)
from app.domain.sales.booking_repositories import BookingRepository, BookingSearchResult
from app.domain.sales.booking import Booking
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError
from app.shared.tenant_context import require_tenant_context

logger = logging.getLogger(__name__)


class BookingCommandHandler:
    """Handles booking master data commands."""

    def __init__(self, booking_repository: BookingRepository, code_generator=None):
        self._booking_repository = booking_repository

        self._code_generator = code_generator

    async def handle_create_booking(self, command: CreateBookingCommand) -> Booking:
        tenant_id = require_tenant_context()
        code_value = command.code

        
        if code_value:
            existing = await self._booking_repository.get_by_code(tenant_id, code_value)
            if existing:
                raise BusinessRuleError(f"Booking code '{code_value}' already exists")
        else:
            if not self._code_generator:
                raise RuntimeError("Code generator service is not configured for Booking")
            code_value = await self._code_generator.generate_code(
                sequence_type="BOO",
                prefix="BOO-",
                digits=6,
                description="Booking code"
            )

        booking = Booking(
            tenant_id=tenant_id,
            code=code_value,
            name=command.name,

        )

        saved = await self._booking_repository.save(booking)
        logger.info("Created booking %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def handle_update_booking(self, command: UpdateBookingCommand) -> Booking:
        tenant_id = require_tenant_context()
        booking = await self._get_booking_or_raise(tenant_id, command.booking_id)

        if command.code:
            normalized_code = command.code.strip().upper()
            if normalized_code != booking.code:
                duplicate = await self._booking_repository.get_by_code(tenant_id, normalized_code)
                if duplicate and duplicate.id != booking.id:
                    raise BusinessRuleError(f"Booking code '{normalized_code}' already exists")

        # Build update kwargs, only including fields that are explicitly provided
        update_kwargs = {}
        if command.code is not None:
            update_kwargs['code'] = command.code
        if command.name is not None:
            update_kwargs['name'] = command.name
        booking.update_details(**update_kwargs)

        saved = await self._booking_repository.save(booking)
        logger.info("Updated booking %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def handle_delete_booking(self, command: DeleteBookingCommand) -> bool:
        tenant_id = require_tenant_context()
        deleted = await self._booking_repository.delete(tenant_id, command.booking_id)

        if not deleted:
            raise NotFoundError(f"Booking {command.booking_id} not found")

        logger.info("Soft deleted booking %s for tenant=%s", command.booking_id, tenant_id)
        return True


    async def _get_booking_or_raise(self, tenant_id: str, booking_id: str) -> Booking:
        if not booking_id or not booking_id.strip():
            raise ValidationError("Booking identifier is required")

        booking = await self._booking_repository.get_by_id(tenant_id, booking_id)
        if not booking:
            raise NotFoundError(f"Booking " + str(booking_id) + " not found")
        return booking


class BookingQueryHandler:
    """Handles booking queries."""

    def __init__(self, booking_repository: BookingRepository):
        self._booking_repository = booking_repository

    async def handle_get_booking_by_id(self, query: GetBookingByIdQuery) -> Booking:
        tenant_id = require_tenant_context()
        booking = await self._booking_repository.get_by_id(tenant_id, query.booking_id)
        if not booking:
            raise NotFoundError(f"Booking {query.booking_id} not found")
        return booking

    async def handle_get_booking_by_code(self, query: GetBookingByCodeQuery) -> Booking:
        tenant_id = require_tenant_context()
        booking = await self._booking_repository.get_by_code(tenant_id, query.code)
        if not booking:
            raise NotFoundError(f"Booking code {query.code} not found")
        return booking

    async def handle_search_bookings(self, query: SearchBookingsQuery) -> BookingSearchResult:
        tenant_id = require_tenant_context()

        if query.limit <= 0 or query.limit > 200:
            raise ValidationError("Limit must be between 1 and 200")
        if query.skip < 0:
            raise ValidationError("Skip must be zero or greater")

        return await self._booking_repository.search(
            tenant_id=tenant_id,
            search=query.search,
            is_active=query.is_active,
            skip=query.skip,
            limit=query.limit,
        )

