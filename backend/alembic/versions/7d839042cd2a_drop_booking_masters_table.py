"""drop_booking_masters_table

Revision ID: 7d839042cd2a
Revises: d38b344f701d
Create Date: 2026-01-01 11:07:45.147694

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7d839042cd2a'
down_revision = 'd38b344f701d'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop booking_masters table if it exists (orphaned table from old booking master data model)
    from sqlalchemy import inspect
    bind = op.get_bind()
    inspector = inspect(bind)
    
    if 'booking_masters' in inspector.get_table_names():
        # Check for any indexes on the table
        indexes = inspector.get_indexes('booking_masters')
        for index in indexes:
            try:
                op.drop_index(index['name'], table_name='booking_masters')
            except Exception:
                pass
        
        # Drop the table
        op.drop_table('booking_masters')


def downgrade() -> None:
    # Cannot restore booking_masters table without knowing its original structure
    # This table was part of the old booking master data model that was consolidated
    pass

