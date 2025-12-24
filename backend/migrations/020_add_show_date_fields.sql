-- Add date and other fields to shows table
-- Migration 020: Add started_date, ended_date, images, and note fields to shows

-- Add started_date column (nullable DATE)
ALTER TABLE shows ADD COLUMN IF NOT EXISTS started_date DATE;

-- Add ended_date column (nullable DATE)
ALTER TABLE shows ADD COLUMN IF NOT EXISTS ended_date DATE;

-- Add images column (nullable JSONB)
ALTER TABLE shows ADD COLUMN IF NOT EXISTS images JSONB;

-- Add note column (nullable TEXT with max length 5000)
ALTER TABLE shows ADD COLUMN IF NOT EXISTS note TEXT;

