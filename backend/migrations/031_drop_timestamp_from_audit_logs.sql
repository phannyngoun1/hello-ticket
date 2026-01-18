-- Migration 031: Drop timestamp column from audit_logs table
-- Description: Removes timestamp column and updates indexes to use event_timestamp
-- Date: 2025-01-XX

-- Add event_timestamp column if it doesn't exist
ALTER TABLE audit_logs ADD COLUMN
IF NOT EXISTS event_timestamp TIMESTAMPTZ;

-- Copy timestamp values to event_timestamp for existing records
UPDATE audit_logs
SET event_timestamp = timestamp
WHERE event_timestamp IS NULL AND timestamp IS NOT NULL;

-- Make event_timestamp NOT NULL after populating it
ALTER TABLE audit_logs ALTER COLUMN event_timestamp
SET
NOT NULL;

-- Drop old indexes that reference timestamp
DROP INDEX IF EXISTS ix_audit_logs_tenant_timestamp;
DROP INDEX IF EXISTS ix_audit_logs_entity;
DROP INDEX IF EXISTS ix_audit_logs_user;
DROP INDEX IF EXISTS ix_audit_logs_event_type;

-- Create new indexes using event_timestamp
CREATE INDEX
IF NOT EXISTS ix_audit_logs_tenant_event_timestamp
    ON audit_logs
(tenant_id, event_timestamp DESC);

CREATE INDEX
IF NOT EXISTS ix_audit_logs_entity
    ON audit_logs
(entity_type, entity_id, event_timestamp DESC);

CREATE INDEX
IF NOT EXISTS ix_audit_logs_user
    ON audit_logs
(user_id, event_timestamp DESC) WHERE user_id IS NOT NULL;

CREATE INDEX
IF NOT EXISTS ix_audit_logs_event_type
    ON audit_logs
(event_type, event_timestamp DESC);

-- Finally drop the timestamp column
ALTER TABLE audit_logs DROP COLUMN IF EXISTS timestamp;