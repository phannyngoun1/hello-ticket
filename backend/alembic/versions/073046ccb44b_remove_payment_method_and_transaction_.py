"""remove_payment_method_and_transaction_id_from_bookings

Revision ID: 073046ccb44b
Revises: 7d839042cd2a
Create Date: 2026-01-01 11:13:52.875250

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel
import sqlmodel


# revision identifiers, used by Alembic.
revision = '073046ccb44b'
down_revision = '7d839042cd2a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop index on payment_transaction_id
    try:
        op.drop_index('ix_bookings_payment_transaction_id', table_name='bookings')
    except Exception:
        pass
    
    # Drop payment_method and payment_transaction_id columns
    op.drop_column('bookings', 'payment_method')
    op.drop_column('bookings', 'payment_transaction_id')


def downgrade() -> None:
    # Re-add columns (for rollback purposes)
    op.add_column('bookings', sa.Column('payment_method', sa.Enum('CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'BANK_TRANSFER', 'CASH', 'OTHER', name='paymentmethodenum', native_enum=False), nullable=True))
    op.add_column('bookings', sa.Column('payment_transaction_id', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.create_index(op.f('ix_bookings_payment_transaction_id'), 'bookings', ['payment_transaction_id'], unique=False)

