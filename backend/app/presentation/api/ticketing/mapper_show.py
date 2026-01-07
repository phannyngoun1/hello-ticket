"""API mapper for Ticketing module"""
from app.presentation.api.ticketing.schemas_show import ShowResponse, ShowOrganizerResponse
from app.domain.ticketing.show import Show
from app.domain.ticketing.organizer import Organizer
from typing import Optional


class TicketingApiMapper:
    """Mapper for converting domain entities to API responses"""

    @staticmethod
    def show_to_response(show: Show, organizer: Optional[Organizer] = None) -> ShowResponse:
        organizer_response = None
        if organizer:
            organizer_response = ShowOrganizerResponse(
                id=organizer.id,
                code=organizer.code,
                name=organizer.name
            )

        return ShowResponse(
            id=show.id,
            tenant_id=show.tenant_id,
            code=show.code,
            name=show.name,
            organizer_id=show.organizer_id,
            organizer=organizer_response,
            is_active=show.is_active,
            started_date=show.started_date,
            ended_date=show.ended_date,
            note=show.note,
            created_at=show.created_at,
            updated_at=show.updated_at,
            deactivated_at=show.deactivated_at,
        )

