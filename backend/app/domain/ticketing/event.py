"""Event aggregate for Ticketing - Advanced CRUD with complex relationships."""
from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import Optional

from app.domain.aggregates.base import AggregateRoot
from app.shared.exceptions import BusinessRuleError, ValidationError
from app.shared.utils import generate_id
from app.shared.enums import EventStatusEnum, EventConfigurationTypeEnum


class Event(AggregateRoot):
    """Represents an event - specific occurrence / sellable instance."""

    def __init__(
        self,
        tenant_id: str,
        show_id: str,
        title: str,
        start_dt: datetime,
        duration_minutes: int,
        venue_id: str,
        status: EventStatusEnum = EventStatusEnum.DRAFT,
        layout_id: Optional[str] = None,
        event_id: Optional[str] = None,
        configuration_type: EventConfigurationTypeEnum = EventConfigurationTypeEnum.SEAT_SETUP,
        is_active: bool = True,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        version: int = 0,
    ):
        super().__init__()
        now = datetime.now(timezone.utc)
        self.id = event_id or generate_id()
        self.tenant_id = tenant_id
        self.show_id = show_id
        self.title = self._validate_title(title)
        self.start_dt = start_dt
        self.duration_minutes = self._validate_duration(duration_minutes)
        self.venue_id = venue_id
        self.layout_id = layout_id
        self.status = status
        self.configuration_type = configuration_type
        self.is_active = is_active
        self._version = version
        self.created_at = created_at or now
        self.updated_at = updated_at or now

        self._validate()

    def update_details(
        self,
        *,
        title: Optional[str] = None,
        start_dt: Optional[datetime] = None,
        duration_minutes: Optional[int] = None,
        venue_id: Optional[str] = None,
        layout_id: Optional[str] = None,

        status: Optional[EventStatusEnum] = None,
        configuration_type: Optional[EventConfigurationTypeEnum] = None,
    ) -> None:
        """Update event details with validation."""
        if title is not None:
            self.title = self._validate_title(title)
        if start_dt is not None:
            self.start_dt = start_dt
        if duration_minutes is not None:
            self.duration_minutes = self._validate_duration(duration_minutes)
        if venue_id is not None:
            self.venue_id = venue_id
        if layout_id is not None:
            self.layout_id = layout_id
        if status is not None:
            self.status = status
        if configuration_type is not None:
            self.configuration_type = configuration_type

        self._validate()
        self._touch()

    def activate(self) -> None:
        if self.is_active:
            return
        self.is_active = True
        self._touch()

    def deactivate(self) -> None:
        if not self.is_active:
            return
        self.is_active = False
        self._touch()

    def _validate_title(self, title: str) -> str:
        """Validate event title."""
        if not title or not title.strip():
            raise ValidationError("Event title is required")
        title = title.strip()
        if len(title) > 200:
            raise ValidationError("Event title cannot exceed 200 characters")
        return title

    def _validate_duration(self, duration_minutes: int) -> int:
        """Validate duration in minutes."""
        if duration_minutes < 1:
            raise ValidationError("Duration must be at least 1 minute")
        if duration_minutes > 1440:  # 24 hours
            raise ValidationError("Duration cannot exceed 1440 minutes (24 hours)")
        return duration_minutes

    @property
    def end_dt(self) -> datetime:
        """Calculate end datetime from start_dt and duration_minutes."""
        return self.start_dt + timedelta(minutes=self.duration_minutes)

    def _validate(self) -> None:
        """Validate event data and business rules."""
        if not self.show_id or not self.show_id.strip():
            raise ValidationError("Show ID is required")
        if not self.venue_id or not self.venue_id.strip():
            raise ValidationError("Venue ID is required")
        if self.start_dt.tzinfo is None:
            raise ValidationError("Start datetime must be timezone-aware")

    def _touch(self) -> None:
        self.updated_at = datetime.now(timezone.utc)
        self.increment_version()


def ensure_same_tenant(event: Event, tenant_id: str) -> None:
    if event.tenant_id != tenant_id:
        raise BusinessRuleError("Event tenant mismatch")

