-- Migration: Add item_code and item_name to purchase_order_lines
-- Date: 2025-01-XX
-- Description: Add item_code and item_name columns to purchase_order_lines table for human-readable item references

-- Upgrade
ALTER TABLE purchase_order_lines ADD COLUMN item_code VARCHAR;
ALTER TABLE purchase_order_lines ADD COLUMN item_name VARCHAR;

-- Downgrade
-- ALTER TABLE purchase_order_lines DROP COLUMN item_name;
-- ALTER TABLE purchase_order_lines DROP COLUMN item_code;

