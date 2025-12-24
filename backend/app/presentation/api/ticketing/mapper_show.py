"""API mapper for Ticketing module"""
from app.domain.ticketing.show import Show
from app.presentation.api.ticketing.schemas_show import ShowResponse


class TicketingApiMapper:
    """Mapper for converting domain entities to API responses"""

    @staticmethod
    def show_to_response(show: Show) -> ShowResponse:
        return ShowResponse(
            id=show.id,
            tenant_id=show.tenant_id,
            code=show.code,
            name=show.name,
            organizer_id=show.organizer_id,
            is_active=show.is_active,
            started_date=show.started_date,
            ended_date=show.ended_date,
            note=show.note,
            created_at=show.created_at,
            updated_at=show.updated_at,
            deactivated_at=show.deactivated_at,
        )

