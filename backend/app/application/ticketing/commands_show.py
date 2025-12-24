"""Ticketing commands for CQRS pattern"""
from dataclasses import dataclass
from datetime import date
from typing import Optional


@dataclass
class CreateShowCommand:
    """Command to create a new show"""

    name: str
    code: Optional[str] = None
    organizer_id: Optional[str] = None
    started_date: Optional[date] = None
    ended_date: Optional[date] = None
    note: Optional[str] = None


@dataclass
class UpdateShowCommand:
    """Command to update show details"""

    show_id: str
    name: Optional[str] = None
    code: Optional[str] = None
    organizer_id: Optional[str] = None
    started_date: Optional[date] = None
    ended_date: Optional[date] = None
    note: Optional[str] = None


@dataclass
class DeleteShowCommand:
    """Command to remove a show (soft-delete only)"""

    show_id: str



