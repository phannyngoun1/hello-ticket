"""add_shape_column_to_seats

Revision ID: 0a9027a34aba
Revises: 2f1fba57ecca
Create Date: 2026-01-04 11:00:39.422167

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '0a9027a34aba'
down_revision = '2f1fba57ecca'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add shape column to seats table as JSONB
    op.add_column('seats', sa.Column('shape', postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    # Remove shape column from seats table
    op.drop_column('seats', 'shape')

