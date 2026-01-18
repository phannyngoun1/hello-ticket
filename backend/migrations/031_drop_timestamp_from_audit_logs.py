"""
Migration 031: Drop timestamp column from audit_logs table

This migration removes the timestamp column from the audit_logs table
and updates all indexes that referenced it to use event_timestamp instead.
"""

from sqlalchemy import text
from app.infrastructure.shared.database.connection import get_engine

def upgrade():
    """Apply the migration"""
    engine = get_engine()

    with engine.connect() as conn:
        # First add the event_timestamp column if it doesn't exist
        conn.execute(text("""
            ALTER TABLE audit_logs
            ADD COLUMN IF NOT EXISTS event_timestamp TIMESTAMPTZ;
        """))

        # Copy timestamp values to event_timestamp for existing records
        conn.execute(text("""
            UPDATE audit_logs
            SET event_timestamp = timestamp
            WHERE event_timestamp IS NULL AND timestamp IS NOT NULL;
        """))

        # Make event_timestamp NOT NULL after populating it
        conn.execute(text("""
            ALTER TABLE audit_logs
            ALTER COLUMN event_timestamp SET NOT NULL;
        """))

        # Drop old indexes that reference timestamp
        conn.execute(text("DROP INDEX IF EXISTS ix_audit_logs_tenant_timestamp;"))
        conn.execute(text("DROP INDEX IF EXISTS ix_audit_logs_entity;"))
        conn.execute(text("DROP INDEX IF EXISTS ix_audit_logs_user;"))
        conn.execute(text("DROP INDEX IF EXISTS ix_audit_logs_event_type;"))

        # Create new indexes using event_timestamp
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_audit_logs_tenant_event_timestamp
            ON audit_logs(tenant_id, event_timestamp DESC);
        """))

        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_audit_logs_entity
            ON audit_logs(entity_type, entity_id, event_timestamp DESC);
        """))

        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_audit_logs_user
            ON audit_logs(user_id, event_timestamp DESC) WHERE user_id IS NOT NULL;
        """))

        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_audit_logs_event_type
            ON audit_logs(event_type, event_timestamp DESC);
        """))

        # Finally drop the timestamp column
        conn.execute(text("ALTER TABLE audit_logs DROP COLUMN IF EXISTS timestamp;"))

        conn.commit()


def downgrade():
    """Revert the migration"""
    engine = get_engine()

    with engine.connect() as conn:
        # Add back the timestamp column
        conn.execute(text("""
            ALTER TABLE audit_logs
            ADD COLUMN timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW();
        """))

        # Copy event_timestamp values back to timestamp
        conn.execute(text("""
            UPDATE audit_logs
            SET timestamp = event_timestamp
            WHERE timestamp = 'epoch'::timestamptz;  -- Only update default values
        """))

        # Drop the new indexes
        conn.execute(text("DROP INDEX IF EXISTS ix_audit_logs_tenant_event_timestamp;"))
        conn.execute(text("DROP INDEX IF EXISTS ix_audit_logs_entity;"))
        conn.execute(text("DROP INDEX IF EXISTS ix_audit_logs_user;"))
        conn.execute(text("DROP INDEX IF EXISTS ix_audit_logs_event_type;"))

        # Recreate old indexes
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_audit_logs_tenant_timestamp
            ON audit_logs(tenant_id, timestamp DESC);
        """))

        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_audit_logs_entity
            ON audit_logs(entity_type, entity_id, timestamp DESC);
        """))

        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_audit_logs_user
            ON audit_logs(user_id, timestamp DESC) WHERE user_id IS NOT NULL;
        """))

        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_audit_logs_event_type
            ON audit_logs(event_type, timestamp DESC);
        """))

        # Drop the event_timestamp column
        conn.execute(text("ALTER TABLE audit_logs DROP COLUMN IF EXISTS event_timestamp;"))

        conn.commit()