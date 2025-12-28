-- Migration 028: Fix ticket price columns
-- Description: Adds price column and removes price_paid to match the model
-- Date: 2025-01-XX

-- Add price column if it doesn't exist
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) NOT NULL DEFAULT 0.0;

-- Update existing records: set price = price_paid (for backward compatibility)
UPDATE tickets 
SET price = price_paid 
WHERE price = 0.0 AND price_paid > 0;

-- Remove price_paid column (if it exists)
ALTER TABLE tickets 
DROP COLUMN IF EXISTS price_paid;

-- Add comment
COMMENT ON COLUMN tickets.price IS 'Ticket price';

