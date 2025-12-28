"""Repository interfaces for Ticket domain."""
from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.ticketing.ticket import Ticket


class TicketRepository(ABC):
    """Repository interface for Ticket aggregate"""

    @abstractmethod
    async def get_by_id(self, tenant_id: str, ticket_id: str) -> Optional[Ticket]:
        """Get ticket by ID"""
        pass

    @abstractmethod
    async def get_by_ticket_number(self, tenant_id: str, ticket_number: str) -> Optional[Ticket]:
        """Get ticket by ticket number"""
        pass

    @abstractmethod
    async def get_by_event_seat(self, tenant_id: str, event_seat_id: str) -> Optional[Ticket]:
        """Get ticket by event seat ID"""
        pass

    @abstractmethod
    async def get_by_event(self, tenant_id: str, event_id: str, skip: int = 0, limit: int = 100) -> tuple[List[Ticket], int]:
        """Get tickets for an event with pagination. Returns (tickets, total_count)"""
        pass

    @abstractmethod
    async def get_by_booking(self, tenant_id: str, booking_id: str) -> List[Ticket]:
        """Get all tickets for a booking"""
        pass

    @abstractmethod
    async def save(self, ticket: Ticket) -> Ticket:
        """Save ticket (create or update)"""
        pass

    @abstractmethod
    async def save_all(self, tickets: List[Ticket]) -> List[Ticket]:
        """Save multiple tickets"""
        pass

    @abstractmethod
    async def delete(self, tenant_id: str, ticket_id: str) -> bool:
        """Delete ticket"""
        pass

