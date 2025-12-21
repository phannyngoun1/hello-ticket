-- Migration 016: Change layout image_url to file_id
-- Description: Renames image_url column to file_id and adds foreign key constraint to file_uploads table
-- Date: 2025-01-XX

-- Rename column from image_url to file_id
ALTER TABLE layouts RENAME COLUMN image_url TO file_id;

-- Add foreign key constraint to file_uploads table
ALTER TABLE layouts 
    ADD CONSTRAINT fk_layouts_file_id 
    FOREIGN KEY (file_id) 
    REFERENCES file_uploads(id) 
    ON DELETE SET NULL;

-- Create index for file_id if it doesn't exist (it should already exist from the model definition)
CREATE INDEX
IF NOT EXISTS ix_layouts_file_id ON layouts
(file_id);
