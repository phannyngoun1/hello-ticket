"""
Base domain event classes
"""
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any, Dict, List
from dataclasses import dataclass, field
from app.shared.utils import generate_id


@dataclass
class DomainEvent(ABC):
    """Base domain event"""
    event_id: str = field(default_factory=generate_id)
    occurred_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    version: int = field(default=1)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    @abstractmethod
    def event_type(self) -> str:
        """Return the event type"""
        pass


@dataclass
class EventStream:
    """Collection of domain events"""
    events: List[DomainEvent] = field(default_factory=list)
    
    def add_event(self, event: DomainEvent) -> None:
        """Add event to stream"""
        self.events.append(event)
    
    def clear_events(self) -> None:
        """Clear all events"""
        self.events.clear()
    
    def has_events(self) -> bool:
        """Check if stream has events"""
        return len(self.events) > 0

