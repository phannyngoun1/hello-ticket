"""remove_ticket_code_from_event_seats

Revision ID: e24e85d8b184
Revises: 33e608eb1b98
Create Date: 2025-12-27 17:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e24e85d8b184'
down_revision = '33e608eb1b98'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Remove ticket_code column and its index from event_seats table"""
    # Drop the index first
    op.drop_index(op.f('ix_event_seats_ticket_code'), table_name='event_seats')
    # Drop the column
    op.drop_column('event_seats', 'ticket_code')


def downgrade() -> None:
    """Restore ticket_code column and its index"""
    # Add the column back
    op.add_column('event_seats', sa.Column('ticket_code', sa.String(), nullable=True))
    # Recreate the index
    op.create_index(op.f('ix_event_seats_ticket_code'), 'event_seats', ['ticket_code'], unique=False)

