"""API mapper for Ticketing module"""
from app.domain.ticketing.organizer import Organizer
from app.presentation.api.ticketing.schemas_organizer import OrganizerResponse


class TicketingApiMapper:
    """Mapper for converting domain entities to API responses"""

    @staticmethod
    def organizer_to_response(organizer: Organizer) -> OrganizerResponse:
        return OrganizerResponse(
            id=organizer.id,
            tenant_id=organizer.tenant_id,
            code=organizer.code,
            name=organizer.name,

            is_active=organizer.is_active,
            created_at=organizer.created_at,
            updated_at=organizer.updated_at,
            deactivated_at=organizer.deactivated_at,
        )

