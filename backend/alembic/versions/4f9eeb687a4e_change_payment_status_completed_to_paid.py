"""change_payment_status_completed_to_paid

Revision ID: 4f9eeb687a4e
Revises: 68fad28b3dfd
Create Date: 2026-01-01 16:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4f9eeb687a4e'
down_revision = '68fad28b3dfd'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Update payments table: change 'completed' status to 'paid'
    op.execute("""
        UPDATE payments 
        SET status = 'paid' 
        WHERE status = 'completed'
    """)
    
    # Update bookings table: change 'completed' payment_status to 'paid'
    op.execute("""
        UPDATE bookings 
        SET payment_status = 'paid' 
        WHERE payment_status = 'completed'
    """)
    
    # Note: Since we're using native_enum=False, the enum values are stored as VARCHAR
    # The actual enum type definition in the database doesn't need to be changed,
    # but we update all existing data from 'completed' to 'paid'
    # New values will be 'paid' going forward based on the Python enum definition


def downgrade() -> None:
    # Revert payments table: change 'paid' status back to 'completed'
    op.execute("""
        UPDATE payments 
        SET status = 'completed' 
        WHERE status = 'paid'
    """)
    
    # Revert bookings table: change 'paid' payment_status back to 'completed'
    op.execute("""
        UPDATE bookings 
        SET payment_status = 'completed' 
        WHERE payment_status = 'paid'
    """)
