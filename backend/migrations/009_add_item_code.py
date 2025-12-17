"""Add optional ERP item code column to items table with unique index per tenant.

This script is used by manage_migrations.py to apply migrations programmatically.
"""

from sqlalchemy import text


def upgrade(conn):
    conn.execute(text("""
        ALTER TABLE items ADD COLUMN IF NOT EXISTS code VARCHAR(100);
    """))

    conn.execute(text("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE c.relname = 'ix_items_tenant_code'
                  AND n.nspname = 'public'
            ) THEN
                CREATE UNIQUE INDEX ix_items_tenant_code
                    ON items(tenant_id, code)
                    WHERE code IS NOT NULL;
            END IF;
        END$$;
    """))

    conn.execute(text("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE c.relname = 'ix_items_code'
                  AND n.nspname = 'public'
            ) THEN
                CREATE INDEX ix_items_code ON items(code);
            END IF;
        END$$;
    """))


def downgrade(conn):
    # Drop indexes if exist
    conn.execute(text("DROP INDEX IF EXISTS ix_items_code;"))
    conn.execute(text("DROP INDEX IF EXISTS ix_items_tenant_code;"))
    # Drop column
    conn.execute(text("ALTER TABLE items DROP COLUMN IF EXISTS code;"))


