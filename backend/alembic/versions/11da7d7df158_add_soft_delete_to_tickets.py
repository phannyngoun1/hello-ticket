"""add_soft_delete_to_tickets

Revision ID: 11da7d7df158
Revises: e7dc2695e428
Create Date: 2026-01-11 14:29:02.574484

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '11da7d7df158'
down_revision = 'e7dc2695e428'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add is_deleted column to tickets table
    op.add_column('tickets', sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    op.create_index('ix_tickets_is_deleted', 'tickets', ['is_deleted'], unique=False)
    op.create_index('ix_tickets_tenant_deleted', 'tickets', ['tenant_id', 'is_deleted'], unique=False)


def downgrade() -> None:
    # Remove is_deleted column and indexes from tickets table
    op.drop_index('ix_tickets_tenant_deleted', table_name='tickets')
    op.drop_index('ix_tickets_is_deleted', table_name='tickets')
    op.drop_column('tickets', 'is_deleted')

