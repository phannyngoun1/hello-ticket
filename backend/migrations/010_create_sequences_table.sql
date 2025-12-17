-- Migration: Create sequences table for document code generation
-- Date: 2025-01-XX
-- Description: Add sequence tracking table for generating document codes (PO, SO, WO, GR, IT, etc.)

CREATE TABLE IF NOT EXISTS sequences (
    id VARCHAR PRIMARY KEY,
    tenant_id VARCHAR NOT NULL,
    sequence_type VARCHAR NOT NULL,
    prefix VARCHAR NOT NULL DEFAULT '',
    digits INTEGER NOT NULL DEFAULT 6,
    current_value INTEGER NOT NULL DEFAULT 0,
    description VARCHAR,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS ix_sequences_id ON sequences(id);
CREATE INDEX IF NOT EXISTS ix_sequences_tenant_id ON sequences(tenant_id);
CREATE INDEX IF NOT EXISTS ix_sequences_sequence_type ON sequences(sequence_type);
CREATE UNIQUE INDEX IF NOT EXISTS ix_sequences_tenant_type ON sequences(tenant_id, sequence_type);

-- Add comments
COMMENT ON TABLE sequences IS 'Sequence counters for document code generation (PO, SO, WO, GR, IT, etc.)';
COMMENT ON COLUMN sequences.sequence_type IS 'Type of sequence: PO (Purchase Order), SO (Sales Order), WO (Work Order), GR (Goods Receipt), IT (Inventory Transfer), etc.';
COMMENT ON COLUMN sequences.prefix IS 'Prefix for the code, e.g., "PO-" for purchase orders';
COMMENT ON COLUMN sequences.digits IS 'Number of digits for the sequence number, e.g., 6 for "000001"';
COMMENT ON COLUMN sequences.current_value IS 'Current sequence number value';

