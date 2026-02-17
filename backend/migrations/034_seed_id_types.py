"""
Migration 034: Seed default id_type values into lookup_values

Inserts passport, driver_license, national_id, other for each tenant.
"""

import uuid
from sqlalchemy import text
from datetime import datetime, timezone
from app.infrastructure.shared.database.connection import engine

DEFAULT_ID_TYPES = [
    ("passport", "Passport"),
    ("driver_license", "Driver's License"),
    ("national_id", "National ID"),
    ("other", "Other"),
]


def upgrade():
    """Seed id_type values for all tenants"""

    with engine.connect() as conn:
        # Get all tenant_ids - from lookup_values, customers, or tenants
        tenant_result = conn.execute(text("SELECT DISTINCT tenant_id FROM lookup_values"))
        tenants = [row[0] for row in tenant_result.fetchall() if row[0]]

        if not tenants:
            try:
                tenant_result = conn.execute(text("SELECT DISTINCT tenant_id FROM customers"))
                tenants = [row[0] for row in tenant_result.fetchall() if row[0]]
            except Exception:
                pass

        if not tenants:
            try:
                tenant_result = conn.execute(text("SELECT id FROM tenants"))
                tenants = [row[0] for row in tenant_result.fetchall() if row[0]]
            except Exception:
                pass

        now = datetime.now(timezone.utc).isoformat()

        for tenant_id in tenants:
            for code, name in DEFAULT_ID_TYPES:
                # Skip if already exists
                exists = conn.execute(
                    text("""
                        SELECT 1 FROM lookup_values
                        WHERE tenant_id = :tid AND type_code = 'id_type' AND code = :code
                    """),
                    {"tid": tenant_id, "code": code.upper()},
                ).fetchone()
                if exists:
                    continue

                conn.execute(
                    text("""
                        INSERT INTO lookup_values
                        (id, tenant_id, type_code, code, name, sort_order, is_active, is_deleted, version, created_at, updated_at, deleted_at)
                        VALUES (:id, :tenant_id, 'id_type', :code, :name, 0, true, false, 0, :now, :now, null)
                    """),
                    {
                        "id": str(uuid.uuid4()),
                        "tenant_id": tenant_id,
                        "code": code.upper(),
                        "name": name,
                        "now": now,
                    },
                )

        conn.commit()


def downgrade():
    """Remove id_type values (optional - leaves data intact)"""
    with engine.connect() as conn:
        conn.execute(text("DELETE FROM lookup_values WHERE type_code = 'id_type'"))
        conn.commit()


if __name__ == "__main__":
    print("🚀 Running migration 034: Seed id_type values")
    try:
        upgrade()
        print("✅ Migration completed successfully!")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise
