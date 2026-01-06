"""Dashboard analytics queries for data insights."""
from dataclasses import dataclass
from typing import Optional, Dict, List
from datetime import datetime


@dataclass
class GetDashboardAnalyticsQuery:
    """Query to retrieve comprehensive dashboard analytics."""

    # Optional filters for date ranges, etc.
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


@dataclass
class DashboardAnalyticsData:
    """Data structure for dashboard analytics response."""

    # Event metrics
    total_events: int
    upcoming_events: int
    active_events: int
    events_this_month: int
    event_status_breakdown: Dict[str, int]

    # Booking/Sales metrics
    total_bookings: int
    bookings_this_month: int
    total_revenue: float
    revenue_this_month: float
    average_ticket_price: float
    booking_status_breakdown: Dict[str, int]

    # Customer metrics
    total_customers: int
    new_customers_this_month: int
    active_customers: int

    # User metrics (if applicable)
    total_users: int
    active_users: int

    # Recent activity
    recent_events: List[Dict]
    recent_bookings: List[Dict]
    recent_payments: List[Dict]

    # Trends (month-over-month changes)
    events_growth: float
    bookings_growth: float
    revenue_growth: float
    customers_growth: float

    # Top performers
    top_events_by_bookings: List[Dict]
    top_shows_by_revenue: List[Dict]
    top_venues_by_events: List[Dict]


@dataclass
class GetEventAnalyticsQuery:
    """Query for detailed event analytics."""

    event_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


@dataclass
class EventAnalyticsData:
    """Detailed analytics for events."""

    event_id: str
    total_bookings: int
    total_revenue: float
    capacity_utilization: float
    booking_trends: List[Dict]  # Time series data
    demographics: Dict[str, int]  # Age groups, etc.
    ticket_types_sold: Dict[str, int]


@dataclass
class GetRevenueAnalyticsQuery:
    """Query for revenue analytics over time."""

    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    group_by: str = "month"  # day, week, month, year


@dataclass
class RevenueAnalyticsData:
    """Revenue analytics data."""

    period: str
    revenue: float
    bookings_count: int
    average_ticket_price: float
    growth_percentage: Optional[float]
