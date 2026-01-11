"""
Queries for EventSeat module.
"""
from dataclasses import dataclass
from typing import Optional
@dataclass
class GetEventSeatsQuery:
    """Query to get seats for an event"""
    event_id: str
    tenant_id: str
    skip: int = 0
    limit: int = 100

@dataclass
class GetEventSeatStatisticsQuery:
    """Query to get seat statistics for an event"""
    event_id: str
    tenant_id: str
