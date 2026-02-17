"""Create lookup_values table (consolidated from customer_types, venue_types, event_types)

Revision ID: e7f8a9b0c1d2
Revises: d0e1f2a3b4c5
Create Date: 2026-02-17

Creates lookup_values if missing. Migrates data from customer_types, venue_types, event_types
if those tables exist. Idempotent - safe to run on DBs that already have lookup_values.
"""
from alembic import op
from sqlalchemy import text


revision = 'e7f8a9b0c1d2'
down_revision = 'd0e1f2a3b4c5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()

    # 1. Create lookup_values table (IF NOT EXISTS)
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS lookup_values (
            id VARCHAR NOT NULL PRIMARY KEY,
            tenant_id VARCHAR NOT NULL,
            type_code VARCHAR NOT NULL,
            code VARCHAR NOT NULL,
            name VARCHAR NOT NULL,
            sort_order INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            is_deleted BOOLEAN DEFAULT FALSE,
            version INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE,
            updated_at TIMESTAMP WITH TIME ZONE,
            deleted_at TIMESTAMP WITH TIME ZONE
        );
    """))
    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_lookup_values_tenant_id ON lookup_values(tenant_id);"))
    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_lookup_values_type_code ON lookup_values(type_code);"))
    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_lookup_values_code ON lookup_values(code);"))
    conn.execute(text("""
        CREATE UNIQUE INDEX IF NOT EXISTS ix_lookup_values_tenant_type_code
        ON lookup_values(tenant_id, type_code, code);
    """))
    conn.execute(text("""
        CREATE INDEX IF NOT EXISTS ix_lookup_values_tenant_type_active
        ON lookup_values(tenant_id, type_code, is_active);
    """))
    conn.execute(text("""
        CREATE INDEX IF NOT EXISTS ix_lookup_values_tenant_type_deleted
        ON lookup_values(tenant_id, type_code, is_deleted);
    """))
    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_lookup_values_is_active ON lookup_values(is_active);"))
    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_lookup_values_is_deleted ON lookup_values(is_deleted);"))

    # 2. Migrate data from old tables if they exist (idempotent - skip if lookup_values has data)
    def table_exists(name: str) -> bool:
        r = conn.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = :name
            );
        """), {"name": name})
        return r.scalar()

    def lookup_values_empty() -> bool:
        r = conn.execute(text("SELECT COUNT(*) FROM lookup_values"))
        return r.scalar() == 0

    if lookup_values_empty():
        if table_exists("customer_types"):
            conn.execute(text("""
                INSERT INTO lookup_values (id, tenant_id, type_code, code, name, sort_order, is_active, is_deleted, version, created_at, updated_at, deleted_at)
                SELECT id, tenant_id, 'customer_type', code, name, 0, is_active, is_deleted, version, created_at, updated_at, deleted_at
                FROM customer_types;
            """))
        if table_exists("venue_types"):
            conn.execute(text("""
                INSERT INTO lookup_values (id, tenant_id, type_code, code, name, sort_order, is_active, is_deleted, version, created_at, updated_at, deleted_at)
                SELECT id, tenant_id, 'venue_type', code, name, 0, is_active, is_deleted, version, created_at, updated_at, deleted_at
                FROM venue_types;
            """))
        if table_exists("event_types"):
            conn.execute(text("""
                INSERT INTO lookup_values (id, tenant_id, type_code, code, name, sort_order, is_active, is_deleted, version, created_at, updated_at, deleted_at)
                SELECT id, tenant_id, 'event_type', code, name, 0, is_active, is_deleted, version, created_at, updated_at, deleted_at
                FROM event_types;
            """))

        # 3. Drop old tables (only if we migrated - they may have FKs from other tables)
        if table_exists("event_types"):
            conn.execute(text("DROP TABLE IF EXISTS event_types CASCADE;"))
        if table_exists("venue_types"):
            conn.execute(text("DROP TABLE IF EXISTS venue_types CASCADE;"))
        if table_exists("customer_types"):
            conn.execute(text("DROP TABLE IF EXISTS customer_types CASCADE;"))


def downgrade() -> None:
    # Downgrade would recreate customer_types, venue_types, event_types - skip for safety
    # Use migration 033 downgrade logic if needed
    pass
