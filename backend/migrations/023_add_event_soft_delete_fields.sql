-- Migration 023: Add soft delete and configuration fields to events table
-- Description: Adds configuration_type, is_deleted, version, and deleted_at columns to events table
-- Date: 2025-01-XX

-- Add configuration_type column (VARCHAR with default 'seat_setup')
ALTER TABLE events ADD COLUMN IF NOT EXISTS configuration_type VARCHAR DEFAULT 'seat_setup';

-- Add is_deleted column (BOOLEAN with default false)
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Add version column (INTEGER with default 0)
ALTER TABLE events ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 0;

-- Add deleted_at column (TIMESTAMP WITH TIME ZONE, nullable)
ALTER TABLE events ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS ix_events_tenant_configuration ON events(tenant_id, configuration_type);
CREATE INDEX IF NOT EXISTS ix_events_tenant_deleted ON events(tenant_id, is_deleted);
CREATE INDEX IF NOT EXISTS ix_events_tenant_active ON events(tenant_id, is_active);

-- Update existing rows to have default values
UPDATE events SET configuration_type = 'seat_setup' WHERE configuration_type IS NULL;
UPDATE events SET is_deleted = false WHERE is_deleted IS NULL;
UPDATE events SET version = 0 WHERE version IS NULL;

