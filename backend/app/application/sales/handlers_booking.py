"""Handlers for booking commands and queries."""
import logging
from datetime import datetime, timezone

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
from app.domain.sales.booking import Booking, BookingItem
from app.domain.shared.repositories import SequenceRepository
from app.domain.ticketing.ticket_repositories import TicketRepository
from app.domain.ticketing.event_seat_repositories import EventSeatRepository
from app.shared.exceptions import BusinessRuleError, NotFoundError
from app.application.shared.base.base_application_handler import BaseApplicationHandler

logger = logging.getLogger(__name__)


class BookingCommandHandler(BaseApplicationHandler):
    """Handles booking master data commands."""

    def __init__(
        self, 
        booking_repository: BookingRepository, 
        code_generator=None, 
        sequence_repository: SequenceRepository = None,
        ticket_repository: TicketRepository = None,
        event_seat_repository: EventSeatRepository = None
    ):
        self._booking_repository = booking_repository
        self._code_generator = code_generator
        self._sequence_repository = sequence_repository
        self._ticket_repository = ticket_repository
        self._event_seat_repository = event_seat_repository

    async def _generate_booking_number(self) -> str:
        """Generate booking number in format BK-[yymmdd]-[sequence of the year]"""
        tenant_id = self.get_tenant_id()
        now = datetime.now(timezone.utc)
        
        # Format: YYMMDD
        date_part = now.strftime("%y%m%d")
        
        # Sequence type per year: BOOKING-YYYY
        year = now.strftime("%Y")
        sequence_type = f"BOOKING-{year}"
        
        # Get next sequence value for this year (6 digits: 000001, 000002, etc.)
        if self._sequence_repository:
            sequence_value = await self._sequence_repository.get_next_value(
                tenant_id=tenant_id,
                sequence_type=sequence_type,
                prefix="",
                digits=6,
            )
        else:
            # Fallback if sequence repository is not available
            # This should not happen in production, but provides a fallback
            import random
            sequence_value = str(random.randint(1, 999999)).zfill(6)
            logger.warning("Sequence repository not available, using random booking number")
        
        # Format: BK-YYMMDD-SEQUENCE (e.g., BK-241225-000001)
        return f"BK-{date_part}-{sequence_value}"

    async def handle_create_booking(self, command: CreateBookingCommand) -> Booking:
        tenant_id = self.get_tenant_id()
        
        # Generate booking number
        booking_number = await self._generate_booking_number()
        
        # Convert command items to domain BookingItem objects
        items = []
        for item_cmd in command.items:
            item = BookingItem(
                event_seat_id=item_cmd.event_seat_id,
                unit_price=item_cmd.unit_price,
                section_name=item_cmd.section_name,
                row_name=item_cmd.row_name,
                seat_number=item_cmd.seat_number,
                ticket_number=item_cmd.ticket_number,
            )
            items.append(item)

        # Create booking with items and generated booking number
        booking = Booking(
            tenant_id=tenant_id,
            event_id=command.event_id,
            items=items,
            booking_number=booking_number,
            customer_id=command.customer_id,
            salesperson_id=command.salesperson_id,
            discount_type=command.discount_type,
            discount_value=command.discount_value,
            tax_rate=command.tax_rate,
            currency=command.currency,
        )

        saved = await self._booking_repository.save(booking)
        
        # Update tickets and event seats status
        if self._ticket_repository and self._event_seat_repository:
            await self._update_tickets_and_seats_for_booking(tenant_id, saved)
        
        logger.info("Created booking %s (booking_number=%s) for tenant=%s", saved.id, saved.booking_number, tenant_id)
        return saved

    async def _update_tickets_and_seats_for_booking(self, tenant_id: str, booking: Booking) -> None:
        """Update ticket and event-seat statuses when booking is created"""
        from app.shared.enums import TicketStatusEnum
        
        updated_tickets = []
        updated_seats = []
        
        for item in booking.items:
            # Get ticket by event_seat_id or ticket_number
            ticket = None
            if item.ticket_number and self._ticket_repository:
                ticket = await self._ticket_repository.get_by_ticket_number(tenant_id, item.ticket_number)
            
            if not ticket and item.event_seat_id and self._ticket_repository:
                ticket = await self._ticket_repository.get_by_event_seat(tenant_id, item.event_seat_id)
            
            if ticket:
                # Reserve ticket for this booking
                ticket.reserve(
                    booking_id=booking.id,
                    reserved_until=booking.reserved_until
                )
                updated_tickets.append(ticket)
            
            # Get and update event seat
            if item.event_seat_id and self._event_seat_repository:
                event_seat = await self._event_seat_repository.get_by_id(tenant_id, item.event_seat_id)
                if event_seat:
                    # Reserve the seat
                    try:
                        event_seat.reserve()
                        updated_seats.append(event_seat)
                    except BusinessRuleError as e:
                        logger.warning(f"Cannot reserve event seat {item.event_seat_id}: {e}")
        
        # Save all updated tickets
        if updated_tickets and self._ticket_repository:
            for ticket in updated_tickets:
                await self._ticket_repository.save(ticket)
        
        # Save all updated event seats
        if updated_seats and self._event_seat_repository:
            for seat in updated_seats:
                await self._event_seat_repository.save(seat)

    async def handle_update_booking(self, command: UpdateBookingCommand) -> Booking:
        tenant_id = self.get_tenant_id()
        booking = await self.get_entity_or_404(
            self._booking_repository, 
            command.booking_id, 
            "Booking",
            tenant_id
        )
        
        old_status = booking.status

        # Update customer if provided
        if command.customer_id is not None:
            booking.customer_id = command.customer_id

        # Update salesperson if provided
        if command.salesperson_id is not None:
            booking.salesperson_id = command.salesperson_id

        # Update status if provided
        if command.status is not None:
            from app.shared.enums import BookingStatusEnum
            booking.status = BookingStatusEnum(command.status)

        # Update discount if provided
        if command.discount_type is not None and command.discount_value is not None:
            booking.apply_discount(command.discount_type, command.discount_value)

        # Update payment status if provided
        if command.payment_status is not None:
            from app.shared.enums import BookingPaymentStatusEnum
            booking.payment_status = BookingPaymentStatusEnum(command.payment_status)

        saved = await self._booking_repository.save(booking)
        
        # If status changed to CONFIRMED or PAID, confirm tickets and mark seats as sold
        if (command.status and 
            old_status != saved.status and 
            saved.status in [BookingStatusEnum.CONFIRMED, BookingStatusEnum.PAID] and
            self._ticket_repository and self._event_seat_repository):
            await self._confirm_tickets_and_seats_for_booking(tenant_id, saved)
        
        logger.info("Updated booking %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def _confirm_tickets_and_seats_for_booking(self, tenant_id: str, booking: Booking) -> None:
        """Confirm tickets and mark event-seats as sold when booking is confirmed/paid"""
        if not self._ticket_repository:
            return
        
        # Get all tickets for this booking
        tickets = await self._ticket_repository.get_by_booking(tenant_id, booking.id)
        
        updated_tickets = []
        updated_seats = []
        
        for ticket in tickets:
            # Confirm the ticket
            try:
                ticket.confirm()
                updated_tickets.append(ticket)
            except BusinessRuleError as e:
                logger.warning(f"Cannot confirm ticket {ticket.id}: {e}")
            
            # Mark the event seat as sold
            if ticket.event_seat_id and self._event_seat_repository:
                event_seat = await self._event_seat_repository.get_by_id(tenant_id, ticket.event_seat_id)
                if event_seat:
                    try:
                        event_seat.sell()
                        updated_seats.append(event_seat)
                    except BusinessRuleError as e:
                        logger.warning(f"Cannot mark event seat {ticket.event_seat_id} as sold: {e}")
        
        # Save all updated tickets
        if updated_tickets:
            for ticket in updated_tickets:
                await self._ticket_repository.save(ticket)
        
        # Save all updated event seats
        if updated_seats and self._event_seat_repository:
            for seat in updated_seats:
                await self._event_seat_repository.save(seat)

    async def handle_delete_booking(self, command: DeleteBookingCommand) -> bool:
        tenant_id = self.get_tenant_id()
        booking = await self.get_entity_or_404(
            self._booking_repository, 
            command.booking_id, 
            "Booking",
            tenant_id
        )
        
        # Cancel the booking with reason if provided
        booking.cancel(reason=command.cancellation_reason)
        
        saved = await self._booking_repository.save(booking)
        
        # Release tickets and event seats when booking is cancelled
        if self._ticket_repository and self._event_seat_repository:
            await self._release_tickets_and_seats_for_booking(tenant_id, saved)
        
        logger.info("Cancelled booking %s (reason: %s) for tenant=%s", command.booking_id, command.cancellation_reason or "none", tenant_id)
        return True

    async def _release_tickets_and_seats_for_booking(self, tenant_id: str, booking: Booking) -> None:
        """Release tickets and event-seats when booking is cancelled"""
        if not self._ticket_repository:
            return
        
        # Get all tickets for this booking
        tickets = await self._ticket_repository.get_by_booking(tenant_id, booking.id)
        
        updated_tickets = []
        updated_seats = []
        
        for ticket in tickets:
            # Release the ticket back to available
            try:
                ticket.release()
                updated_tickets.append(ticket)
            except BusinessRuleError as e:
                logger.warning(f"Cannot release ticket {ticket.id}: {e}")
            
            # Release the event seat
            if ticket.event_seat_id and self._event_seat_repository:
                event_seat = await self._event_seat_repository.get_by_id(tenant_id, ticket.event_seat_id)
                if event_seat:
                    try:
                        event_seat.release()
                        updated_seats.append(event_seat)
                    except BusinessRuleError as e:
                        logger.warning(f"Cannot release event seat {ticket.event_seat_id}: {e}")
        
        # Save all updated tickets
        if updated_tickets:
            for ticket in updated_tickets:
                await self._ticket_repository.save(ticket)
        
        # Save all updated event seats
        if updated_seats and self._event_seat_repository:
            for seat in updated_seats:
                await self._event_seat_repository.save(seat)





class BookingQueryHandler(BaseApplicationHandler):
    """Handles booking queries."""

    def __init__(self, booking_repository: BookingRepository):
        self._booking_repository = booking_repository

    async def handle_get_booking_by_id(self, query: GetBookingByIdQuery) -> Booking:
        return await self.get_entity_or_404(
            self._booking_repository,
            query.booking_id,
            "Booking"
        )

    async def handle_get_booking_by_code(self, query: GetBookingByCodeQuery) -> Booking:
        tenant_id = self.get_tenant_id()
        booking = await self._booking_repository.get_by_code(tenant_id, query.code)
        if not booking:
            raise NotFoundError(f"Booking code {query.code} not found")
        return booking

    async def handle_search_bookings(self, query: SearchBookingsQuery) -> BookingSearchResult:
        tenant_id = self.get_tenant_id()

        if query.limit <= 0 or query.limit > 200:
            raise ValidationError("Limit must be between 1 and 200")
        if query.skip < 0:
            raise ValidationError("Skip must be zero or greater")

        return await self._booking_repository.search(
            tenant_id=tenant_id,
            search=query.search,
            is_active=None,  # Not used for transaction bookings
            include_deleted=False,
            skip=query.skip,
            limit=query.limit,
        )

