"""Dashboard analytics routes."""
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.application.shared.queries_dashboard import (
    GetDashboardAnalyticsQuery,
    GetEventAnalyticsQuery,
    GetRevenueAnalyticsQuery,
)
from app.presentation.shared.dependencies import get_mediator_dependency
from app.shared.mediator import Mediator

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


class DashboardAnalyticsResponse(BaseModel):
    """Response model for dashboard analytics."""

    total_events: int
    upcoming_events: int
    active_events: int
    events_this_month: int
    event_status_breakdown: dict

    total_bookings: int
    bookings_this_month: int
    total_revenue: float
    revenue_this_month: float
    average_ticket_price: float
    booking_status_breakdown: dict

    total_customers: int
    new_customers_this_month: int
    active_customers: int

    total_users: int
    active_users: int

    recent_events: list
    recent_bookings: list
    recent_payments: list

    events_growth: float
    bookings_growth: float
    revenue_growth: float
    customers_growth: float

    top_events_by_bookings: list
    top_shows_by_revenue: list
    top_venues_by_events: list


@router.get("/analytics", response_model=DashboardAnalyticsResponse)
async def get_dashboard_analytics(
    start_date: Optional[datetime] = Query(None, description="Start date for analytics"),
    end_date: Optional[datetime] = Query(None, description="End date for analytics"),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """
    Get comprehensive dashboard analytics.

    Returns aggregated metrics for events, bookings, customers, and revenue.
    """
    query = GetDashboardAnalyticsQuery(
        start_date=start_date,
        end_date=end_date,
    )

    result = await mediator.query(query)
    return DashboardAnalyticsResponse(**result.__dict__)


@router.get("/analytics/events/{event_id}")
async def get_event_analytics(
    event_id: str,
    start_date: Optional[datetime] = Query(None, description="Start date for analytics"),
    end_date: Optional[datetime] = Query(None, description="End date for analytics"),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """
    Get detailed analytics for a specific event.

    Includes booking trends, revenue, capacity utilization, and demographics.
    """
    query = GetEventAnalyticsQuery(
        event_id=event_id,
        start_date=start_date,
        end_date=end_date,
    )

    result = await mediator.query(query)
    return result


@router.get("/analytics/revenue")
async def get_revenue_analytics(
    start_date: Optional[datetime] = Query(None, description="Start date for analytics"),
    end_date: Optional[datetime] = Query(None, description="End date for analytics"),
    group_by: str = Query("month", description="Group by period: day, week, month, year"),
    mediator: Mediator = Depends(get_mediator_dependency),
):
    """
    Get revenue analytics over time.

    Returns time series data for revenue, bookings, and growth metrics.
    """
    query = GetRevenueAnalyticsQuery(
        start_date=start_date,
        end_date=end_date,
        group_by=group_by,
    )

    result = await mediator.query(query)
    return result
