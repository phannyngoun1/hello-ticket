"""
Booking mapper - handles conversion between domain entities and database models
"""
from typing import Optional, List
from app.domain.sales.booking import Booking, BookingItem
from app.infrastructure.shared.database.models import BookingModel, BookingItemModel
from app.shared.enums import BookingStatusEnum, BookingPaymentStatusEnum


class BookingMapper:
    """Mapper for Booking entity to BookingModel and BookingItemModel conversion"""
    
    @staticmethod
    def to_domain(
        booking_model: BookingModel,
        item_models: Optional[List[BookingItemModel]] = None
    ) -> Booking:
        """Convert database models to domain entity
        
        Args:
            booking_model: BookingModel from database
            item_models: List of BookingItemModel from database
            
        Returns:
            Booking domain entity with items
        """
        # Convert items
        items = []
        if item_models:
            for item_model in item_models:
                item = BookingItem(
                    event_seat_id=item_model.event_seat_id,
                    unit_price=item_model.unit_price,
                    section_name=item_model.section_name,
                    row_name=item_model.row_name,
                    seat_number=item_model.seat_number,
                    ticket_id=item_model.ticket_id,
                    ticket_number=item_model.ticket_number,
                    item_id=item_model.id,
                )
                items.append(item)
        
        # Convert status enums
        status = BookingStatusEnum(booking_model.status) if booking_model.status else BookingStatusEnum.PENDING
        payment_status = BookingPaymentStatusEnum(booking_model.payment_status) if booking_model.payment_status else None
        
        return Booking(
            tenant_id=booking_model.tenant_id,
            event_id=booking_model.event_id,
            items=items,
            booking_id=booking_model.id,
            booking_number=booking_model.booking_number,
            customer_id=booking_model.customer_id,
            salesperson_id=booking_model.salesperson_id,
            status=status,
            subtotal_amount=booking_model.subtotal_amount,
            discount_amount=booking_model.discount_amount,
            discount_type=booking_model.discount_type,
            discount_value=booking_model.discount_value,
            tax_amount=booking_model.tax_amount,
            tax_rate=booking_model.tax_rate,
            total_amount=booking_model.total_amount,
            currency=booking_model.currency,
            payment_status=payment_status,
            due_balance=booking_model.due_balance,
            reserved_until=booking_model.reserved_until,
            cancelled_at=booking_model.cancelled_at,
            cancellation_reason=booking_model.cancellation_reason,
            created_at=booking_model.created_at,
            updated_at=booking_model.updated_at,
            version=booking_model.version,
        )
    
    @staticmethod
    def to_model(booking: Booking) -> tuple[BookingModel, List[BookingItemModel]]:
        """Convert domain entity to database models
        
        Args:
            booking: Booking domain entity with items
            
        Returns:
            Tuple of (BookingModel, List[BookingItemModel]) for database persistence
        """
        booking_model = BookingModel(
            id=booking.id,
            tenant_id=booking.tenant_id,
            booking_number=booking.booking_number,
            customer_id=booking.customer_id,
            salesperson_id=booking.salesperson_id,
            event_id=booking.event_id,
            status=booking.status.value if isinstance(booking.status, BookingStatusEnum) else booking.status,
            subtotal_amount=booking.subtotal_amount,
            discount_amount=booking.discount_amount,
            discount_type=booking.discount_type,
            discount_value=booking.discount_value,
            tax_amount=booking.tax_amount,
            tax_rate=booking.tax_rate,
            total_amount=booking.total_amount,
            currency=booking.currency,
            payment_status=booking.payment_status.value if booking.payment_status and isinstance(booking.payment_status, BookingPaymentStatusEnum) else booking.payment_status,
            due_balance=booking.due_balance,
            reserved_until=booking.reserved_until,
            cancelled_at=booking.cancelled_at,
            cancellation_reason=booking.cancellation_reason,
            version=booking.get_version(),
            created_at=booking.created_at,
            updated_at=booking.updated_at,
        )
        
        # Convert items
        item_models = []
        for item in booking.items:
            item_model = BookingItemModel(
                id=item.id,
                tenant_id=booking.tenant_id,
                booking_id=booking.id,
                event_seat_id=item.event_seat_id,
                ticket_id=item.ticket_id,
                section_name=item.section_name,
                row_name=item.row_name,
                seat_number=item.seat_number,
                unit_price=item.unit_price,
                total_price=item.total_price,
                currency=booking.currency,
                ticket_number=item.ticket_number,
                ticket_status=None,  # Will be set when ticket is created
                version=0,
                created_at=booking.created_at,
                updated_at=booking.updated_at,
            )
            item_models.append(item_model)
        
        return booking_model, item_models

