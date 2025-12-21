-- Migration 017: Change seat section to section_id
-- Description: Changes section string field to section_id foreign key reference
-- Date: 2025-12-21

-- Step 1: Add new section_id column (nullable initially)
ALTER TABLE seats ADD COLUMN section_id TEXT;

-- Step 2: Create a mapping from section names to section IDs for data migration
-- This assumes we need to create sections from existing seat section strings
-- For each unique (layout_id, section) combination, create a section record

-- Insert sections based on existing seat data
INSERT INTO sections (id, tenant_id, layout_id, name, is_active, is_deleted, version, created_at, updated_at)
SELECT 
    gen_random_uuid()::text,
    s.tenant_id,
    s.layout_id,
    s.section,
    true,
    false,
    0,
    NOW(),
    NOW()
FROM (
    SELECT DISTINCT tenant_id, layout_id, section 
    FROM seats 
    WHERE section IS NOT NULL 
      AND is_deleted = false
) s
WHERE NOT EXISTS (
    SELECT 1 FROM sections sec 
    WHERE sec.layout_id = s.layout_id 
      AND sec.name = s.section
);

-- Step 3: Update seats table to populate section_id from the section name
UPDATE seats
SET section_id = sections.id
FROM sections
WHERE seats.layout_id = sections.layout_id
  AND seats.section = sections.name;

-- Step 4: Make section_id NOT NULL after data migration
ALTER TABLE seats ALTER COLUMN section_id SET NOT NULL;

-- Step 5: Add foreign key constraint
ALTER TABLE seats 
    ADD CONSTRAINT fk_seats_section_id 
    FOREIGN KEY (section_id) 
    REFERENCES sections(id) 
    ON DELETE RESTRICT;

-- Step 6: Drop the old unique index that includes section string
DROP INDEX IF EXISTS ix_seats_location;

-- Step 7: Create new unique index with section_id
CREATE UNIQUE INDEX ix_seats_location ON seats (layout_id, section_id, row, seat_number);

-- Step 8: Create index for section_id lookups
CREATE INDEX IF NOT EXISTS ix_seats_section ON seats (tenant_id, section_id);

-- Step 9: Drop the old section column
ALTER TABLE seats DROP COLUMN section;

