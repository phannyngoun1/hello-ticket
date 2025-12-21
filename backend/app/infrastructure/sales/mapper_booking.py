"""
Booking mapper - handles conversion between domain entities and database models
"""
from typing import Optional
from app.domain.sales.booking import Booking
from app.infrastructure.shared.database.models import BookingModel


class BookingMapper:
    """Mapper for Booking entity to BookingModel conversion"""
    
    @staticmethod
    def to_domain(model: BookingModel) -> Booking:
        """Convert database model to domain entity
        
        Args:
            model: BookingModel from database
            
        Returns:
            Booking domain entity
        """
        return Booking(
            tenant_id=model.tenant_id,
            code=model.code,
            name=model.name,
            booking_id=model.id,
            is_active=model.is_active,
            created_at=model.created_at,
            updated_at=model.updated_at,
            version=model.version,
        )
    
    @staticmethod
    def to_model(booking: Booking) -> BookingModel:
        """Convert domain entity to database model
        
        Args:
            booking: Booking domain entity
            
        Returns:
            BookingModel for database persistence
        """
        return BookingModel(
            id=booking.id,
            tenant_id=booking.tenant_id,
            code=booking.code,
            name=booking.name,
            is_active=booking.is_active,
            version=booking.get_version(),
            created_at=booking.created_at,
            updated_at=booking.updated_at,
        )

