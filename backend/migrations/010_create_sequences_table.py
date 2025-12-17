"""
Migration: Create sequences table for document code generation
Date: 2025-01-XX
Description: Add sequence tracking table for generating document codes (PO, SO, WO, GR, IT, etc.)
"""

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.create_table(
        'sequences',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('tenant_id', sa.String(), nullable=False),
        sa.Column('sequence_type', sa.String(), nullable=False),
        sa.Column('prefix', sa.String(), nullable=False, server_default=''),
        sa.Column('digits', sa.Integer(), nullable=False, server_default='6'),
        sa.Column('current_value', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index('ix_sequences_tenant_id', 'sequences', ['tenant_id'])
    op.create_index('ix_sequences_sequence_type', 'sequences', ['sequence_type'])
    op.create_index('ix_sequences_tenant_type', 'sequences', ['tenant_id', 'sequence_type'], unique=True)
    
    op.create_index('ix_sequences_id', 'sequences', ['id'])


def downgrade():
    op.drop_index('ix_sequences_id', table_name='sequences')
    op.drop_index('ix_sequences_tenant_type', table_name='sequences')
    op.drop_index('ix_sequences_sequence_type', table_name='sequences')
    op.drop_index('ix_sequences_tenant_id', table_name='sequences')
    op.drop_table('sequences')

