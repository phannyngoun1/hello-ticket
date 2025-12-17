-- Migration: Convert all timestamp columns to TIMESTAMP WITH TIME ZONE
-- Date: 2025-10-25
-- Description: Update all timestamp columns from TIMESTAMP WITHOUT TIME ZONE 
--              to TIMESTAMP WITH TIME ZONE for proper timezone handling
--              This fixes asyncpg errors with timezone-aware datetime objects

-- Update roles table
ALTER TABLE roles 
  ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE,
  ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- Update groups table
ALTER TABLE groups 
  ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE,
  ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- Update user_groups table
ALTER TABLE user_groups 
  ALTER COLUMN added_at TYPE TIMESTAMP WITH TIME ZONE;

-- Update users table
ALTER TABLE users 
  ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE,
  ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE,
  ALTER COLUMN last_login TYPE TIMESTAMP WITH TIME ZONE,
  ALTER COLUMN locked_until TYPE TIMESTAMP WITH TIME ZONE;

-- Update tenants table
ALTER TABLE tenants 
  ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE,
  ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- Update tenant_subscriptions table
ALTER TABLE tenant_subscriptions 
  ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE,
  ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- Update sessions table
ALTER TABLE sessions 
  ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE,
  ALTER COLUMN expires_at TYPE TIMESTAMP WITH TIME ZONE,
  ALTER COLUMN last_activity_at TYPE TIMESTAMP WITH TIME ZONE,
  ALTER COLUMN revoked_at TYPE TIMESTAMP WITH TIME ZONE;

