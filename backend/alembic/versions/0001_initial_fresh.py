"""Initial migration - version stamp only (tables created at app startup)

Revision ID: 0001_initial
Revises:
Create Date: 2026-02-08

Tables are created at application startup via create_platform_db_and_tables()
and create_db_and_tables() in the same process that serves requests. This
migration only records the schema version for Alembic. Run the app once to
create tables; "alembic upgrade head" is optional (e.g. for CI or future migrations).
"""
from alembic import op


# revision identifiers, used by Alembic.
revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """No-op. Platform and operational tables are created at app startup."""
    pass


def downgrade() -> None:
    """No-op. Drop tables manually if needed for dev reset."""
    pass
