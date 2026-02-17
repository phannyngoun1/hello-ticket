"""
Audit logging for compliance and tracking
"""
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field
from enum import Enum
from app.shared.utils import generate_id
import logging

logger = logging.getLogger(__name__)


class AuditEventType(Enum):
    """Types of audit events"""
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    READ = "read"
    LOGIN = "login"
    LOGOUT = "logout"
    PASSWORD_CHANGE = "password_change"
    ACCOUNT_LOCK = "account_lock"
    ACCOUNT_UNLOCK = "account_unlock"
    ACCOUNT_ACTIVATE = "account_activate"
    ACCOUNT_DEACTIVATE = "account_deactivate"
    PERMISSION_CHANGE = "permission_change"
    DATA_EXPORT = "data_export"
    DATA_IMPORT = "data_import"
    SYSTEM_CHANGE = "system_change"


class AuditSeverity(Enum):
    """Audit event severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class AuditLogEvent:
    """Audit event record"""
    event_id: str = field(default_factory=generate_id)
    event_timestamp: Optional[datetime] = None  # When the actual event occurred
    event_type: AuditEventType = AuditEventType.READ
    severity: AuditSeverity = AuditSeverity.LOW
    
    # Tenant (set at creation so flush can use it when request context is gone)
    tenant_id: Optional[str] = None
    
    # Entity information
    entity_type: str = ""
    entity_id: str = ""
    
    # Parent entity information (for hierarchical relationships like event -> show)
    parent_entity_type: Optional[str] = None
    parent_entity_id: Optional[str] = None
    
    # User information
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    session_id: Optional[str] = None
    
    # Request information
    request_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    
    # Change information
    old_values: Dict[str, Any] = field(default_factory=dict)
    new_values: Dict[str, Any] = field(default_factory=dict)
    changed_fields: List[str] = field(default_factory=list)
    
    # Additional context
    description: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    # Compliance fields
    retention_period_days: int = 2555  # 7 years default
    is_pii: bool = False  # Contains personally identifiable information
    is_sensitive: bool = False  # Contains sensitive business data
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage"""
        return {
            "event_id": self.event_id,
            "event_timestamp": self.event_timestamp.isoformat() if self.event_timestamp else None,
            "event_type": self.event_type.value,
            "severity": self.severity.value,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "parent_entity_type": self.parent_entity_type,
            "parent_entity_id": self.parent_entity_id,
            "user_id": self.user_id,
            "user_email": self.user_email,
            "session_id": self.session_id,
            "request_id": self.request_id,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "old_values": self.old_values,
            "new_values": self.new_values,
            "changed_fields": self.changed_fields,
            "description": self.description,
            "metadata": self.metadata,
            "retention_period_days": self.retention_period_days,
            "is_pii": self.is_pii,
            "is_sensitive": self.is_sensitive
        }


class AuditLogger(ABC):
    """Abstract audit logger"""
    
    @abstractmethod
    async def log_event(self, event: AuditLogEvent) -> None:
        """Log an audit event"""
        pass
    
    @abstractmethod
    async def get_events(
        self,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        user_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100
    ) -> List[AuditLogEvent]:
        """Retrieve audit events"""
        pass


class DatabaseAuditLogger(AuditLogger):
    """Database implementation of audit logger"""
    
    def __init__(self, session):
        self.session = session
    
    async def log_event(self, event: AuditLogEvent) -> None:
        """Log audit event to database"""
        # In a real implementation, this would save to a dedicated audit table
        logger.info(f"Audit Log: {event.event_type.value} - {event.entity_type}:{event.entity_id}")
        logger.info(f"  User: {event.user_email} ({event.user_id})")
        logger.info(f"  Event Timestamp: {event.event_timestamp}")
        logger.info(f"  Description: {event.description}")
        if event.changed_fields:
            logger.info(f"  Changed fields: {', '.join(event.changed_fields)}")
    
    async def get_events(
        self,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        user_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100
    ) -> List[AuditLogEvent]:
        """Retrieve audit events from database"""
        # In a real implementation, this would query the audit table
        return []


class AuditContext:
    """Context for audit logging"""
    
    def __init__(
        self,
        user_id: Optional[str] = None,
        user_email: Optional[str] = None,
        session_id: Optional[str] = None,
        request_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ):
        self.user_id = user_id
        self.user_email = user_email
        self.session_id = session_id
        self.request_id = request_id
        self.ip_address = ip_address
        self.user_agent = user_agent
    
    def create_event(
        self,
        event_type: AuditEventType,
        entity_type: str,
        entity_id: str,
        description: str = "",
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None,
        severity: AuditSeverity = AuditSeverity.LOW,
        parent_entity_type: Optional[str] = None,
        parent_entity_id: Optional[str] = None
    ) -> AuditLogEvent:
        """Create audit event with context"""
        from app.shared.tenant_context import get_tenant_context
        event = AuditLogEvent(
            event_type=event_type,
            severity=severity,
            tenant_id=get_tenant_context(),
            entity_type=entity_type,
            entity_id=entity_id,
            parent_entity_type=parent_entity_type,
            parent_entity_id=parent_entity_id,
            user_id=self.user_id,
            user_email=self.user_email,
            session_id=self.session_id,
            request_id=self.request_id,
            ip_address=self.ip_address,
            user_agent=self.user_agent,
            old_values=old_values or {},
            new_values=new_values or {},
            description=description
        )
        
        # Determine changed fields
        if old_values and new_values:
            event.changed_fields = [
                field for field in new_values.keys()
                if field in old_values and old_values[field] != new_values[field]
            ]
        
        return event


# Context variable for thread-safe audit context
from contextvars import ContextVar

_audit_context_var: ContextVar[Optional[AuditContext]] = ContextVar(
    'audit_context',
    default=None
)
_audit_logger_var: ContextVar[Optional[AuditLogger]] = ContextVar(
    'audit_logger',
    default=None
)


def set_audit_context(context: AuditContext) -> None:
    """Set audit context in context variable (thread-safe)"""
    _audit_context_var.set(context)


def set_audit_logger(logger: AuditLogger) -> None:
    """Set audit logger in context variable (thread-safe)"""
    _audit_logger_var.set(logger)


async def create_audit_event(
    event_type: AuditEventType,
    entity_type: str,
    entity_id: str,
    description: str = "",
    old_values: Optional[Dict[str, Any]] = None,
    new_values: Optional[Dict[str, Any]] = None,
    severity: AuditSeverity = AuditSeverity.LOW,
    changed_fields: Optional[List[str]] = None,
    parent_entity_type: Optional[str] = None,
    parent_entity_id: Optional[str] = None
) -> AuditLogEvent:
    """
    Create audit event with automatic context detection.

    Automatically uses request context when available (HTTP requests),
    or falls back to system-generated values for background operations.
    
    Args:
        event_type: Type of audit event (CREATE, UPDATE, DELETE, etc.)
        entity_type: Type of entity being audited (e.g., "event", "show", "user")
        entity_id: ID of the entity being audited
        description: Human-readable description of the action
        old_values: Previous values before the change
        new_values: New values after the change
        severity: Severity level of the event
        changed_fields: List of fields that were changed
        parent_entity_type: Type of parent entity (e.g., "show" for events)
        parent_entity_id: ID of parent entity (e.g., show_id for events)
    """
    from datetime import datetime, timezone
    context = get_audit_context()

    if context:
        # Use request context for rich audit data
        audit_event = context.create_event(
            event_type=event_type,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            old_values=old_values,
            new_values=new_values,
            severity=severity,
            parent_entity_type=parent_entity_type,
            parent_entity_id=parent_entity_id
        )
        # Override changed_fields if provided
        if changed_fields is not None:
            audit_event.changed_fields = changed_fields
        # Set event_timestamp to when the business event occurred
        audit_event.event_timestamp = datetime.now(timezone.utc)
    else:
        # Fallback for non-HTTP contexts (background jobs, system operations)
        from app.shared.utils import generate_id

        from app.shared.tenant_context import get_tenant_context
        audit_event = AuditLogEvent(
            event_id=generate_id(),
            event_timestamp=datetime.now(timezone.utc),  # When business event occurred
            event_type=event_type,
            severity=severity,
            tenant_id=get_tenant_context(),
            entity_type=entity_type,
            entity_id=entity_id,
            parent_entity_type=parent_entity_type,
            parent_entity_id=parent_entity_id,
            description=description,
            old_values=old_values or {},
            new_values=new_values or {},
            changed_fields=changed_fields or [],
            metadata={"logged_without_request_context": True}
        )

    return audit_event


async def log_audit_event(event: AuditLogEvent) -> None:
    """Log audit event using logger from context"""
    audit_logger = _audit_logger_var.get()
    if audit_logger:
        await audit_logger.log_event(event)
    else:
        logger.debug(
            "Audit event not logged: no audit logger in context (middleware may not have set it)"
        )


def get_audit_context() -> Optional[AuditContext]:
    """Get current audit context from context variable (thread-safe)"""
    return _audit_context_var.get()
