-- Migration 032: Add parent entity columns to audit_logs table
--
-- This migration adds parent_entity_type and parent_entity_id columns to the audit_logs table
-- to support hierarchical entity relationships (e.g., events belonging to shows).
--
-- This allows querying audit logs for a parent entity to also include logs from child entities.
-- For example, when viewing a "show", the audit logs can include "event" logs that have
-- the show as their parent entity.

-- Add parent_entity_type column
ALTER TABLE audit_logs
ADD COLUMN
IF NOT EXISTS parent_entity_type VARCHAR
(100);

-- Add parent_entity_id column
ALTER TABLE audit_logs
ADD COLUMN
IF NOT EXISTS parent_entity_id VARCHAR
(255);

-- Create index for querying by parent entity
CREATE INDEX
IF NOT EXISTS ix_audit_logs_parent_entity
ON audit_logs
(parent_entity_type, parent_entity_id, event_timestamp DESC)
WHERE parent_entity_type IS NOT NULL;
