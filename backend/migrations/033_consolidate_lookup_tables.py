"""
Migration 033: Consolidate customer_types, venue_types, event_types into lookup_values

Creates a single lookup_values table and migrates data from the three type tables.
"""

from sqlalchemy import text
from app.infrastructure.shared.database.connection import engine


def upgrade():
    """Apply the migration"""

    with engine.connect() as conn:
        # 1. Create lookup_values table
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

        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_lookup_values_tenant_id ON lookup_values(tenant_id);
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_lookup_values_type_code ON lookup_values(type_code);
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_lookup_values_code ON lookup_values(code);
        """))
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
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_lookup_values_is_active ON lookup_values(is_active);
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_lookup_values_is_deleted ON lookup_values(is_deleted);
        """))

        # 2. Migrate data only if source tables exist (idempotent - skip if already migrated)
        def table_exists(name):
            r = conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = :name
                );
            """), {"name": name})
            return r.scalar()

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

        # 3. Drop old tables (order may matter for FKs - these have no FKs from other tables)
        conn.execute(text("DROP TABLE IF EXISTS event_types CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS venue_types CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS customer_types CASCADE;"))

        conn.commit()


def downgrade():
    """Revert the migration - recreate old tables and migrate data back"""

    with engine.connect() as conn:
        # Recreate customer_types
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS customer_types (
                id VARCHAR NOT NULL PRIMARY KEY,
                tenant_id VARCHAR NOT NULL,
                code VARCHAR NOT NULL,
                name VARCHAR NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                is_deleted BOOLEAN DEFAULT FALSE,
                version INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE,
                updated_at TIMESTAMP WITH TIME ZONE,
                deleted_at TIMESTAMP WITH TIME ZONE
            );
        """))
        conn.execute(text("""
            INSERT INTO customer_types (id, tenant_id, code, name, is_active, is_deleted, version, created_at, updated_at, deleted_at)
            SELECT id, tenant_id, code, name, is_active, is_deleted, version, created_at, updated_at, deleted_at
            FROM lookup_values WHERE type_code = 'customer_type';
        """))

        # Recreate venue_types
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS venue_types (
                id VARCHAR NOT NULL PRIMARY KEY,
                tenant_id VARCHAR NOT NULL,
                code VARCHAR NOT NULL,
                name VARCHAR NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                is_deleted BOOLEAN DEFAULT FALSE,
                version INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE,
                updated_at TIMESTAMP WITH TIME ZONE,
                deleted_at TIMESTAMP WITH TIME ZONE
            );
        """))
        conn.execute(text("""
            INSERT INTO venue_types (id, tenant_id, code, name, is_active, is_deleted, version, created_at, updated_at, deleted_at)
            SELECT id, tenant_id, code, name, is_active, is_deleted, version, created_at, updated_at, deleted_at
            FROM lookup_values WHERE type_code = 'venue_type';
        """))

        # Recreate event_types
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS event_types (
                id VARCHAR NOT NULL PRIMARY KEY,
                tenant_id VARCHAR NOT NULL,
                code VARCHAR NOT NULL,
                name VARCHAR NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                is_deleted BOOLEAN DEFAULT FALSE,
                version INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE,
                updated_at TIMESTAMP WITH TIME ZONE,
                deleted_at TIMESTAMP WITH TIME ZONE
            );
        """))
        conn.execute(text("""
            INSERT INTO event_types (id, tenant_id, code, name, is_active, is_deleted, version, created_at, updated_at, deleted_at)
            SELECT id, tenant_id, code, name, is_active, is_deleted, version, created_at, updated_at, deleted_at
            FROM lookup_values WHERE type_code = 'event_type';
        """))

        # Drop lookup_values
        conn.execute(text("DROP TABLE IF EXISTS lookup_values CASCADE;"))

        conn.commit()


if __name__ == "__main__":
    print("🚀 Running migration 033: Consolidate lookup tables")
    try:
        upgrade()
        print("✅ Migration completed successfully!")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise
