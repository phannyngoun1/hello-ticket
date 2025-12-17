"""
Base aggregate class
"""
from abc import ABC
from typing import Any, Dict, List
from app.domain.shared.events.base import DomainEvent, EventStream


class AggregateRoot(ABC):
    """Base aggregate root class"""
    
    def __init__(self):
        self._event_stream = EventStream()
        self._version = 0
    
    def add_event(self, event: DomainEvent) -> None:
        """Add domain event to the aggregate"""
        self._event_stream.add_event(event)
    
    def get_uncommitted_events(self) -> List[DomainEvent]:
        """Get uncommitted events"""
        return self._event_stream.events.copy()
    
    def mark_events_as_committed(self) -> None:
        """Mark events as committed"""
        self._event_stream.clear_events()
    
    def get_version(self) -> int:
        """Get aggregate version"""
        return self._version
    
    def increment_version(self) -> None:
        """Increment aggregate version"""
        self._version += 1

