-- Migration: Add capacity and rate_per_night to rooms table
-- Run this in Supabase SQL Editor

ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 2;

ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS rate_per_night DECIMAL(10,2) DEFAULT 0;

COMMENT ON COLUMN rooms.capacity IS 'Maximum number of guests allowed per room';
COMMENT ON COLUMN rooms.rate_per_night IS 'Price per night for this specific room';

-- Update existing rooms with default values
UPDATE rooms SET capacity = 2 WHERE capacity IS NULL;
UPDATE rooms SET rate_per_night = 0 WHERE rate_per_night IS NULL;
