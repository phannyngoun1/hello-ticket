"""
Base integration patterns and interfaces
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Type, TypeVar
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum

T = TypeVar('T')
import logging

logger = logging.getLogger(__name__)


class IntegrationStatus(Enum):
    """Integration status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"
    MAINTENANCE = "maintenance"


class MessageStatus(Enum):
    """Message processing status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRY = "retry"


@dataclass
class IntegrationMessage:
    """Base integration message"""
    message_id: str
    source_system: str
    target_system: str
    message_type: str
    payload: Dict[str, Any]
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    status: MessageStatus = MessageStatus.PENDING
    retry_count: int = 0
    max_retries: int = 3
    error_message: Optional[str] = None
    processed_at: Optional[datetime] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "message_id": self.message_id,
            "source_system": self.source_system,
            "target_system": self.target_system,
            "message_type": self.message_type,
            "payload": self.payload,
            "created_at": self.created_at.isoformat(),
            "status": self.status.value,
            "retry_count": self.retry_count,
            "max_retries": self.max_retries,
            "error_message": self.error_message,
            "processed_at": self.processed_at.isoformat() if self.processed_at else None
        }


class IntegrationAdapter(ABC):
    """Base integration adapter"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.status = IntegrationStatus.ACTIVE
    
    @abstractmethod
    async def connect(self) -> bool:
        """Establish connection to external system"""
        pass
    
    @abstractmethod
    async def disconnect(self) -> None:
        """Disconnect from external system"""
        pass
    
    @abstractmethod
    async def send_message(self, message: IntegrationMessage) -> bool:
        """Send message to external system"""
        pass
    
    @abstractmethod
    async def receive_messages(self) -> List[IntegrationMessage]:
        """Receive messages from external system"""
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Check integration health"""
        pass


class MessageQueue(ABC):
    """Abstract message queue interface"""
    
    @abstractmethod
    async def publish(self, topic: str, message: IntegrationMessage) -> None:
        """Publish message to topic"""
        pass
    
    @abstractmethod
    async def subscribe(self, topic: str, handler: callable) -> None:
        """Subscribe to topic"""
        pass
    
    @abstractmethod
    async def consume(self, topic: str, timeout: int = 30) -> Optional[IntegrationMessage]:
        """Consume message from topic"""
        pass


class IntegrationRegistry:
    """Registry for integration adapters"""
    
    def __init__(self):
        self._adapters: Dict[str, IntegrationAdapter] = {}
        self._message_handlers: Dict[str, List[callable]] = {}
    
    def register_adapter(self, name: str, adapter: IntegrationAdapter) -> None:
        """Register integration adapter"""
        self._adapters[name] = adapter
    
    def get_adapter(self, name: str) -> Optional[IntegrationAdapter]:
        """Get integration adapter by name"""
        return self._adapters.get(name)
    
    def register_message_handler(self, message_type: str, handler: callable) -> None:
        """Register message handler for specific message type"""
        if message_type not in self._message_handlers:
            self._message_handlers[message_type] = []
        self._message_handlers[message_type].append(handler)
    
    def get_message_handlers(self, message_type: str) -> List[callable]:
        """Get message handlers for specific message type"""
        return self._message_handlers.get(message_type, [])
    
    async def process_message(self, message: IntegrationMessage) -> None:
        """Process message using registered handlers"""
        handlers = self.get_message_handlers(message.message_type)
        
        for handler in handlers:
            try:
                await handler(message)
            except Exception as e:
                logger.error(f"Error processing message {message.message_id}: {e}")
    
    async def health_check_all(self) -> Dict[str, bool]:
        """Check health of all registered adapters"""
        results = {}
        for name, adapter in self._adapters.items():
            try:
                results[name] = await adapter.health_check()
            except Exception as e:
                results[name] = False
                logger.error(f"Health check failed for {name}: {e}")
        return results


# Global integration registry
integration_registry = IntegrationRegistry()
