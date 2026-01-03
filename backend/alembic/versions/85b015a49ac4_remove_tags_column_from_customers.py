"""remove_tags_column_from_customers

Revision ID: 85b015a49ac4
Revises: 8d42f734e4b7
Create Date: 2026-01-03 13:29:16.412655

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '85b015a49ac4'
down_revision = '8d42f734e4b7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Remove tags column from customers table
    # Tags are now managed via TagLink table
    op.drop_column('customers', 'tags')


def downgrade() -> None:
    # Re-add tags column if needed (array of strings)
    from sqlalchemy.dialects.postgresql import ARRAY as PG_ARRAY
    op.add_column('customers', 
        sa.Column('tags', PG_ARRAY(sa.String()), nullable=True)
    )

