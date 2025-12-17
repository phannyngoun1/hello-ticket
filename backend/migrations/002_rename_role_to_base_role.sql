-- Migration: Rename 'role' column to 'base_role' in users table
-- Date: 2025-10-25
-- Description: Update users table to use 'base_role' instead of 'role' 
--              to better distinguish between base system roles and 
--              additional custom roles.

-- Rename the column from 'role' to 'base_role'
ALTER TABLE users RENAME COLUMN role TO base_role;

-- Drop the old index
DROP INDEX IF EXISTS ix_users_role;

-- Create new index with correct name
CREATE INDEX ix_users_base_role ON users(base_role);

-- Verify the change
-- \d users

