"""fix_payment_status_enum_values

Revision ID: a13e9eb26c99
Revises: fb37ac4cb659
Create Date: 2026-01-01 16:45:21.868277

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a13e9eb26c99'
down_revision = 'fb37ac4cb659'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Convert payments.status from PostgreSQL enum type to VARCHAR
    # This aligns with native_enum=False which should use VARCHAR, not a database enum type
    # The enum type was incorrectly created by a previous migration using sa.Enum()
    
    # Convert the column from enum type to VARCHAR
    # PostgreSQL requires casting through text when converting from enum to text
    op.execute("""
        ALTER TABLE payments 
        ALTER COLUMN status TYPE VARCHAR USING status::text
    """)


def downgrade() -> None:
    # Revert: Convert back to enum type
    # First recreate the enum type with the original values
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE paymentstatusenum AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # Convert the column back to enum type
    # Only convert valid enum values, default others to 'completed'
    op.execute("""
        ALTER TABLE payments 
        ALTER COLUMN status TYPE paymentstatusenum 
        USING CASE 
            WHEN status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled') 
            THEN status::paymentstatusenum
            ELSE 'completed'::paymentstatusenum
        END
    """)

