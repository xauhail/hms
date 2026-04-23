-- Migration: Add extra_mattress column to bookings
-- Run this in Supabase SQL Editor

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS extra_mattress INTEGER DEFAULT 0;

COMMENT ON COLUMN bookings.extra_mattress IS 'Number of extra mattresses requested (typically for odd guest counts >= 3)';
