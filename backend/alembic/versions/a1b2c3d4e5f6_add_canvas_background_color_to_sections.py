"""Add canvas_background_color to sections

Revision ID: a1b2c3d4e5f6
Revises: fb9036cd7340
Create Date: 2026-02-10

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f6"
down_revision = "fb9036cd7340"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "sections",
        sa.Column("canvas_background_color", sa.String(), nullable=True),
    )
    # Set default for existing rows
    op.execute(
        "UPDATE sections SET canvas_background_color = '#e5e7eb' WHERE canvas_background_color IS NULL"
    )


def downgrade() -> None:
    op.drop_column("sections", "canvas_background_color")
