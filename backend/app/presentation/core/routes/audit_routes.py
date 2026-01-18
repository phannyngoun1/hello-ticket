"""
Audit log API routes for querying user activity and audit events
"""
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel

from app.presentation.core.dependencies.auth_dependencies import get_current_active_user
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import UserRole
from app.shared.container import container
from app.infrastructure.shared.audit.user_activity_service import UserActivityService
from app.infrastructure.shared.audit.audit_logger import AuditLogEvent
from app.infrastructure.shared.audit.async_audit_logger import AsyncAuditLogger

router = APIRouter(prefix="/audit", tags=["audit"])


class AuditEventResponse(BaseModel):
    """Audit event response model"""
    event_id: str
    event_timestamp: Optional[datetime]
    event_type: str
    severity: str
    entity_type: str
    entity_id: str
    parent_entity_type: Optional[str] = None
    parent_entity_id: Optional[str] = None
    user_id: Optional[str]
    user_email: Optional[str]
    session_id: Optional[str]
    request_id: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    description: str
    metadata: dict
    # Change tracking fields
    old_values: Optional[dict] = None
    new_values: Optional[dict] = None
    changed_fields: Optional[List[str]] = None

    class Config:
        from_attributes = True


class AuditEventListResponse(BaseModel):
    """Audit events list response model"""
    items: List[AuditEventResponse]
    total: int
    has_next: bool
    skip: int
    limit: int


class ActivitySummaryResponse(BaseModel):
    """Activity summary response model"""
    user_id: str
    period_days: int
    total_events: int
    by_event_type: dict


@router.get("/user-activity", response_model=AuditEventListResponse)
async def get_user_activity(
    user_id: Optional[str] = Query(None, description="User ID (default: current user)"),
    entity_id: Optional[str] = Query(None, description="Entity ID to query activities for (e.g., user ID for login/logout events)"),
    entity_type: Optional[str] = Query("user", description="Entity type to query (default: 'user')"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of events"),
    skip: int = Query(0, ge=0, description="Number of events to skip"),
    event_types: Optional[str] = Query(None, description="Comma-separated event types"),
    hours: Optional[int] = Query(None, ge=1, le=8760, description="Last N hours"),
    start_date: Optional[datetime] = Query(None, description="Start date"),
    end_date: Optional[datetime] = Query(None, description="End date"),
    sort_by: str = Query("event_timestamp", description="Field to sort by (event_timestamp, event_type, severity, user_email, description)"),
    sort_order: str = Query("desc", description="Sort order (asc, desc)"),
    current_user: AuthenticatedUser = Depends(get_current_active_user),
    activity_service: UserActivityService = Depends(lambda: container.resolve(UserActivityService))
):
    """
    Get user activity logs

    Query modes:
    1. By entity_id (recommended for viewing user activities):
       - Query activities by entity_id and entity_type (e.g., all login/logout events for a user)
       - Use entity_id and entity_type parameters
       - Returns all activities related to that entity (login, logout, account changes, etc.)

    2. By user_id (activities performed BY a user):
       - Query activities performed BY the viewing user (current logged-in user)
       - Returns activities done BY the user, not activities done ON the user
       - Supports filtering by event types, date range, or hours

    If both entity_id and user_id are provided, entity_id takes precedence.

    Sorting:
    - sort_by: event_timestamp, event_type, severity, user_email, description
    - sort_order: asc, desc
    """
    # Validate sort parameters
    valid_sort_fields = ["event_timestamp", "event_type", "severity", "user_email", "description"]
    if sort_by not in valid_sort_fields:
        sort_by = "event_timestamp"

    if sort_order not in ["asc", "desc"]:
        sort_order = "desc"

    # Parse event types
    event_types_list = None
    if event_types:
        event_types_list = [e.strip() for e in event_types.split(",")]

    # Query by entity_id if provided (preferred for viewing user activities)
    if entity_id:
        # Calculate start_date from hours if provided
        calculated_start_date = start_date
        if hours and not start_date:
            from datetime import timedelta, timezone
            calculated_start_date = datetime.now(timezone.utc) - timedelta(hours=hours)

        # Query activities for the entity
        events = await activity_service.get_entity_activity(
            entity_type=entity_type,
            entity_id=entity_id,
            limit=limit + skip,  # Get extra to handle skip
            event_types=event_types_list,
            start_date=calculated_start_date,
            end_date=end_date,
            sort_by=sort_by,
            sort_order=sort_order
        )
    else:
        # Fall back to querying by user_id (activities performed BY the user)
        actor_user_id = user_id or current_user.id

        if hours:
            # Use recent activity method
            events = await activity_service.get_recent_activity(
                user_id=actor_user_id,
                hours=hours,
                limit=limit + skip,  # Get extra to handle skip
                sort_by=sort_by,
                sort_order=sort_order
            )
        else:
            # Use general activity method
            events = await activity_service.get_user_activity(
                user_id=actor_user_id,
                limit=limit + skip,  # Get extra to handle skip
                event_types=event_types_list,
                start_date=start_date,
                end_date=end_date,
                sort_by=sort_by,
                sort_order=sort_order
            )

        # If user_id is provided and different from current user, filter to show only activities related to that user
        if user_id and user_id != current_user.id:
            # Filter events where entity_type is "user" and entity_id matches the specified user_id
            # This shows activities like "Admin activated user X" when viewing user X's profile
            events = [
                event for event in events
                if (event.entity_type == "user" and event.entity_id == user_id)
                or event.user_id == user_id  # Also include direct actions on that user
            ]

    # Apply skip and limit after fetching
    total_events = len(events)
    paginated_events = events[skip:skip + limit] if skip < total_events else []

    # Convert to response models
    items = [
        AuditEventResponse(
            event_id=event.event_id,
            event_timestamp=event.event_timestamp,
            event_type=event.event_type.value,
            severity=event.severity.value,
            entity_type=event.entity_type,
            entity_id=event.entity_id,
            parent_entity_type=event.parent_entity_type,
            parent_entity_id=event.parent_entity_id,
            user_id=event.user_id,
            user_email=event.user_email,
            session_id=event.session_id,
            request_id=event.request_id,
            ip_address=str(event.ip_address) if event.ip_address else None,
            user_agent=event.user_agent,
            description=event.description,
            metadata=event.metadata,
            old_values=event.old_values if event.old_values else None,
            new_values=event.new_values if event.new_values else None,
            changed_fields=event.changed_fields if event.changed_fields else None
        )
        for event in paginated_events
    ]

    return AuditEventListResponse(
        items=items,
        total=total_events,
        has_next=(skip + limit) < total_events,
        skip=skip,
        limit=limit
    )


@router.get("/login-history", response_model=List[AuditEventResponse])
async def get_login_history(
    user_id: Optional[str] = Query(None, description="User ID filter (shows login history of viewing user)"),
    limit: int = Query(50, ge=1, le=500, description="Maximum number of login events"),
    current_user: AuthenticatedUser = Depends(get_current_active_user),
    activity_service: UserActivityService = Depends(lambda: container.resolve(UserActivityService))
):
    """
    Get login history for the viewing user
    
    Returns login events performed BY the viewing user (current logged-in user).
    Login events are actions done by the user themselves, so this returns their own login history.
    """
    # Login history is always for the viewing user (they logged themselves in)
    events = await activity_service.get_login_history(
        user_id=current_user.id,
        limit=limit
    )
    
    return [
        AuditEventResponse(
            event_id=event.event_id,
            event_timestamp=event.event_timestamp,
            event_type=event.event_type.value,
            severity=event.severity.value,
            entity_type=event.entity_type,
            entity_id=event.entity_id,
            parent_entity_type=event.parent_entity_type,
            parent_entity_id=event.parent_entity_id,
            user_id=event.user_id,
            user_email=event.user_email,
            session_id=event.session_id,
            request_id=event.request_id,
            ip_address=str(event.ip_address) if event.ip_address else None,
            user_agent=event.user_agent,
            description=event.description,
            metadata=event.metadata,
            old_values=event.old_values if event.old_values else None,
            new_values=event.new_values if event.new_values else None,
            changed_fields=event.changed_fields if event.changed_fields else None
        )
        for event in events
    ]


@router.get("/activity-summary", response_model=ActivitySummaryResponse)
async def get_activity_summary(
    user_id: Optional[str] = Query(None, description="User ID filter (unused - always shows viewing user's activity)"),
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: AuthenticatedUser = Depends(get_current_active_user),
    activity_service: UserActivityService = Depends(lambda: container.resolve(UserActivityService))
):
    """
    Get activity summary statistics for the viewing user
    
    Returns summary of activities performed BY the viewing user (current logged-in user).
    """
    summary = await activity_service.get_activity_summary(
        user_id=current_user.id,
        days=days
    )
    
    return ActivitySummaryResponse(**summary)


@router.get("/session-activity", response_model=List[AuditEventResponse])
async def get_session_activity(
    session_id: str = Query(..., description="Session ID"),
    limit: int = Query(200, ge=1, le=1000, description="Maximum number of events"),
    current_user: AuthenticatedUser = Depends(get_current_active_user),
    activity_service: UserActivityService = Depends(lambda: container.resolve(UserActivityService))
):
    """
    Get all activity for a specific session
    
    Returns all audit events that occurred during a session, in chronological order.
    """
    events = await activity_service.get_session_activity(
        session_id=session_id,
        limit=limit
    )
    
    # Check permissions - users can only see their own sessions
    if events and events[0].user_id != current_user.id and current_user.role.value != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view activity for your own sessions"
        )
    
    return [
        AuditEventResponse(
            event_id=event.event_id,
            event_timestamp=event.event_timestamp,
            event_type=event.event_type.value,
            severity=event.severity.value,
            entity_type=event.entity_type,
            entity_id=event.entity_id,
            parent_entity_type=event.parent_entity_type,
            parent_entity_id=event.parent_entity_id,
            user_id=event.user_id,
            user_email=event.user_email,
            session_id=event.session_id,
            request_id=event.request_id,
            ip_address=str(event.ip_address) if event.ip_address else None,
            user_agent=event.user_agent,
            description=event.description,
            metadata=event.metadata,
            old_values=event.old_values if event.old_values else None,
            new_values=event.new_values if event.new_values else None,
            changed_fields=event.changed_fields if event.changed_fields else None
        )
        for event in events
    ]

