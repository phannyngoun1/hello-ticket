-- Migration 007: Create Audit Logs Table
-- Description: Creates audit_logs table for activity tracking and compliance
-- Date: 2025-01-XX

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    event_id VARCHAR(255) NOT NULL UNIQUE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Event Classification
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    
    -- Entity Information
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    
    -- User Context
    user_id VARCHAR(255),
    user_email VARCHAR(255),
    session_id VARCHAR(255),
    
    -- Request Context
    request_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    
    -- Change Tracking
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    
    -- Metadata (named metadata_json to avoid SQLModel conflict)
    description TEXT NOT NULL DEFAULT '',
    metadata_json JSONB DEFAULT '{}',
    
    -- Compliance
    retention_period_days INTEGER NOT NULL DEFAULT 2555,
    is_pii BOOLEAN NOT NULL DEFAULT FALSE,
    is_sensitive BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS ix_audit_logs_tenant_timestamp 
    ON audit_logs(tenant_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS ix_audit_logs_entity 
    ON audit_logs(entity_type, entity_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS ix_audit_logs_user 
    ON audit_logs(user_id, timestamp DESC) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_audit_logs_event_type 
    ON audit_logs(event_type, timestamp DESC);

CREATE INDEX IF NOT EXISTS ix_audit_logs_event_id 
    ON audit_logs(event_id);

CREATE INDEX IF NOT EXISTS ix_audit_logs_tenant_id 
    ON audit_logs(tenant_id);

CREATE INDEX IF NOT EXISTS ix_audit_logs_is_pii 
    ON audit_logs(is_pii) WHERE is_pii = TRUE;

CREATE INDEX IF NOT EXISTS ix_audit_logs_is_sensitive 
    ON audit_logs(is_sensitive) WHERE is_sensitive = TRUE;

-- GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS ix_audit_logs_metadata_gin 
    ON audit_logs USING GIN (metadata_json);

-- Add comment
COMMENT ON TABLE audit_logs IS 'Audit log table for activity tracking and compliance (Phase 1 implementation)';
COMMENT ON COLUMN audit_logs.retention_period_days IS 'Retention period in days (default: 2555 = 7 years)';

