"""
Migration 032: Add parent entity columns to audit_logs table

This migration adds parent_entity_type and parent_entity_id columns to the audit_logs table
to support hierarchical entity relationships (e.g., events belonging to shows).

This allows querying audit logs for a parent entity to also include logs from child entities.
For example, when viewing a "show", the audit logs can include "event" logs that have
the show as their parent entity.
"""

from sqlalchemy import text
from app.infrastructure.shared.database.connection import engine


def upgrade():
    """Apply the migration"""

    with engine.connect() as conn:
        # Add parent_entity_type column
        conn.execute(text("""
            ALTER TABLE audit_logs
            ADD COLUMN IF NOT EXISTS parent_entity_type VARCHAR(100);
        """))

        # Add parent_entity_id column
        conn.execute(text("""
            ALTER TABLE audit_logs
            ADD COLUMN IF NOT EXISTS parent_entity_id VARCHAR(255);
        """))

        # Create index for querying by parent entity
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_audit_logs_parent_entity
            ON audit_logs(parent_entity_type, parent_entity_id, event_timestamp DESC)
            WHERE parent_entity_type IS NOT NULL;
        """))

        conn.commit()


def downgrade():
    """Revert the migration"""

    with engine.connect() as conn:
        # Drop the index first
        conn.execute(text("DROP INDEX IF EXISTS ix_audit_logs_parent_entity;"))

        # Drop the columns
        conn.execute(text("ALTER TABLE audit_logs DROP COLUMN IF EXISTS parent_entity_type;"))
        conn.execute(text("ALTER TABLE audit_logs DROP COLUMN IF EXISTS parent_entity_id;"))

        conn.commit()


if __name__ == "__main__":
    print("🚀 Running migration 032: Add parent entity columns to audit_logs")
    try:
        upgrade()
        print("✅ Migration completed successfully!")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise
