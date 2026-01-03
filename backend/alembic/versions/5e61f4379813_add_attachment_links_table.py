"""add_attachment_links_table

Revision ID: 5e61f4379813
Revises: bc5e5583159c
Create Date: 2026-01-03 15:15:27.170033

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5e61f4379813'
down_revision = 'bc5e5583159c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create attachment_links table
    op.create_table(
        'attachment_links',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('tenant_id', sa.String(), nullable=False),
        sa.Column('file_upload_id', sa.String(), nullable=False),
        sa.Column('entity_type', sa.String(), nullable=False),  # e.g., "customer", "event", "booking"
        sa.Column('entity_id', sa.String(), nullable=False),  # ID of the linked entity
        sa.Column('attachment_type', sa.String(), nullable=False, server_default='document'),  # e.g., "profile_photo", "document", "contract"
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['file_upload_id'], ['file_uploads.id'], ondelete='CASCADE')
    )
    op.create_index('ix_attachment_links_tenant_id', 'attachment_links', ['tenant_id'])
    op.create_index('ix_attachment_links_file_upload_id', 'attachment_links', ['file_upload_id'])
    op.create_index('ix_attachment_links_entity_type', 'attachment_links', ['entity_type'])
    op.create_index('ix_attachment_links_entity_id', 'attachment_links', ['entity_id'])
    op.create_index('ix_attachment_links_attachment_type', 'attachment_links', ['attachment_type'])
    op.create_index('ix_attachment_links_tenant_file', 'attachment_links', ['tenant_id', 'file_upload_id'])
    op.create_index('ix_attachment_links_entity', 'attachment_links', ['entity_type', 'entity_id'])
    op.create_index('ix_attachment_links_tenant_entity', 'attachment_links', ['tenant_id', 'entity_type', 'entity_id'])
    op.create_index('ix_attachment_links_type', 'attachment_links', ['tenant_id', 'entity_type', 'entity_id', 'attachment_type'])
    op.create_index('ix_attachment_links_unique', 'attachment_links', ['file_upload_id', 'entity_type', 'entity_id'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_attachment_links_unique', table_name='attachment_links')
    op.drop_index('ix_attachment_links_type', table_name='attachment_links')
    op.drop_index('ix_attachment_links_tenant_entity', table_name='attachment_links')
    op.drop_index('ix_attachment_links_entity', table_name='attachment_links')
    op.drop_index('ix_attachment_links_tenant_file', table_name='attachment_links')
    op.drop_index('ix_attachment_links_attachment_type', table_name='attachment_links')
    op.drop_index('ix_attachment_links_entity_id', table_name='attachment_links')
    op.drop_index('ix_attachment_links_entity_type', table_name='attachment_links')
    op.drop_index('ix_attachment_links_file_upload_id', table_name='attachment_links')
    op.drop_index('ix_attachment_links_tenant_id', table_name='attachment_links')
    op.drop_table('attachment_links')
