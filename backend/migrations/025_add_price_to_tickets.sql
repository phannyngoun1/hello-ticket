-- Migration 025: Add price column to tickets table
-- Description: Adds price column to store original ticket price (separate from price_paid which may differ due to discounts)
-- Date: 2025-01-XX

-- Add price column (original ticket price)
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) NOT NULL DEFAULT 0.0;

-- Update existing records: set price = price_paid (for backward compatibility)
UPDATE tickets 
SET price = price_paid 
WHERE price = 0.0 AND price_paid > 0;

-- Add comment to clarify the difference
COMMENT ON COLUMN tickets.price IS 'Original ticket price (before discounts/fees)';
COMMENT ON COLUMN tickets.price_paid IS 'Actual amount paid (may differ from price due to discounts, fees, etc.)';

