"""Handlers for payment commands."""
import logging
from datetime import datetime, timezone

from app.application.sales.commands_payment import CreatePaymentCommand
from app.domain.sales.payment_repositories import PaymentRepository
from app.domain.sales.payment import Payment
from app.domain.sales.booking_repositories import BookingRepository
from app.domain.sales.booking import Booking
from app.domain.ticketing.ticket_repositories import TicketRepository
from app.domain.ticketing.event_seat_repositories import EventSeatRepository
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError
from app.shared.tenant_context import require_tenant_context
from app.shared.enums import PaymentStatusEnum, PaymentMethodEnum, BookingStatusEnum

logger = logging.getLogger(__name__)


class PaymentCommandHandler:
    """Handles payment commands."""

    def __init__(
        self,
        payment_repository: PaymentRepository,
        booking_repository: BookingRepository,
        ticket_repository: TicketRepository = None,
        event_seat_repository: EventSeatRepository = None,
    ):
        self._payment_repository = payment_repository
        self._booking_repository = booking_repository
        self._ticket_repository = ticket_repository
        self._event_seat_repository = event_seat_repository

    async def handle_create_payment(self, command: CreatePaymentCommand) -> Payment:
        """Create a payment for a booking."""
        tenant_id = require_tenant_context()
        
        # Get the booking
        booking = await self._booking_repository.get_by_id(tenant_id, command.booking_id)
        if not booking:
            raise NotFoundError(f"Booking {command.booking_id} not found")
        
        # Validate booking status - payments can only be made for CONFIRMED or RESERVED bookings
        if booking.status not in [BookingStatusEnum.CONFIRMED, BookingStatusEnum.RESERVED]:
            raise BusinessRuleError(
                f"Payment cannot be processed for booking with status '{booking.status.value}'. "
                f"Booking must be CONFIRMED or RESERVED before payment."
            )
        
        # Validate payment amount
        if command.amount <= 0:
            raise ValidationError("Payment amount must be greater than zero")
        
        # Calculate total paid so far (only completed payments count)
        existing_payments = await self._payment_repository.get_by_booking(tenant_id, command.booking_id)
        total_paid = sum(
            p.amount for p in existing_payments 
            if p.status == PaymentStatusEnum.COMPLETED
        )
        
        # Check if payment exceeds booking total
        remaining_balance = booking.total_amount - total_paid
        if command.amount > remaining_balance:
            raise BusinessRuleError(
                f"Payment amount ({command.amount}) exceeds remaining balance ({remaining_balance})"
            )
        
        # Create payment
        payment = Payment(
            tenant_id=tenant_id,
            booking_id=command.booking_id,
            amount=command.amount,
            payment_method=command.payment_method,
            currency=command.currency,
            transaction_reference=command.transaction_reference,
            notes=command.notes,
            status=PaymentStatusEnum.PENDING,
        )
        
        # Mark as completed immediately (for now - can be extended for async processing)
        payment.mark_as_completed()
        
        # Save payment
        saved_payment = await self._payment_repository.save(payment)
        
        # Update booking payment status
        total_paid_after = total_paid + saved_payment.amount
        is_fully_paid = total_paid_after >= booking.total_amount
        
        if is_fully_paid:
            # Fully paid - use booking's mark_as_paid method which handles status transitions properly
            booking.mark_as_paid()
        else:
            # Partially paid
            from app.shared.enums import PaymentStatusEnum as BookingPaymentStatusEnum
            booking.payment_status = BookingPaymentStatusEnum.PROCESSING
        
        await self._booking_repository.save(booking)
        
        # If fully paid, confirm tickets and mark event-seats as sold
        if is_fully_paid and self._ticket_repository and self._event_seat_repository:
            await self._confirm_tickets_and_seats_for_booking(tenant_id, booking)
        
        logger.info(
            "Created payment %s for booking %s (amount: %s %s, total_paid: %s, remaining: %s) for tenant=%s",
            saved_payment.id,
            command.booking_id,
            saved_payment.amount,
            saved_payment.currency,
            total_paid_after,
            booking.total_amount - total_paid_after,
            tenant_id
        )
        
        return saved_payment
    
    async def _confirm_tickets_and_seats_for_booking(self, tenant_id: str, booking: Booking) -> None:
        """Confirm tickets and mark event-seats as sold when booking is fully paid"""
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
        
        logger.info(
            "Confirmed %d tickets and marked %d event-seats as sold for booking %s",
            len(updated_tickets),
            len(updated_seats),
            booking.id
        )

