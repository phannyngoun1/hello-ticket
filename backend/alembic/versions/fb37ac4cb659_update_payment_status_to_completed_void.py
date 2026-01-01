"""update_payment_status_to_completed_void

Revision ID: fb37ac4cb659
Revises: 19aee5ec801f
Create Date: 2026-01-01 16:35:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'fb37ac4cb659'
down_revision = '19aee5ec801f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Update payments table: convert old status values to COMPLETED or VOID
    # Map old statuses to new ones:
    # - 'paid' -> 'completed'
    # - 'pending' -> 'completed' (pending payments are treated as completed when created)
    # - 'processing' -> 'completed'
    # - 'completed' -> 'completed' (already correct)
    # - 'cancelled' -> 'void'
    # - 'refunded' -> 'void' (refunded payments are voided)
    # - 'failed' -> 'void' (failed payments are voided)
    
    op.execute("""
        UPDATE payments 
        SET status = CASE 
            WHEN status IN ('paid', 'pending', 'processing', 'completed') THEN 'completed'
            WHEN status IN ('cancelled', 'refunded', 'failed') THEN 'void'
            ELSE 'completed'
        END
    """)


def downgrade() -> None:
    # Revert payments table: convert COMPLETED/VOID back to old statuses
    # This is a best-effort revert - we can't know which original status they had
    # So we map: 'completed' -> 'paid', 'void' -> 'cancelled'
    op.execute("""
        UPDATE payments 
        SET status = CASE 
            WHEN status = 'completed' THEN 'paid'
            WHEN status = 'void' THEN 'cancelled'
            ELSE status
        END
    """)
