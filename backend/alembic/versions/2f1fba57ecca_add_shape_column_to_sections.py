"""add_shape_column_to_sections

Revision ID: 2f1fba57ecca
Revises: 0890508d4029
Create Date: 2026-01-04 10:45:00.339318

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '2f1fba57ecca'
down_revision = '0890508d4029'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add shape column to sections table as JSONB
    op.add_column('sections', sa.Column('shape', postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    # Remove shape column from sections table
    op.drop_column('sections', 'shape')

