"""Ticket mapper for Ticketing - Translates between domain and database models."""
from app.domain.ticketing.ticket import Ticket
from app.infrastructure.shared.database.models import TicketModel
from app.shared.enums import TicketStatusEnum


class TicketMapper:
    """Mapper for translating between Ticket domain and database models"""

    @staticmethod
    def to_domain(model: TicketModel) -> Ticket:
        """Convert database model to domain aggregate"""
        return Ticket(
            tenant_id=model.tenant_id,
            event_id=model.event_id,
            event_seat_id=model.event_seat_id,
            ticket_number=model.ticket_number,
            status=TicketStatusEnum(model.status),
            price=getattr(model, 'price', 0.0),  # Fallback to 0.0 for backward compatibility
            currency=model.currency,
            booking_id=model.booking_id,
            barcode=model.barcode,
            qr_code=model.qr_code,
            transfer_token=model.transfer_token,
            reserved_at=model.reserved_at,
            reserved_until=model.reserved_until,
            expires_at=model.expires_at,
            scanned_at=model.scanned_at,
            issued_at=model.issued_at,
            ticket_id=model.id,
            created_at=model.created_at,
            updated_at=model.updated_at,
            version=model.version,
        )

    @staticmethod
    def to_model(domain: Ticket) -> TicketModel:
        """Convert domain aggregate to database model"""
        return TicketModel(
            id=domain.id,
            tenant_id=domain.tenant_id,
            event_id=domain.event_id,
            event_seat_id=domain.event_seat_id,
            ticket_number=domain.ticket_number,
            status=domain.status.value,
            price=domain.price,
            currency=domain.currency,
            booking_id=domain.booking_id,
            barcode=domain.barcode,
            qr_code=domain.qr_code,
            transfer_token=domain.transfer_token,
            reserved_at=domain.reserved_at,
            reserved_until=domain.reserved_until,
            expires_at=domain.expires_at,
            scanned_at=domain.scanned_at,
            issued_at=domain.issued_at,
            version=domain.version,
            created_at=domain.created_at,
            updated_at=domain.updated_at,
        )

