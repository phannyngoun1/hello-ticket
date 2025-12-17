-- Migration 014: Create Putaway Locations Table
-- Description: Creates putaway_locations table to store planned putaway locations for goods receipt line items

CREATE TABLE IF NOT EXISTS putaway_locations (
    id VARCHAR PRIMARY KEY,
    tenant_id VARCHAR NOT NULL,
    goods_receipt_line_id VARCHAR NOT NULL,
    location_id VARCHAR NOT NULL,
    quantity DECIMAL NOT NULL,
    uom VARCHAR NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'planned',
    sequence_order INTEGER DEFAULT 0,
    executed_at TIMESTAMP WITH TIME ZONE,
    executed_by VARCHAR,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign keys
    CONSTRAINT fk_putaway_goods_receipt_line 
        FOREIGN KEY (goods_receipt_line_id) 
        REFERENCES goods_receipt_lines(id) ON DELETE CASCADE,
    CONSTRAINT fk_putaway_location 
        FOREIGN KEY (location_id) 
        REFERENCES store_locations(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_putaway_tenant_line ON putaway_locations(tenant_id, goods_receipt_line_id);
CREATE INDEX IF NOT EXISTS idx_putaway_status ON putaway_locations(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_putaway_location ON putaway_locations(tenant_id, location_id);

-- Add comment to table
COMMENT ON TABLE putaway_locations IS 'Stores planned putaway locations for goods receipt line items';
COMMENT ON COLUMN putaway_locations.status IS 'Status: planned, in_progress, completed, cancelled';
COMMENT ON COLUMN putaway_locations.sequence_order IS 'Execution order (0 = first, 1 = second, etc.)';
