-- Migration: Add referral_name column to bookings
-- Run this in Supabase SQL Editor

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS referral_name VARCHAR(255);

COMMENT ON COLUMN bookings.referral_name IS 'Name of referrer when source is referral';
