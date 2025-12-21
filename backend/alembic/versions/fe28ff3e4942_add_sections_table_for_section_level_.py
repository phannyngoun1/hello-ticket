"""Add sections table for section-level layouts

Revision ID: fe28ff3e4942
Revises: b427d8a828cb
Create Date: 2025-12-21 12:52:06.596029

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'fe28ff3e4942'
down_revision = 'b427d8a828cb'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create sections table
    op.create_table(
        'sections',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('tenant_id', sa.String(), nullable=False),
        sa.Column('layout_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('x_coordinate', sa.Float(), nullable=True),
        sa.Column('y_coordinate', sa.Float(), nullable=True),
        sa.Column('file_id', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('version', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['layout_id'], ['layouts.id'], ),
        sa.ForeignKeyConstraint(['file_id'], ['file_uploads.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('ix_sections_layout', 'sections', ['tenant_id', 'layout_id'])
    op.create_index('ix_sections_layout_name', 'sections', ['layout_id', 'name'], unique=True)
    op.create_index('ix_sections_tenant_active', 'sections', ['tenant_id', 'is_active'])
    op.create_index('ix_sections_tenant_deleted', 'sections', ['tenant_id', 'is_deleted'])
    op.create_index('ix_sections_tenant_id', 'sections', ['tenant_id'])
    op.create_index('ix_sections_layout_id', 'sections', ['layout_id'])
    op.create_index('ix_sections_file_id', 'sections', ['file_id'])
    op.create_index('ix_sections_is_active', 'sections', ['is_active'])
    op.create_index('ix_sections_is_deleted', 'sections', ['is_deleted'])
    op.create_index('ix_sections_name', 'sections', ['name'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_sections_name', table_name='sections')
    op.drop_index('ix_sections_is_deleted', table_name='sections')
    op.drop_index('ix_sections_is_active', table_name='sections')
    op.drop_index('ix_sections_file_id', table_name='sections')
    op.drop_index('ix_sections_layout_id', table_name='sections')
    op.drop_index('ix_sections_tenant_id', table_name='sections')
    op.drop_index('ix_sections_tenant_deleted', table_name='sections')
    op.drop_index('ix_sections_tenant_active', table_name='sections')
    op.drop_index('ix_sections_layout_name', table_name='sections')
    op.drop_index('ix_sections_layout', table_name='sections')
    
    # Drop table
    op.drop_table('sections')


