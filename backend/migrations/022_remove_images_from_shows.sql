-- Remove images column from shows table
-- Migration 022: Remove images JSONB column from shows table (replaced by show_images table)

-- Drop the images column
ALTER TABLE shows DROP COLUMN IF EXISTS images;

