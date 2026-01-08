from app.presentation.api.shared.presenter import BasePresenter
from app.domain.sales.booking import Booking
from app.presentation.api.sales.schemas_booking import BookingResponse, BookingItemResponse


class BookingPresenter(BasePresenter[Booking, BookingResponse]):
    """Presenter for converting Booking entities to API responses"""

    def from_domain(self, booking: Booking) -> BookingResponse:
        # Convert booking items to response items
        items = [
            BookingItemResponse(
                id=item.id,
                event_seat_id=item.event_seat_id,
                ticket_id=item.ticket_id,
                section_name=item.section_name,
                row_name=item.row_name,
                seat_number=item.seat_number,
                unit_price=item.unit_price,
                total_price=item.total_price,
                currency=booking.currency,
                ticket_number=item.ticket_number,
                ticket_status=None,  # Ticket status is managed separately
            )
            for item in booking.items
        ]
        
        return BookingResponse(
            id=booking.id,
            tenant_id=booking.tenant_id,
            booking_number=booking.booking_number,
            customer_id=booking.customer_id,
            salesperson_id=booking.salesperson_id,
            event_id=booking.event_id,
            status=booking.status.value if hasattr(booking.status, 'value') else str(booking.status),
            subtotal_amount=booking.subtotal_amount,
            discount_amount=booking.discount_amount,
            discount_type=booking.discount_type,
            discount_value=booking.discount_value,
            tax_amount=booking.tax_amount,
            tax_rate=booking.tax_rate,
            total_amount=booking.total_amount,
            currency=booking.currency,
            payment_status=booking.payment_status.value if booking.payment_status and hasattr(booking.payment_status, 'value') else (str(booking.payment_status) if booking.payment_status else None),
            reserved_until=booking.reserved_until,
            cancelled_at=booking.cancelled_at,
            cancellation_reason=booking.cancellation_reason,
            items=items,
            created_at=booking.created_at,
            updated_at=booking.updated_at,
            version=booking.get_version(),
        )

