-- Migration 026: Rename price_paid column to paid_amount in tickets table
-- Description: Renames price_paid column to paid_amount for better clarity
-- Date: 2025-01-XX

-- Rename the column
ALTER TABLE tickets 
RENAME COLUMN price_paid TO paid_amount;

-- Update comment
COMMENT ON COLUMN tickets.paid_amount IS 'Actual amount paid (may differ from price due to discounts, fees, etc.)';

