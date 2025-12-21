-- Migration 015: Create File Uploads Table
-- Description: Creates file_uploads table for tracking uploaded files
-- Date: 2025-01-XX

-- Create file_uploads table
CREATE TABLE
IF NOT EXISTS file_uploads
(
    id VARCHAR
(255) PRIMARY KEY,
    tenant_id VARCHAR
(255) NOT NULL,
    filename VARCHAR
(255) NOT NULL,
    original_name VARCHAR
(255) NOT NULL,
    mime_type VARCHAR
(100) NOT NULL,
    size INTEGER NOT NULL,
    url VARCHAR
(500) NOT NULL,
    uploaded_by VARCHAR
(255),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
()
);

-- Create indexes for performance
CREATE INDEX
IF NOT EXISTS ix_file_uploads_tenant_id 
    ON file_uploads
(tenant_id, uploaded_at DESC);

CREATE INDEX
IF NOT EXISTS ix_file_uploads_uploaded_by 
    ON file_uploads
(tenant_id, uploaded_by);

CREATE UNIQUE INDEX
IF NOT EXISTS ix_file_uploads_filename 
    ON file_uploads
(tenant_id, filename);
