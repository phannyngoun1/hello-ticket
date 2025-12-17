"""
Helper module for publishing domain events from aggregates.

This module provides utilities to publish uncommitted events from aggregates
after they are successfully persisted.
"""
import logging
from typing import List
from app.domain.aggregates.base import AggregateRoot
from app.domain.shared.events.base import DomainEvent
from app.application.shared.event_handlers.domain_event_handler import event_bus

logger = logging.getLogger(__name__)


async def publish_aggregate_events(aggregate: AggregateRoot) -> None:
    """
    Publish all uncommitted events from an aggregate and mark them as committed.
    
    This should be called after successfully persisting an aggregate to ensure
    events are only published if the transaction succeeds.
    
    Args:
        aggregate: The aggregate root that may have uncommitted events
    """
    events = aggregate.get_uncommitted_events()
    
    if not events:
        return
    
    logger.debug(
        f"Publishing {len(events)} uncommitted events from {aggregate.__class__.__name__}"
    )
    
    # Publish each event
    for event in events:
        try:
            await event_bus.publish(event)
            logger.debug(f"Published event: {event.event_type()} (id: {event.event_id})")
        except Exception as e:
            # Log error but continue with other events
            logger.error(
                f"Failed to publish event {event.event_type()} (id: {event.event_id}): {e}",
                exc_info=True
            )
    
    # Mark events as committed after successful publication
    aggregate.mark_events_as_committed()


async def publish_events(events: List[DomainEvent]) -> None:
    """
    Publish a list of domain events directly.
    
    Useful when you have events that aren't attached to an aggregate.
    
    Args:
        events: List of domain events to publish
    """
    if not events:
        return
    
    logger.debug(f"Publishing {len(events)} domain events")
    
    for event in events:
        try:
            await event_bus.publish(event)
            logger.debug(f"Published event: {event.event_type()} (id: {event.event_id})")
        except Exception as e:
            logger.error(
                f"Failed to publish event {event.event_type()} (id: {event.event_id}): {e}",
                exc_info=True
            )

