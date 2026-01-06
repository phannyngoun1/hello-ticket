-- Add detailed fields to organizers table
-- Migration 030: Add description, email, phone, website, address, city, country, logo

ALTER TABLE organizers ADD COLUMN IF NOT EXISTS description VARCHAR(2000);
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS email VARCHAR;
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS phone VARCHAR;
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS website VARCHAR;
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS address VARCHAR;
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS city VARCHAR;
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS country VARCHAR;
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS logo VARCHAR;

-- Create indexes for commonly filtered fields
CREATE INDEX IF NOT EXISTS ix_organizers_email ON organizers (email);
CREATE INDEX IF NOT EXISTS ix_organizers_city ON organizers (city);
