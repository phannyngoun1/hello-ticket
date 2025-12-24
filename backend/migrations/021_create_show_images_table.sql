-- Create show_images table
-- Migration 021: Create show_images table to store show images separately

-- Create show_images table
CREATE TABLE IF NOT EXISTS show_images (
    id VARCHAR(255) PRIMARY KEY,
    show_id VARCHAR(255) NOT NULL,
    tenant_id VARCHAR(255) NOT NULL,
    file_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_banner BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Foreign keys
    FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE,
    FOREIGN KEY (file_id) REFERENCES file_uploads(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS ix_show_images_show_id ON show_images (show_id);
CREATE INDEX IF NOT EXISTS ix_show_images_tenant_id ON show_images (tenant_id);
CREATE INDEX IF NOT EXISTS ix_show_images_file_id ON show_images (file_id);
CREATE INDEX IF NOT EXISTS ix_show_images_is_banner ON show_images (is_banner);

