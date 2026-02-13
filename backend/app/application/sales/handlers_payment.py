"""Handlers for payment commands."""
import logging
from datetime import datetime, timezone

from app.application.sales.commands_payment import CreatePaymentCommand, CancelPaymentCommand
from app.domain.sales.payment_repositories import PaymentRepository
from app.domain.sales.payment import Payment
from app.domain.sales.booking_repositories import BookingRepository
from app.domain.sales.booking import Booking
from app.domain.ticketing.ticket_repositories import TicketRepository
from app.domain.ticketing.event_seat_repositories import EventSeatRepository
from app.domain.shared.repositories import SequenceRepository
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
        sequence_repository: SequenceRepository = None,
    ):
        self._payment_repository = payment_repository
        self._booking_repository = booking_repository
        self._ticket_repository = ticket_repository
        self._event_seat_repository = event_seat_repository
        self._sequence_repository = sequence_repository

    async def _generate_payment_code(self) -> str:
        """Generate payment code in format [yymmdd]-[sequence 6 digit]"""
        tenant_id = require_tenant_context()
        now = datetime.now(timezone.utc)
        
        # Format: YYMMDD
        date_part = now.strftime("%y%m%d")
        
        # Sequence type per year: PAYMENT-YYYY
        year = now.strftime("%Y")
        sequence_type = f"PAYMENT-{year}"
        
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
            logger.warning("Sequence repository not available, using random payment code")
        
        # Format: YYMMDD-SEQUENCE (e.g., 241225-000001)
        return f"{date_part}-{sequence_value}"

    async def handle_create_payment(self, command: CreatePaymentCommand) -> Payment:
        """Create a payment for a booking."""
        tenant_id = require_tenant_context()
        
        # Get the booking
        booking = await self._booking_repository.get_by_id(tenant_id, command.booking_id)
        if not booking:
            raise NotFoundError(f"Booking {command.booking_id} not found")
        
        # Validate booking status - payments can be made for PENDING, RESERVED, or CONFIRMED bookings
        # (PENDING is allowed for direct agency bookings where payment can be taken immediately)
        if booking.status not in [BookingStatusEnum.PENDING, BookingStatusEnum.CONFIRMED, BookingStatusEnum.RESERVED]:
            raise BusinessRuleError(
                f"Payment cannot be processed for booking with status '{booking.status.value}'. "
                f"Booking must be PENDING, CONFIRMED, or RESERVED before payment."
            )
        
        # Validate payment amount
        if command.amount <= 0:
            raise ValidationError("Payment amount must be greater than zero")
        
        # Calculate total paid so far (only completed payments count)
        existing_payments = await self._payment_repository.get_by_booking(tenant_id, command.booking_id)
        total_paid = sum(
            p.amount for p in existing_payments
            if p.status == PaymentStatusEnum.PAID
        )
        
        # Check if payment exceeds booking total
        remaining_balance = booking.total_amount - total_paid
        if command.amount > remaining_balance:
            raise BusinessRuleError(
                f"Payment amount ({command.amount}) exceeds remaining balance ({remaining_balance})"
            )
        
        # Generate payment code
        payment_code = await self._generate_payment_code()
        
        # Create payment (defaults to PAID status - aligns with BookingPaymentStatusEnum.PAID)
        payment = Payment(
            tenant_id=tenant_id,
            booking_id=command.booking_id,
            payment_code=payment_code,
            amount=command.amount,
            payment_method=command.payment_method,
            currency=command.currency,
            transaction_reference=command.transaction_reference,
            notes=command.notes,
            status=PaymentStatusEnum.PAID,
        )
        
        # Save payment
        saved_payment = await self._payment_repository.save(payment)
        
        # Update booking payment status and status
        total_paid_after = total_paid + saved_payment.amount
        is_fully_paid = total_paid_after >= booking.total_amount
        
        # Update due balance
        booking.due_balance = booking.total_amount - total_paid_after
        
        # Set booking status to CONFIRMED for both partial and full payments
        if booking.status != BookingStatusEnum.CONFIRMED and booking.status != BookingStatusEnum.CANCELLED:
            booking.status = BookingStatusEnum.CONFIRMED
        
        # Update payment status
        from app.shared.enums import BookingPaymentStatusEnum
        if is_fully_paid:
            # Fully paid
            booking.payment_status = BookingPaymentStatusEnum.PAID
        else:
            # Partially paid
            booking.payment_status = BookingPaymentStatusEnum.PROCESSING
        
        await self._booking_repository.save(booking)
        
        # If fully paid, confirm tickets and mark event-seats as sold
        if is_fully_paid and self._ticket_repository and self._event_seat_repository:
            await self._confirm_tickets_and_seats_for_booking(tenant_id, booking)
        
        logger.info(
            "Created payment %s for booking %s (amount: %s %s, total_paid: %s, due_balance: %s) for tenant=%s",
            saved_payment.id,
            command.booking_id,
            saved_payment.amount,
            saved_payment.currency,
            total_paid_after,
            booking.due_balance,
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
    
    async def handle_cancel_payment(self, command: CancelPaymentCommand) -> Payment:
        """Cancel/void a payment."""
        tenant_id = require_tenant_context()
        
        # Get the payment
        payment = await self._payment_repository.get_by_id(tenant_id, command.payment_id)
        if not payment:
            raise NotFoundError(f"Payment {command.payment_id} not found")
        
        # Get the booking to check if it's already cancelled
        booking = await self._booking_repository.get_by_id(tenant_id, payment.booking_id)
        if booking and booking.status == BookingStatusEnum.CANCELLED:
            raise BusinessRuleError(
                "Cannot void payment for a cancelled booking. Payments must be voided before cancellation."
            )
        
        # Cancel the payment (this validates the status internally)
        payment.cancel()
        
        # Save the payment
        saved_payment = await self._payment_repository.save(payment)
        
        # Update booking payment status and status
        # Recalculate total paid (only completed payments count)
        if booking:
            existing_payments = await self._payment_repository.get_by_booking(tenant_id, payment.booking_id)
            total_paid = sum(
                p.amount for p in existing_payments
                if p.status == PaymentStatusEnum.PAID
            )
            
            # Update due balance
            booking.due_balance = booking.total_amount - total_paid
            
            # Update booking status: CONFIRMED if any payments remain, otherwise keep current status
            if total_paid > 0:
                # Partially or fully paid - ensure status is CONFIRMED
                if booking.status != BookingStatusEnum.CONFIRMED and booking.status != BookingStatusEnum.CANCELLED:
                    booking.status = BookingStatusEnum.CONFIRMED
            
            # Update booking payment status
            from app.shared.enums import BookingPaymentStatusEnum
            if total_paid >= booking.total_amount:
                # Still fully paid
                booking.payment_status = BookingPaymentStatusEnum.PAID
            elif total_paid > 0:
                # Partially paid
                booking.payment_status = BookingPaymentStatusEnum.PROCESSING
            else:
                # No payments remaining
                booking.payment_status = BookingPaymentStatusEnum.PENDING
            
            await self._booking_repository.save(booking)
        
        logger.info(
            "Cancelled payment %s for booking %s (tenant=%s)",
            saved_payment.id,
            payment.booking_id,
            tenant_id
        )
        
        return saved_payment

