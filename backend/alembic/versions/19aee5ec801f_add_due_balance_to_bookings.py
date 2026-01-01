"""add_due_balance_to_bookings

Revision ID: 19aee5ec801f
Revises: 4f9eeb687a4e
Create Date: 2026-01-01 16:17:13.331455

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '19aee5ec801f'
down_revision = '4f9eeb687a4e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add due_balance column to bookings table
    op.add_column('bookings', sa.Column('due_balance', sa.Float(), nullable=False, server_default='0.0'))
    
    # For existing bookings, calculate due_balance = total_amount - total_paid
    # Sum all paid payments for each booking and subtract from total_amount
    op.execute("""
        UPDATE bookings b
        SET due_balance = b.total_amount - COALESCE(
            (SELECT SUM(p.amount) 
             FROM payments p 
             WHERE p.booking_id = b.id 
             AND p.status = 'paid'), 
            0
        )
    """)


def downgrade() -> None:
    # Drop due_balance column
    op.drop_column('bookings', 'due_balance')

