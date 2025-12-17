-- Migration: Split name field into first_name and last_name
-- This migration splits the single 'name' field into separate 'first_name' and 'last_name' fields

-- Step 1: Add new columns
ALTER TABLE users ADD COLUMN first_name VARCHAR
(50) DEFAULT '';
ALTER TABLE users ADD COLUMN last_name VARCHAR
(50) DEFAULT '';

-- Step 2: Populate new columns by splitting existing name field
UPDATE users 
SET 
    first_name = CASE 
        WHEN INSTR(name, ' ') > 0 THEN SUBSTR(name, 1, INSTR(name, ' ') - 1)
        ELSE name
    END,
    last_name = CASE 
        WHEN INSTR(name, ' ') > 0 THEN SUBSTR(name, INSTR(name, ' ') + 1)
        ELSE ''
    END;

-- Step 3: Add indexes for new columns
CREATE INDEX ix_users_first_name ON users(first_name);
CREATE INDEX ix_users_last_name ON users(last_name);

-- Step 4: Drop old name column and its index
DROP INDEX IF EXISTS ix_users_name;
ALTER TABLE users DROP COLUMN name;
