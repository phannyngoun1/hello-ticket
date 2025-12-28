-- Migration 027: Remove paid_amount column from tickets table
-- Description: Removes paid_amount column as payment details will be handled by the booking module
-- Date: 2025-01-XX

-- Remove the paid_amount column
ALTER TABLE tickets 
DROP COLUMN IF EXISTS paid_amount;

