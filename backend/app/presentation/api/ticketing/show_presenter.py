"""Show presenter for Ticketing API"""
from typing import Optional

from app.domain.ticketing.show import Show
from app.domain.ticketing.organizer import Organizer
from app.presentation.api.ticketing.schemas_show import ShowResponse, ShowOrganizerResponse
from app.presentation.api.shared.presenter import BasePresenter


class ShowPresenter(BasePresenter[Show, ShowResponse]):
    """Presenter for converting Show domain entities to API responses"""

    def to_response(self, show: Show, organizer: Optional[Organizer] = None) -> ShowResponse:
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
