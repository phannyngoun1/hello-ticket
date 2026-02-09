-- Add canvas_background_color column to layouts table
-- Migration 033: Canvas background color when no floor plan image (hex e.g. #e5e7eb)

ALTER TABLE layouts ADD COLUMN canvas_background_color TEXT DEFAULT '#e5e7eb';
