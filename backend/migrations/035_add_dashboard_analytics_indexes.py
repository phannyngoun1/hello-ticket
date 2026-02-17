"""
Migration 035: Add indexes for dashboard analytics date-range queries

Adds composite indexes on (tenant_id, created_at) for events, bookings,
payments, and customers to optimize dashboard date-filtered queries.
"""

from sqlalchemy import text
from app.infrastructure.shared.database.connection import engine


def upgrade():
    """Apply the migration"""
    with engine.connect() as conn:
        # Events - for date-filtered dashboard queries
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_events_tenant_created_at
            ON events(tenant_id, created_at DESC);
        """))
        # Bookings - for date-filtered dashboard queries
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_bookings_tenant_created_at
            ON bookings(tenant_id, created_at DESC);
        """))
        # Payments - for date-filtered dashboard queries
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_payments_tenant_created_at
            ON payments(tenant_id, created_at DESC);
        """))
        # Customers - for date-filtered dashboard queries
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_customers_tenant_created_at
            ON customers(tenant_id, created_at DESC);
        """))
        conn.commit()


def downgrade():
    """Rollback the migration"""
    with engine.connect() as conn:
        conn.execute(text("DROP INDEX IF EXISTS ix_events_tenant_created_at;"))
        conn.execute(text("DROP INDEX IF EXISTS ix_bookings_tenant_created_at;"))
        conn.execute(text("DROP INDEX IF EXISTS ix_payments_tenant_created_at;"))
        conn.execute(text("DROP INDEX IF EXISTS ix_customers_tenant_created_at;"))
        conn.commit()
