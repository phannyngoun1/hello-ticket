"""Ticketing queries for Layout CQRS pattern."""
from dataclasses import dataclass


@dataclass
class GetLayoutByIdQuery:
    """Query to retrieve a layout by identifier."""

    layout_id: str


@dataclass
class GetLayoutsByVenueIdQuery:
    """Query to retrieve all layouts for a venue."""

    venue_id: str


@dataclass
class GetLayoutWithSeatsQuery:
    """Query to retrieve a layout with its seats in one request."""

    layout_id: str
