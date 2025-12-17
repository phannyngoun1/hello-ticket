-- Migration 008: Add Optimized Indexes for User Activity Queries
-- Description: Adds composite indexes optimized for user activity queries
-- Date: 2025-11-02

-- Composite index for user activity queries (most common pattern)
-- Covers: user_id + event_type + timestamp
CREATE INDEX IF NOT EXISTS ix_audit_logs_user_activity 
    ON audit_logs(user_id, event_type, timestamp DESC)
    WHERE event_type IN ('login', 'logout', 'read', 'update', 'create', 'delete');

-- Index for session activity queries
CREATE INDEX IF NOT EXISTS ix_audit_logs_session_activity 
    ON audit_logs(session_id, timestamp ASC)
    WHERE session_id IS NOT NULL;

-- Index for recent activity queries (user_id + timestamp, covers recent queries efficiently)
-- Note: We don't use NOW() in WHERE clause (not allowed in partial indexes)
-- The main user_id + timestamp index handles recent queries well
CREATE INDEX IF NOT EXISTS ix_audit_logs_user_recent 
    ON audit_logs(user_id, timestamp DESC);

-- Partial index for login/logout events (high frequency)
CREATE INDEX IF NOT EXISTS ix_audit_logs_auth_events 
    ON audit_logs(user_id, timestamp DESC)
    WHERE event_type IN ('login', 'logout');

-- Comments
COMMENT ON INDEX ix_audit_logs_user_activity IS 'Optimized for user activity feed queries';
COMMENT ON INDEX ix_audit_logs_session_activity IS 'Optimized for session timeline queries';
COMMENT ON INDEX ix_audit_logs_user_recent IS 'Optimized for recent activity queries (user_id + timestamp)';
COMMENT ON INDEX ix_audit_logs_auth_events IS 'Optimized for login/logout history queries';

