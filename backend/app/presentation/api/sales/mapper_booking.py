"""API mapper for Sales module"""
from app.domain.sales.booking import Booking
from app.presentation.api.sales.schemas_booking import BookingResponse


class SalesApiMapper:
    """Mapper for converting domain entities to API responses"""

    @staticmethod
    def booking_to_response(booking: Booking) -> BookingResponse:
        return BookingResponse(
            id=booking.id,
            tenant_id=booking.tenant_id,
            code=booking.code,
            name=booking.name,

            is_active=booking.is_active,
            created_at=booking.created_at,
            updated_at=booking.updated_at,
            deactivated_at=booking.deactivated_at,
        )

