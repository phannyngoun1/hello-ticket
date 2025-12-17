"""
Container and mediator registration for Audit module.

This module handles all dependency injection and mediator registrations
for the Audit infrastructure.
"""
from punq import Container
from app.infrastructure.shared.audit.async_audit_logger import AsyncAuditLogger
from app.infrastructure.shared.audit.audit_logger import AuditLogger, set_audit_logger
from app.infrastructure.shared.audit.user_activity_service import UserActivityService


def register_audit_container(container: Container) -> None:
    """
    Register all Audit-related dependencies in the container.
    
    This includes:
    - Audit logger (async, non-blocking)
    - User activity service
    
    Args:
        container: The Punq container to register dependencies in
    """
    # Register audit logger (async, non-blocking)
    audit_logger = AsyncAuditLogger(
        batch_size=50,
        flush_interval_seconds=2.0
    )
    container.register(AuditLogger, instance=audit_logger)
    container.register(AsyncAuditLogger, instance=audit_logger)
    
    # Set audit logger in global context
    set_audit_logger(audit_logger)
    
    # Register user activity service
    user_activity_service = UserActivityService(audit_logger)
    container.register(UserActivityService, instance=user_activity_service)
