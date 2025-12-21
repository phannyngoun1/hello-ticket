"""Ticketing seat queries for CQRS pattern"""
from dataclasses import dataclass


@dataclass
class GetSeatByIdQuery:
    """Query to retrieve a seat by identifier."""

    seat_id: str


@dataclass
class GetSeatsByVenueQuery:
    """Query to retrieve all seats for a venue."""

    venue_id: str
    skip: int = 0
    limit: int = 1000


@dataclass
class GetSeatsByLayoutQuery:
    """Query to retrieve all seats for a layout."""

    layout_id: str
    skip: int = 0
    limit: int = 1000


@dataclass
class GetSeatByLocationQuery:
    """Query to retrieve a seat by venue and location."""

    venue_id: str
    section_id: str
    row: str
    seat_number: str
