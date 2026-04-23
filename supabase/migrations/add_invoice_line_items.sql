-- Migration: Create invoice_line_items table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  rate DECIMAL(10,2) DEFAULT 0,
  amount DECIMAL(10,2) GENERATED ALWAYS AS (quantity * rate) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_org_id ON invoice_line_items(org_id);

COMMENT ON TABLE invoice_line_items IS 'Dynamic line items for invoices with quantity, rate, and auto-calculated amount';
