"""add_venue_details_fields

Revision ID: bedc3fbbdbd0
Revises: 5e61f4379813
Create Date: 2025-01-21 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'bedc3fbbdbd0'
down_revision = '5e61f4379813'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns to venues table
    op.add_column('venues', sa.Column('venue_type', sa.String(), nullable=True))
    op.add_column('venues', sa.Column('capacity', sa.Integer(), nullable=True))
    op.add_column('venues', sa.Column('parking_info', sa.String(), nullable=True))
    op.add_column('venues', sa.Column('accessibility', sa.String(), nullable=True))
    op.add_column('venues', sa.Column('amenities', postgresql.ARRAY(sa.String()), nullable=True))
    op.add_column('venues', sa.Column('opening_hours', sa.String(), nullable=True))


def downgrade() -> None:
    # Remove columns from venues table
    op.drop_column('venues', 'opening_hours')
    op.drop_column('venues', 'amenities')
    op.drop_column('venues', 'accessibility')
    op.drop_column('venues', 'parking_info')
    op.drop_column('venues', 'capacity')
    op.drop_column('venues', 'venue_type')

