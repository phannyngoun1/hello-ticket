"""Initial migration - create all tables from current models (fresh DB)

Revision ID: 0001_initial
Revises:
Create Date: 2026-02-08

Single migration for fresh deployments. Creates all platform and operational tables
from current SQLModel definitions. Use this when starting with an empty database.
"""
from alembic import op


# revision identifiers, used by Alembic.
revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create all tables from current models. Uses app's create_* functions
    (own connections) to avoid Alembic transaction conflicts."""
    from app.infrastructure.shared.database.platform_connection import create_platform_db_and_tables
    from app.infrastructure.shared.database.connection import create_db_and_tables

    create_platform_db_and_tables()
    create_db_and_tables()


def downgrade() -> None:
    """Drop all tables. Use only for development/reset - data will be lost."""
    from app.infrastructure.shared.database.connection import engine
    from app.infrastructure.shared.database.platform_connection import platform_engine
    from app.infrastructure.shared.database.models import operational_metadata
    from app.infrastructure.shared.database.platform_models import platform_metadata

    operational_metadata.drop_all(bind=engine, checkfirst=True)
    platform_metadata.drop_all(bind=platform_engine, checkfirst=True)
