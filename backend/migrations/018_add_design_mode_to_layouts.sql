-- Add design_mode column to layouts table
-- Migration 018: Add design_mode field to support seat-level and section-level layout design

-- Add the column with default value
ALTER TABLE layouts ADD COLUMN design_mode TEXT NOT NULL DEFAULT 'seat-level';

-- Add a check constraint to ensure only valid values
ALTER TABLE layouts ADD CONSTRAINT check_design_mode 
    CHECK (design_mode IN ('seat-level', 'section-level'));

-- Create an index for faster filtering by design_mode
CREATE INDEX IF NOT EXISTS ix_layouts_design_mode ON layouts (design_mode);

