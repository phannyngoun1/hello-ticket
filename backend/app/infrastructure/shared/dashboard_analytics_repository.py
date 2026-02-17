"""
Optimized dashboard analytics repository.

Performs date-filtered queries at the database level to avoid loading
entire tables into memory. Uses SQL aggregation (COUNT, SUM, GROUP BY) for statistics.
"""
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from sqlmodel import select, and_, func
from sqlalchemy import text

from app.infrastructure.shared.database.connection import get_session_sync
from app.infrastructure.shared.database.models import (
    EventModel,
    BookingModel,
    PaymentModel,
    CustomerModel,
)


class DashboardAnalyticsRepository:
    """
    Repository for optimized dashboard analytics queries.
    Pushes date filtering and aggregation to the database.
    """

    def __init__(self, session_factory=None):
        self._session_factory = session_factory or get_session_sync

    def _base_event_conditions(self, tenant_id: str):
        """Base conditions for event queries."""
        conditions = [
            EventModel.tenant_id == tenant_id,
            EventModel.is_deleted == False,
        ]
        return conditions

    def _base_booking_conditions(self, tenant_id: str):
        """Base conditions for booking queries."""
        return [BookingModel.tenant_id == tenant_id]

    def _base_payment_conditions(self, tenant_id: str):
        """Base conditions for payment queries."""
        return [PaymentModel.tenant_id == tenant_id]

    def _base_customer_conditions(self, tenant_id: str):
        """Base conditions for customer queries."""
        return [CustomerModel.tenant_id == tenant_id]

    def _add_date_filter(
        self,
        conditions: list,
        model_cls: Any,
        start_date: Optional[datetime],
        end_date: Optional[datetime],
    ) -> list:
        """Add created_at date range to conditions."""
        if start_date is not None:
            conditions.append(model_cls.created_at >= start_date)
        if end_date is not None:
            conditions.append(model_cls.created_at <= end_date)
        return conditions

    def get_recent_events(
        self,
        tenant_id: str,
        limit: int = 10,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> List[Dict]:
        """Get recent events with date filter at DB level."""
        with self._session_factory() as session:
            conditions = self._base_event_conditions(tenant_id)
            self._add_date_filter(conditions, EventModel, start_date, end_date)

            stmt = (
                select(
                    EventModel.id,
                    EventModel.title,
                    EventModel.status,
                    EventModel.created_at,
                    EventModel.start_dt,
                )
                .where(and_(*conditions))
                .order_by(EventModel.created_at.desc())
                .limit(limit)
            )
            rows = session.exec(stmt).all()
            return [
                {
                    "id": r.id,
                    "title": r.title,
                    "status": r.status,
                    "created_at": r.created_at.isoformat(),
                    "start_dt": r.start_dt.isoformat(),
                }
                for r in rows
            ]

    def get_recent_bookings(
        self,
        tenant_id: str,
        limit: int = 10,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> List[Dict]:
        """Get recent bookings with date filter at DB level. No booking items loaded."""
        with self._session_factory() as session:
            conditions = self._base_booking_conditions(tenant_id)
            self._add_date_filter(conditions, BookingModel, start_date, end_date)

            stmt = (
                select(
                    BookingModel.id,
                    BookingModel.customer_id,
                    BookingModel.total_amount,
                    BookingModel.status,
                    BookingModel.created_at,
                    BookingModel.event_id,
                )
                .where(and_(*conditions))
                .order_by(BookingModel.created_at.desc())
                .limit(limit)
            )
            rows = session.exec(stmt).all()
            return [
                {
                    "id": r.id,
                    "customer_name": f"Customer {r.customer_id[:8] if r.customer_id else 'Unknown'}",
                    "total_amount": r.total_amount,
                    "status": r.status,
                    "created_at": r.created_at.isoformat(),
                    "event_id": r.event_id,
                }
                for r in rows
            ]

    def get_recent_payments(
        self,
        tenant_id: str,
        limit: int = 10,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> List[Dict]:
        """Get recent payments with date filter at DB level."""
        with self._session_factory() as session:
            conditions = self._base_payment_conditions(tenant_id)
            self._add_date_filter(conditions, PaymentModel, start_date, end_date)

            stmt = (
                select(
                    PaymentModel.id,
                    PaymentModel.amount,
                    PaymentModel.status,
                    PaymentModel.created_at,
                )
                .where(and_(*conditions))
                .order_by(PaymentModel.created_at.desc())
                .limit(limit)
            )
            rows = session.exec(stmt).all()
            return [
                {
                    "id": r.id,
                    "amount": r.amount,
                    "status": r.status,
                    "created_at": r.created_at.isoformat(),
                }
                for r in rows
            ]

    def get_events_for_analytics(
        self,
        tenant_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> List[Dict]:
        """Get events in date range for analytics (lightweight, no joins)."""
        with self._session_factory() as session:
            conditions = self._base_event_conditions(tenant_id)
            self._add_date_filter(conditions, EventModel, start_date, end_date)

            stmt = select(
                EventModel.id,
                EventModel.title,
                EventModel.status,
                EventModel.created_at,
                EventModel.start_dt,
                EventModel.duration_minutes,
                EventModel.venue_id,
                EventModel.show_id,
            ).where(and_(*conditions))
            rows = session.exec(stmt).all()
            result = []
            for r in rows:
                end_dt = r.start_dt + timedelta(minutes=r.duration_minutes) if r.duration_minutes else r.start_dt
                result.append({
                    "id": r.id,
                    "title": r.title,
                    "status": r.status,
                    "created_at": r.created_at,
                    "start_dt": r.start_dt,
                    "end_dt": end_dt,
                    "venue_id": r.venue_id,
                    "show_id": r.show_id,
                })
            return result

    def get_bookings_for_analytics(
        self,
        tenant_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> List[Dict]:
        """Get bookings in date range for analytics (lightweight, no items)."""
        with self._session_factory() as session:
            conditions = self._base_booking_conditions(tenant_id)
            self._add_date_filter(conditions, BookingModel, start_date, end_date)

            stmt = select(
                BookingModel.id,
                BookingModel.customer_id,
                BookingModel.total_amount,
                BookingModel.status,
                BookingModel.created_at,
                BookingModel.event_id,
            ).where(and_(*conditions))
            rows = session.exec(stmt).all()
            return [
                {
                    "id": r.id,
                    "customer_id": r.customer_id,
                    "total_amount": r.total_amount,
                    "status": r.status,
                    "created_at": r.created_at,
                    "event_id": r.event_id,
                }
                for r in rows
            ]

    def get_customers_for_analytics(
        self,
        tenant_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 50000,
    ) -> List[Dict]:
        """Get customers in date range for analytics."""
        with self._session_factory() as session:
            conditions = self._base_customer_conditions(tenant_id)
            self._add_date_filter(conditions, CustomerModel, start_date, end_date)

            stmt = (
                select(
                    CustomerModel.id,
                    CustomerModel.created_at,
                    CustomerModel.updated_at,
                )
                .where(and_(*conditions))
                .limit(limit)
            )
            rows = session.exec(stmt).all()
            return [
                {"id": r.id, "created_at": r.created_at, "updated_at": r.updated_at}
                for r in rows
            ]

    def count_events(
        self,
        tenant_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> int:
        """Count events in date range using SQL aggregation."""
        with self._session_factory() as session:
            conditions = self._base_event_conditions(tenant_id)
            self._add_date_filter(conditions, EventModel, start_date, end_date)
            stmt = select(func.count(EventModel.id)).where(and_(*conditions))
            return session.exec(stmt).one() or 0

    def count_bookings(
        self,
        tenant_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> int:
        """Count bookings in date range using SQL aggregation."""
        with self._session_factory() as session:
            conditions = self._base_booking_conditions(tenant_id)
            self._add_date_filter(conditions, BookingModel, start_date, end_date)
            stmt = select(func.count(BookingModel.id)).where(and_(*conditions))
            return session.exec(stmt).one() or 0

    def sum_booking_revenue(
        self,
        tenant_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> float:
        """Sum booking revenue in date range using SQL aggregation."""
        with self._session_factory() as session:
            conditions = self._base_booking_conditions(tenant_id)
            self._add_date_filter(conditions, BookingModel, start_date, end_date)
            stmt = select(func.coalesce(func.sum(BookingModel.total_amount), 0)).where(
                and_(*conditions)
            )
            return float(session.exec(stmt).one() or 0)

    def count_customers(
        self,
        tenant_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> int:
        """Count customers in date range using SQL aggregation."""
        with self._session_factory() as session:
            conditions = self._base_customer_conditions(tenant_id)
            self._add_date_filter(conditions, CustomerModel, start_date, end_date)
            stmt = select(func.count(CustomerModel.id)).where(and_(*conditions))
            return session.exec(stmt).one() or 0

    def count_customers_updated_since(
        self,
        tenant_id: str,
        updated_since: datetime,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        updated_before: Optional[datetime] = None,
    ) -> int:
        """Count customers in date range (by created_at) with updated_at in [updated_since, updated_before]."""
        with self._session_factory() as session:
            conditions = self._base_customer_conditions(tenant_id)
            self._add_date_filter(conditions, CustomerModel, start_date, end_date)
            conditions.append(CustomerModel.updated_at >= updated_since)
            if updated_before is not None:
                conditions.append(CustomerModel.updated_at <= updated_before)
            stmt = select(func.count(CustomerModel.id)).where(and_(*conditions))
            return session.exec(stmt).one() or 0

    def get_event_status_breakdown(
        self,
        tenant_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Dict[str, int]:
        """Get event count per status using SQL GROUP BY."""
        with self._session_factory() as session:
            conditions = self._base_event_conditions(tenant_id)
            self._add_date_filter(conditions, EventModel, start_date, end_date)
            stmt = (
                select(EventModel.status, func.count(EventModel.id))
                .where(and_(*conditions))
                .group_by(EventModel.status)
            )
            rows = session.exec(stmt).all()
            return {
                (status.value if hasattr(status, "value") else str(status)): cnt
                for status, cnt in rows
            }

    def get_booking_status_breakdown(
        self,
        tenant_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Dict[str, int]:
        """Get booking count per status using SQL GROUP BY."""
        with self._session_factory() as session:
            conditions = self._base_booking_conditions(tenant_id)
            self._add_date_filter(conditions, BookingModel, start_date, end_date)
            stmt = (
                select(BookingModel.status, func.count(BookingModel.id))
                .where(and_(*conditions))
                .group_by(BookingModel.status)
            )
            rows = session.exec(stmt).all()
            return {
                (status.value if hasattr(status, "value") else str(status)): cnt
                for status, cnt in rows
            }

    def count_upcoming_events(
        self,
        tenant_id: str,
        now: datetime,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> int:
        """Count events with start_dt > now using SQL aggregation."""
        with self._session_factory() as session:
            conditions = self._base_event_conditions(tenant_id)
            self._add_date_filter(conditions, EventModel, start_date, end_date)
            conditions.append(EventModel.start_dt > now)
            stmt = select(func.count(EventModel.id)).where(and_(*conditions))
            return session.exec(stmt).one() or 0

    def count_active_events(
        self,
        tenant_id: str,
        now: datetime,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> int:
        """Count events where now is between start_dt and end_dt (start_dt + duration)."""
        with self._session_factory() as session:
            row = session.execute(
                text("""
                    SELECT COUNT(*) FROM events
                    WHERE tenant_id = :tenant_id AND is_deleted = FALSE
                    AND (CAST(:start_date AS timestamptz) IS NULL OR created_at >= :start_date)
                    AND (CAST(:end_date AS timestamptz) IS NULL OR created_at <= :end_date)
                    AND start_dt <= :now
                    AND start_dt + CAST((duration_minutes || ' minutes') AS interval) >= :now
                """),
                {"tenant_id": tenant_id, "now": now, "start_date": start_date, "end_date": end_date},
            ).fetchone()
            return row[0] if row else 0

    def get_top_events_by_bookings(
        self,
        tenant_id: str,
        limit: int = 5,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> List[Dict]:
        """Get top events by booking count using SQL GROUP BY and JOIN."""
        with self._session_factory() as session:
            sql = text("""
                SELECT b.event_id, e.title, COUNT(*) as bookings_count
                FROM bookings b
                JOIN events e ON e.id = b.event_id AND e.tenant_id = b.tenant_id
                WHERE b.tenant_id = :tenant_id
                AND (CAST(:start_date AS timestamptz) IS NULL OR b.created_at >= :start_date)
                AND (CAST(:end_date AS timestamptz) IS NULL OR b.created_at <= :end_date)
                AND e.is_deleted = FALSE
                GROUP BY b.event_id, e.title
                ORDER BY bookings_count DESC
                LIMIT :limit
            """)
            rows = session.execute(
                sql,
                {"tenant_id": tenant_id, "start_date": start_date, "end_date": end_date, "limit": limit},
            ).fetchall()
            return [
                {"event_id": r[0], "event_title": r[1] or "Unknown", "bookings_count": r[2]}
                for r in rows
            ]

    def get_top_shows_by_revenue(
        self,
        tenant_id: str,
        limit: int = 5,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> List[Dict]:
        """Get top shows by revenue using SQL GROUP BY (bookings -> events -> show_id)."""
        with self._session_factory() as session:
            sql = text("""
                SELECT e.show_id, COALESCE(SUM(b.total_amount), 0) as revenue
                FROM bookings b
                JOIN events e ON e.id = b.event_id AND e.tenant_id = b.tenant_id
                WHERE b.tenant_id = :tenant_id
                AND (CAST(:start_date AS timestamptz) IS NULL OR b.created_at >= :start_date)
                AND (CAST(:end_date AS timestamptz) IS NULL OR b.created_at <= :end_date)
                AND e.is_deleted = FALSE
                GROUP BY e.show_id
                ORDER BY revenue DESC
                LIMIT :limit
            """)
            rows = session.execute(
                sql,
                {"tenant_id": tenant_id, "start_date": start_date, "end_date": end_date, "limit": limit},
            ).fetchall()
            return [
                {"show_id": r[0], "show_name": f"Show {str(r[0])[:8]}" if r[0] else "Unknown", "revenue": float(r[1])}
                for r in rows
            ]

    def get_top_venues_by_events(
        self,
        tenant_id: str,
        limit: int = 5,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> List[Dict]:
        """Get top venues by event count using SQL GROUP BY."""
        with self._session_factory() as session:
            conditions = self._base_event_conditions(tenant_id)
            self._add_date_filter(conditions, EventModel, start_date, end_date)
            stmt = (
                select(EventModel.venue_id, func.count(EventModel.id))
                .where(and_(*conditions))
                .group_by(EventModel.venue_id)
                .order_by(func.count(EventModel.id).desc())
                .limit(limit)
            )
            rows = session.exec(stmt).all()
            return [
                {"venue_id": vid, "venue_name": f"Venue {str(vid)[:8]}" if vid else "Unknown", "events_count": cnt}
                for vid, cnt in rows
            ]
