"""add_payment_code_to_payments

Revision ID: 68fad28b3dfd
Revises: ad260265bbe7
Create Date: 2026-01-01 15:25:53.443605

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '68fad28b3dfd'
down_revision = 'ad260265bbe7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add payment_code column to payments table
    op.add_column('payments', sa.Column('payment_code', sa.String(), nullable=True))
    # Create index on payment_code for faster lookups
    op.create_index(op.f('ix_payments_payment_code'), 'payments', ['payment_code'], unique=False)


def downgrade() -> None:
    # Drop index and column
    op.drop_index(op.f('ix_payments_payment_code'), table_name='payments')
    op.drop_column('payments', 'payment_code')

