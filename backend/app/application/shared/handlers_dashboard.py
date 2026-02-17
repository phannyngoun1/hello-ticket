"""Dashboard analytics handlers."""
from typing import List, Dict, Optional
from datetime import datetime, timedelta, timezone
from collections import defaultdict

from app.application.shared.queries_dashboard import (
    GetDashboardAnalyticsQuery,
    DashboardAnalyticsData,
    GetEventAnalyticsQuery,
    EventAnalyticsData,
    GetRevenueAnalyticsQuery,
    RevenueAnalyticsData,
)
from app.domain.ticketing.event_repositories import EventRepository
from app.domain.sales.booking_repositories import BookingRepository
from app.domain.sales.repositories import CustomerRepository
from app.domain.sales.payment_repositories import PaymentRepository
from app.domain.core.user.repository import UserRepository
from app.infrastructure.shared.dashboard_analytics_repository import DashboardAnalyticsRepository
from app.shared.mediator import Handler
from app.shared.tenant_context import require_tenant_context


class GetDashboardAnalyticsHandler(Handler[GetDashboardAnalyticsQuery, DashboardAnalyticsData]):
    """Handler for dashboard analytics queries.
    Uses optimized date-filtered queries when date range is provided.
    """

    def __init__(
        self,
        event_repository: EventRepository,
        booking_repository: BookingRepository,
        customer_repository: CustomerRepository,
        payment_repository: PaymentRepository,
        user_repository: UserRepository,
        dashboard_analytics_repository: Optional[DashboardAnalyticsRepository] = None,
    ):
        self.event_repository = event_repository
        self.booking_repository = booking_repository
        self.customer_repository = customer_repository
        self.payment_repository = payment_repository
        self.user_repository = user_repository
        self.dashboard_repo = dashboard_analytics_repository or DashboardAnalyticsRepository()

    def _use_optimized_path(self, query: GetDashboardAnalyticsQuery) -> bool:
        """Use optimized DB-level filtering when date range is provided."""
        return query.start_date is not None or query.end_date is not None

    async def handle_get_dashboard_analytics(self, query: GetDashboardAnalyticsQuery) -> DashboardAnalyticsData:
        """Handle dashboard analytics query."""
        if self._use_optimized_path(query):
            return await self._handle_optimized(query)
        return await self._handle_legacy(query)

    async def _handle_optimized(self, query: GetDashboardAnalyticsQuery) -> DashboardAnalyticsData:
        """Optimized path: SQL aggregation (COUNT, SUM, GROUP BY) at DB level."""
        tenant_id = require_tenant_context()
        now = datetime.now(timezone.utc)
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # SQL aggregation for statistics (no full table loads)
        total_events = self.dashboard_repo.count_events(
            tenant_id, query.start_date, query.end_date
        )
        upcoming_events = self.dashboard_repo.count_upcoming_events(
            tenant_id, now, query.start_date, query.end_date
        )
        active_events = self.dashboard_repo.count_active_events(
            tenant_id, now, query.start_date, query.end_date
        )
        event_status_breakdown = self.dashboard_repo.get_event_status_breakdown(
            tenant_id, query.start_date, query.end_date
        )

        total_bookings = self.dashboard_repo.count_bookings(
            tenant_id, query.start_date, query.end_date
        )
        total_revenue = self.dashboard_repo.sum_booking_revenue(
            tenant_id, query.start_date, query.end_date
        )
        booking_status_breakdown = self.dashboard_repo.get_booking_status_breakdown(
            tenant_id, query.start_date, query.end_date
        )
        average_ticket_price = total_revenue / total_bookings if total_bookings > 0 else 0

        total_customers = self.dashboard_repo.count_customers(
            tenant_id, query.start_date, query.end_date
        )

        # "This month" / "in period" metrics: when range overlaps current month, use overlap;
        # when range is entirely in the past (e.g. Last Month), use period = total
        period_in_past = query.end_date and query.end_date < start_of_month
        if period_in_past:
            month_start = query.start_date
            updated_since = query.start_date
            updated_before = query.end_date  # "active" = updated within selected period
        else:
            month_start = max(query.start_date, start_of_month) if query.start_date else start_of_month
            updated_since = start_of_month
            updated_before = None  # no upper bound for "active this month"

        events_this_month = self.dashboard_repo.count_events(
            tenant_id, month_start, query.end_date
        )
        bookings_this_month = self.dashboard_repo.count_bookings(
            tenant_id, month_start, query.end_date
        )
        revenue_this_month = self.dashboard_repo.sum_booking_revenue(
            tenant_id, month_start, query.end_date
        )
        new_customers_this_month = self.dashboard_repo.count_customers(
            tenant_id, month_start, query.end_date
        )
        active_customers = self.dashboard_repo.count_customers_updated_since(
            tenant_id, updated_since, query.start_date, query.end_date, updated_before
        )

        # Recent activity (lightweight, limited)
        recent_events = self.dashboard_repo.get_recent_events(
            tenant_id, 10, query.start_date, query.end_date
        )
        recent_bookings = self.dashboard_repo.get_recent_bookings(
            tenant_id, 10, query.start_date, query.end_date
        )
        recent_payments = self.dashboard_repo.get_recent_payments(
            tenant_id, 10, query.start_date, query.end_date
        )

        # Top lists via SQL GROUP BY
        top_events_by_bookings = self.dashboard_repo.get_top_events_by_bookings(
            tenant_id, 5, query.start_date, query.end_date
        )
        top_shows_by_revenue = self.dashboard_repo.get_top_shows_by_revenue(
            tenant_id, 5, query.start_date, query.end_date
        )
        top_venues_by_events = self.dashboard_repo.get_top_venues_by_events(
            tenant_id, 5, query.start_date, query.end_date
        )

        # Users (no aggregation in dashboard repo)
        all_users = await self.user_repository.get_all()
        total_users = len(all_users)
        if query.start_date or query.end_date:
            def _in_range(dt, start, end):
                if start and dt < start:
                    return False
                if end and dt > end:
                    return False
                return True
            active_users = sum(1 for u in all_users if u.last_login and _in_range(u.last_login, query.start_date, query.end_date))
        else:
            active_users = sum(1 for u in all_users if u.last_login and u.last_login >= start_of_month)

        # Growth: compare to previous period using SQL aggregation (no overlap)
        events_growth = bookings_growth = revenue_growth = customers_growth = 0.0
        if query.start_date and query.end_date:
            period_delta = query.end_date - query.start_date
            # Previous period ends just before current starts to avoid double-counting
            prev_end = query.start_date - timedelta(microseconds=1)
            prev_start = prev_end - period_delta
            prev_ec = self.dashboard_repo.count_events(tenant_id, prev_start, prev_end)
            prev_bc = self.dashboard_repo.count_bookings(tenant_id, prev_start, prev_end)
            prev_rev = self.dashboard_repo.sum_booking_revenue(tenant_id, prev_start, prev_end)
            prev_cc = self.dashboard_repo.count_customers(tenant_id, prev_start, prev_end)
            events_growth = ((total_events - prev_ec) / prev_ec * 100) if prev_ec > 0 else 0.0
            bookings_growth = ((total_bookings - prev_bc) / prev_bc * 100) if prev_bc > 0 else 0.0
            revenue_growth = ((total_revenue - prev_rev) / prev_rev * 100) if prev_rev > 0 else 0.0
            customers_growth = ((total_customers - prev_cc) / prev_cc * 100) if prev_cc > 0 else 0.0

        return DashboardAnalyticsData(
            total_events=total_events, upcoming_events=upcoming_events, active_events=active_events,
            events_this_month=events_this_month, event_status_breakdown=dict(event_status_breakdown),
            total_bookings=total_bookings, bookings_this_month=bookings_this_month,
            total_revenue=total_revenue, revenue_this_month=revenue_this_month,
            average_ticket_price=average_ticket_price, booking_status_breakdown=dict(booking_status_breakdown),
            total_customers=total_customers, new_customers_this_month=new_customers_this_month,
            active_customers=active_customers, total_users=total_users, active_users=active_users,
            recent_events=recent_events, recent_bookings=recent_bookings, recent_payments=recent_payments,
            events_growth=events_growth, bookings_growth=bookings_growth,
            revenue_growth=revenue_growth, customers_growth=customers_growth,
            top_events_by_bookings=top_events_by_bookings, top_shows_by_revenue=top_shows_by_revenue,
            top_venues_by_events=top_venues_by_events,
        )

    async def _handle_legacy(self, query: GetDashboardAnalyticsQuery) -> DashboardAnalyticsData:
        """Legacy path when no date filter."""
        tenant_id = require_tenant_context()

        def _in_date_range(dt: datetime, start: Optional[datetime], end: Optional[datetime]) -> bool:
            if start is None and end is None:
                return True
            if start is not None and dt < start:
                return False
            if end is not None and dt > end:
                return False
            return True

        now = datetime.now(timezone.utc)
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month = start_of_month - timedelta(days=1)
        start_of_last_month = last_month.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # Event metrics
        all_events = await self.event_repository.get_all(tenant_id)
        filtered_events = [
            e for e in all_events
            if _in_date_range(e.created_at, query.start_date, query.end_date)
        ]
        total_events = len(filtered_events)

        upcoming_events = len([
            event for event in filtered_events
            if event.start_dt > now
        ])

        active_events = len([
            event for event in filtered_events
            if event.start_dt <= now and event.end_dt >= now
        ])

        events_this_month = len([
            event for event in filtered_events
            if event.created_at >= start_of_month
        ])

        event_status_breakdown = defaultdict(int)
        for event in filtered_events:
            event_status_breakdown[event.status] += 1

        # Booking/Sales metrics
        all_bookings = await self.booking_repository.get_all(tenant_id)
        filtered_bookings = [
            b for b in all_bookings
            if _in_date_range(b.created_at, query.start_date, query.end_date)
        ]
        total_bookings = len(filtered_bookings)

        bookings_this_month = len([
            booking for booking in filtered_bookings
            if booking.created_at >= start_of_month
        ])

        # Calculate revenue
        total_revenue = sum(booking.total_amount for booking in filtered_bookings)
        revenue_this_month = sum(
            booking.total_amount for booking in filtered_bookings
            if booking.created_at >= start_of_month
        )

        average_ticket_price = total_revenue / total_bookings if total_bookings > 0 else 0

        booking_status_breakdown = defaultdict(int)
        for booking in filtered_bookings:
            booking_status_breakdown[booking.status] += 1

        # Customer metrics
        all_customers_result = await self.customer_repository.search(
            tenant_id=tenant_id,
            limit=10000  # Large limit to get all customers for analytics
        )
        all_customers = all_customers_result.items
        filtered_customers = [
            c for c in all_customers
            if _in_date_range(c.created_at, query.start_date, query.end_date)
        ]
        total_customers = len(filtered_customers)

        new_customers_this_month = len([
            customer for customer in filtered_customers
            if customer.created_at >= start_of_month
        ])

        active_customers = len([
            customer for customer in filtered_customers
            if customer.updated_at >= start_of_month
        ])

        # User metrics (filter by last_login in range when date filter provided)
        all_users = await self.user_repository.get_all()
        total_users = len(all_users)
        if query.start_date or query.end_date:
            filtered_users = [
                u for u in all_users
                if u.last_login and _in_date_range(u.last_login, query.start_date, query.end_date)
            ]
            active_users = len(filtered_users)
        else:
            active_users = len([
                user for user in all_users
                if user.last_login and user.last_login >= start_of_month
            ])

        # Recent activity (last 10 items each)
        recent_events = [
            {
                "id": event.id,
                "title": event.title,
                "status": event.status,
                "created_at": event.created_at.isoformat(),
                "start_dt": event.start_dt.isoformat(),
            }
            for event in sorted(filtered_events, key=lambda x: x.created_at, reverse=True)[:10]
        ]

        recent_bookings = [
            {
                "id": booking.id,
                "customer_name": f"Customer {booking.customer_id[:8] if booking.customer_id else 'Unknown'}",
                "total_amount": booking.total_amount,
                "status": booking.status,
                "created_at": booking.created_at.isoformat(),
            }
            for booking in sorted(filtered_bookings, key=lambda x: x.created_at, reverse=True)[:10]
        ]

        all_payments = await self.payment_repository.get_all(tenant_id)
        filtered_payments = [
            p for p in all_payments
            if _in_date_range(p.created_at, query.start_date, query.end_date)
        ]
        recent_payments = [
            {
                "id": payment.id,
                "amount": payment.amount,
                "status": payment.status,
                "created_at": payment.created_at.isoformat(),
            }
            for payment in sorted(filtered_payments, key=lambda x: x.created_at, reverse=True)[:10]
        ]

        # Calculate growth percentages
        if query.start_date and query.end_date:
            # Compare to previous period of same length
            period_delta = query.end_date - query.start_date
            prev_start = query.start_date - period_delta
            prev_end = query.start_date

            def _in_prev_range(dt: datetime) -> bool:
                return prev_start <= dt < prev_end

            prev_events = len([e for e in all_events if _in_prev_range(e.created_at)])
            events_growth = ((total_events - prev_events) / prev_events * 100) if prev_events > 0 else 0.0

            prev_bookings = len([b for b in all_bookings if _in_prev_range(b.created_at)])
            bookings_growth = ((total_bookings - prev_bookings) / prev_bookings * 100) if prev_bookings > 0 else 0.0

            prev_revenue = sum(b.total_amount for b in all_bookings if _in_prev_range(b.created_at))
            revenue_growth = ((total_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0.0

            prev_customers = len([c for c in all_customers if _in_prev_range(c.created_at)])
            customers_growth = ((total_customers - prev_customers) / prev_customers * 100) if prev_customers > 0 else 0.0
        else:
            last_month_events = len([
                event for event in all_events
                if start_of_last_month <= event.created_at < start_of_month
            ])
            events_growth = ((events_this_month - last_month_events) / last_month_events * 100) if last_month_events > 0 else 0

            last_month_bookings = len([
                booking for booking in all_bookings
                if start_of_last_month <= booking.created_at < start_of_month
            ])
            bookings_growth = ((bookings_this_month - last_month_bookings) / last_month_bookings * 100) if last_month_bookings > 0 else 0

            last_month_revenue = sum(
                booking.total_amount for booking in all_bookings
                if start_of_last_month <= booking.created_at < start_of_month
            )
            revenue_growth = ((revenue_this_month - last_month_revenue) / last_month_revenue * 100) if last_month_revenue > 0 else 0

            last_month_customers = len([
                customer for customer in all_customers
                if start_of_last_month <= customer.created_at < start_of_month
            ])
            customers_growth = ((new_customers_this_month - last_month_customers) / last_month_customers * 100) if last_month_customers > 0 else 0

        events_by_id = {event.id: event for event in all_events}

        # Top performers (use filtered data when date range provided)
        top_bookings = filtered_bookings if (query.start_date or query.end_date) else all_bookings
        event_bookings = defaultdict(int)
        for booking in top_bookings:
            # Safely get event using event_id since booking.event is not populated
            if booking.event_id and booking.event_id in events_by_id:
                event_bookings[booking.event_id] += 1

        top_events_by_bookings = [
            {
                "event_id": event_id,
                "event_title": next((e.title for e in all_events if e.id == event_id), "Unknown"),
                "bookings_count": count,
            }
            for event_id, count in sorted(event_bookings.items(), key=lambda x: x[1], reverse=True)[:5]
        ]

        # For simplicity, we'll use show_id and venue_id directly since Event doesn't have full relationships
        show_revenue = defaultdict(float)
        for booking in top_bookings:
            if booking.event_id and booking.event_id in events_by_id:
                event = events_by_id[booking.event_id]
                if event.show_id:  # Use show_id instead of event.show
                    show_revenue[event.show_id] += booking.total_amount

        top_shows_by_revenue = [
            {
                "show_id": show_id,
                "show_name": f"Show {show_id[:8]}",  # Use show_id directly since we don't have show names
                "revenue": revenue,
            }
            for show_id, revenue in sorted(show_revenue.items(), key=lambda x: x[1], reverse=True)[:5]
        ]

        top_events = filtered_events if (query.start_date or query.end_date) else all_events
        venue_events = defaultdict(int)
        for event in top_events:
            if event.venue_id:  # Use venue_id instead of event.venue
                venue_events[event.venue_id] += 1

        top_venues_by_events = [
            {
                "venue_id": venue_id,
                "venue_name": f"Venue {venue_id[:8]}",  # Use venue_id directly since we don't have venue names
                "events_count": count,
            }
            for venue_id, count in sorted(venue_events.items(), key=lambda x: x[1], reverse=True)[:5]
        ]

        return DashboardAnalyticsData(
            total_events=total_events,
            upcoming_events=upcoming_events,
            active_events=active_events,
            events_this_month=events_this_month,
            event_status_breakdown=dict(event_status_breakdown),

            total_bookings=total_bookings,
            bookings_this_month=bookings_this_month,
            total_revenue=total_revenue,
            revenue_this_month=revenue_this_month,
            average_ticket_price=average_ticket_price,
            booking_status_breakdown=dict(booking_status_breakdown),

            total_customers=total_customers,
            new_customers_this_month=new_customers_this_month,
            active_customers=active_customers,

            total_users=total_users,
            active_users=active_users,

            recent_events=recent_events,
            recent_bookings=recent_bookings,
            recent_payments=recent_payments,

            events_growth=events_growth,
            bookings_growth=bookings_growth,
            revenue_growth=revenue_growth,
            customers_growth=customers_growth,

            top_events_by_bookings=top_events_by_bookings,
            top_shows_by_revenue=top_shows_by_revenue,
            top_venues_by_events=top_venues_by_events,
        )


class GetRevenueAnalyticsHandler(Handler[GetRevenueAnalyticsQuery, List[RevenueAnalyticsData]]):
    """Handler for revenue analytics queries."""

    def __init__(
        self,
        booking_repository: BookingRepository,
    ):
        self.booking_repository = booking_repository

    async def handle_get_revenue_analytics(self, query: GetRevenueAnalyticsQuery) -> List[RevenueAnalyticsData]:
        """Handle revenue analytics query."""
        tenant_id = require_tenant_context()

        # Get all bookings for the tenant
        all_bookings = await self.booking_repository.get_all(tenant_id)

        # Filter by date range if provided
        filtered_bookings = all_bookings
        if query.start_date or query.end_date:
            filtered_bookings = [
                booking for booking in all_bookings
                if (not query.start_date or booking.created_at >= query.start_date) and
                   (not query.end_date or booking.created_at <= query.end_date)
            ]

        # Group bookings by period
        period_groups = defaultdict(lambda: {'revenue': 0.0, 'bookings_count': 0, 'total_amount': 0.0})

        for booking in filtered_bookings:
            period_key = self._get_period_key(booking.created_at, query.group_by)
            period_groups[period_key]['revenue'] += booking.total_amount
            period_groups[period_key]['bookings_count'] += 1
            period_groups[period_key]['total_amount'] += booking.total_amount

        # Convert to RevenueAnalyticsData objects
        result = []
        for period_key, data in sorted(period_groups.items()):
            bookings_count = data['bookings_count']
            average_ticket_price = data['total_amount'] / bookings_count if bookings_count > 0 else 0.0

            result.append(RevenueAnalyticsData(
                period=period_key,
                revenue=data['revenue'],
                bookings_count=bookings_count,
                average_ticket_price=average_ticket_price,
                growth_percentage=None  # Could be calculated if we had previous period data
            ))

        return result

    def _get_period_key(self, date: datetime, group_by: str) -> str:
        """Generate period key based on grouping strategy."""
        if group_by == 'day':
            return date.strftime('%Y-%m-%d')
        elif group_by == 'week':
            # Get the start of the week (Monday)
            start_of_week = date - timedelta(days=date.weekday())
            return start_of_week.strftime('%Y-%m-%d')
        elif group_by == 'month':
            return date.strftime('%Y-%m')
        elif group_by == 'year':
            return date.strftime('%Y')
        else:
            return date.strftime('%Y-%m')
