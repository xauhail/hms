-- Migration: Add amount_paid column to inventory_purchases
-- Run this in Supabase SQL Editor to fix "Could not find the 'amount_paid' column" error

ALTER TABLE inventory_purchases 
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2);

-- Add comment for documentation
COMMENT ON COLUMN inventory_purchases.amount_paid IS 'Actual amount paid (can differ from calculated amount due to discounts)';

-- Update existing rows to have amount_paid = amount (for backward compatibility)
UPDATE inventory_purchases 
SET amount_paid = amount 
WHERE amount_paid IS NULL;
