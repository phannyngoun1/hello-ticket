-- Migration: Create sessions table for session management
-- Date: 2025-10-13
-- Description: Add session tracking for multi-device login, session limits, and device restrictions

CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    tenant_id VARCHAR NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'active',
    
    -- Device information
    device_type VARCHAR NOT NULL,
    user_agent TEXT NOT NULL,
    ip_address VARCHAR NOT NULL,
    device_name VARCHAR,
    os VARCHAR,
    browser VARCHAR,
    
    -- Session lifecycle
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    last_activity_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Revocation tracking
    revoked_at TIMESTAMP,
    revoked_by VARCHAR,
    revocation_reason TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS ix_sessions_id ON sessions(id);
CREATE INDEX IF NOT EXISTS ix_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS ix_sessions_tenant_id ON sessions(tenant_id);
CREATE INDEX IF NOT EXISTS ix_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS ix_sessions_device_type ON sessions(device_type);
CREATE INDEX IF NOT EXISTS ix_sessions_ip_address ON sessions(ip_address);
CREATE INDEX IF NOT EXISTS ix_sessions_created_at ON sessions(created_at);
CREATE INDEX IF NOT EXISTS ix_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS ix_sessions_last_activity_at ON sessions(last_activity_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS ix_sessions_user_tenant ON sessions(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS ix_sessions_user_status ON sessions(user_id, status);
CREATE INDEX IF NOT EXISTS ix_sessions_tenant_status ON sessions(tenant_id, status);

-- Add comments
COMMENT ON TABLE sessions IS 'User session tracking for multi-device login management';
COMMENT ON COLUMN sessions.id IS 'Unique session identifier';
COMMENT ON COLUMN sessions.user_id IS 'User ID who owns this session';
COMMENT ON COLUMN sessions.tenant_id IS 'Tenant ID for multi-tenancy';
COMMENT ON COLUMN sessions.status IS 'Session status: active, expired, revoked, force_logout, device_restricted, max_sessions_exceeded';
COMMENT ON COLUMN sessions.device_type IS 'Device type: web, mobile, tablet, desktop, unknown';
COMMENT ON COLUMN sessions.expires_at IS 'Session expiration timestamp';
COMMENT ON COLUMN sessions.last_activity_at IS 'Last activity timestamp for idle timeout tracking';
COMMENT ON COLUMN sessions.revoked_by IS 'User ID who revoked this session (for admin force logout)';

