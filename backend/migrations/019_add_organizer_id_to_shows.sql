-- Add organizer_id column to shows table
-- Migration 019: Add organizer_id field to link shows to organizers

-- Add the column (nullable, with index and foreign key)
ALTER TABLE shows ADD COLUMN organizer_id TEXT;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS ix_shows_organizer_id ON shows (organizer_id);

-- Add foreign key constraint to organizers table
ALTER TABLE shows ADD CONSTRAINT fk_shows_organizer_id 
    FOREIGN KEY (organizer_id) REFERENCES organizers(id);

