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
from app.shared.mediator import Handler
from app.shared.tenant_context import require_tenant_context


class GetDashboardAnalyticsHandler(Handler[GetDashboardAnalyticsQuery, DashboardAnalyticsData]):
    """Handler for dashboard analytics queries."""

    def __init__(
        self,
        event_repository: EventRepository,
        booking_repository: BookingRepository,
        customer_repository: CustomerRepository,
        payment_repository: PaymentRepository,
        user_repository: UserRepository,
    ):
        self.event_repository = event_repository
        self.booking_repository = booking_repository
        self.customer_repository = customer_repository
        self.payment_repository = payment_repository
        self.user_repository = user_repository

    async def handle_get_dashboard_analytics(self, query: GetDashboardAnalyticsQuery) -> DashboardAnalyticsData:
        """Handle dashboard analytics query."""
        tenant_id = require_tenant_context()

        now = datetime.now(timezone.utc)
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month = start_of_month - timedelta(days=1)
        start_of_last_month = last_month.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # Event metrics
        all_events = await self.event_repository.get_all(tenant_id)
        total_events = len(all_events)

        upcoming_events = len([
            event for event in all_events
            if event.start_dt > now
        ])

        active_events = len([
            event for event in all_events
            if event.start_dt <= now and event.end_dt >= now
        ])

        events_this_month = len([
            event for event in all_events
            if event.created_at >= start_of_month
        ])

        event_status_breakdown = defaultdict(int)
        for event in all_events:
            event_status_breakdown[event.status] += 1

        # Booking/Sales metrics
        all_bookings = await self.booking_repository.get_all(tenant_id)
        total_bookings = len(all_bookings)

        bookings_this_month = len([
            booking for booking in all_bookings
            if booking.created_at >= start_of_month
        ])

        # Calculate revenue
        total_revenue = sum(booking.total_amount for booking in all_bookings)
        revenue_this_month = sum(
            booking.total_amount for booking in all_bookings
            if booking.created_at >= start_of_month
        )

        average_ticket_price = total_revenue / total_bookings if total_bookings > 0 else 0

        booking_status_breakdown = defaultdict(int)
        for booking in all_bookings:
            booking_status_breakdown[booking.status] += 1

        # Customer metrics
        all_customers_result = await self.customer_repository.search(
            tenant_id=tenant_id,
            limit=10000  # Large limit to get all customers for analytics
        )
        all_customers = all_customers_result.items
        total_customers = len(all_customers)

        new_customers_this_month = len([
            customer for customer in all_customers
            if customer.created_at >= start_of_month
        ])

        active_customers = len([
            customer for customer in all_customers
            if customer.updated_at >= start_of_month
        ])

        # User metrics
        all_users = await self.user_repository.get_all()
        total_users = len(all_users)
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
            for event in sorted(all_events, key=lambda x: x.created_at, reverse=True)[:10]
        ]

        recent_bookings = [
            {
                "id": booking.id,
                "customer_name": f"Customer {booking.customer_id[:8] if booking.customer_id else 'Unknown'}",
                "total_amount": booking.total_amount,
                "status": booking.status,
                "created_at": booking.created_at.isoformat(),
            }
            for booking in sorted(all_bookings, key=lambda x: x.created_at, reverse=True)[:10]
        ]

        all_payments = await self.payment_repository.get_all(tenant_id)
        recent_payments = [
            {
                "id": payment.id,
                "amount": payment.amount,
                "status": payment.status,
                "created_at": payment.created_at.isoformat(),
            }
            for payment in sorted(all_payments, key=lambda x: x.created_at, reverse=True)[:10]
        ]

        # Calculate growth percentages
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

        # Top performers
        event_bookings = defaultdict(int)
        for booking in all_bookings:
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
        for booking in all_bookings:
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

        venue_events = defaultdict(int)
        for event in all_events:
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
