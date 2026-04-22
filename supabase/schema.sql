-- ============================================
-- SmartHotel SaaS - Complete Supabase Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PLANS TABLE
-- ============================================
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  price_monthly INTEGER NOT NULL, -- in paise (INR)
  price_yearly INTEGER NOT NULL,
  max_rooms INTEGER NOT NULL,
  max_staff INTEGER NOT NULL,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default plans
INSERT INTO plans (name, slug, price_monthly, price_yearly, max_rooms, max_staff, features) VALUES
('Starter', 'starter', 99900, 999900, 10, 5, '["Front Desk","Booking Calendar","Basic Reports","Invoice Generation"]'),
('Professional', 'professional', 249900, 2499900, 50, 20, '["Everything in Starter","Channel Manager Ready","Inventory Management","Staff Attendance","Advanced Reports","Priority Support"]'),
('Enterprise', 'enterprise', 499900, 4999900, 999, 999, '["Everything in Professional","Unlimited Rooms","Unlimited Staff","Custom Branding","API Access","Dedicated Support","Multi-property (coming soon)"]');

-- ============================================
-- ORGANIZATIONS (Hotels/Properties)
-- ============================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  owner_id UUID NOT NULL, -- references auth.users
  plan_id UUID REFERENCES plans(id),
  subscription_status VARCHAR(50) DEFAULT 'trial', -- trial | active | cancelled | expired
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  subscription_ends_at TIMESTAMPTZ,
  razorpay_customer_id VARCHAR(255),
  razorpay_subscription_id VARCHAR(255),
  settings JSONB DEFAULT '{
    "currency": "₹",
    "timezone": "Asia/Kolkata",
    "checkin_time": "12:00",
    "checkout_time": "11:00",
    "gst_rate": 12,
    "logo_url": null
  }',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER PROFILES
-- ============================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  full_name VARCHAR(255),
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'admin', -- admin | manager | staff
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROOM TYPES
-- ============================================
CREATE TABLE room_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  base_rate DECIMAL(10,2) DEFAULT 0,
  description TEXT,
  amenities JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROOMS
-- ============================================
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  room_type_id UUID REFERENCES room_types(id) ON DELETE SET NULL,
  room_number VARCHAR(20) NOT NULL,
  floor INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'available', -- available | maintenance | blocked
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, room_number)
);

-- ============================================
-- GUESTS
-- ============================================
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  id_type VARCHAR(50) DEFAULT 'aadhaar', -- aadhaar | passport | driving_license
  id_number VARCHAR(100),
  address TEXT,
  nationality VARCHAR(100) DEFAULT 'Indian',
  notes TEXT,
  visit_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BOOKINGS
-- ============================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES guests(id),
  room_id UUID NOT NULL REFERENCES rooms(id),
  source VARCHAR(100) DEFAULT 'walk-in', -- walk-in | booking.com | mmt | airbnb | referral | direct
  checkin_date DATE NOT NULL,
  checkout_date DATE NOT NULL,
  checkin_time TIMESTAMPTZ,
  checkout_time TIMESTAMPTZ,
  num_guests INTEGER DEFAULT 1,
  meal_plan VARCHAR(10) DEFAULT 'EP', -- EP | CP | MAP | AP
  room_rate DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'confirmed', -- confirmed | checked-in | checked-out | cancelled | no-show
  special_requests TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INVOICES
-- ============================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id),
  guest_id UUID REFERENCES guests(id),
  invoice_number VARCHAR(50) NOT NULL,
  room_charges DECIMAL(10,2) DEFAULT 0,
  food_charges DECIMAL(10,2) DEFAULT 0,
  service_charges DECIMAL(10,2) DEFAULT 0,
  other_charges DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  subtotal DECIMAL(10,2) DEFAULT 0,
  gst_rate DECIMAL(5,2) DEFAULT 12,
  gst_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  payment_mode VARCHAR(50) DEFAULT 'cash', -- cash | upi | card | online
  payment_status VARCHAR(50) DEFAULT 'paid', -- paid | pending | partial
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INVENTORY
-- ============================================
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  unit VARCHAR(50) DEFAULT 'pcs',
  current_stock DECIMAL(10,2) DEFAULT 0,
  min_stock DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inventory_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  item_id UUID REFERENCES inventory_items(id),
  item_name VARCHAR(255),
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) DEFAULT 'pcs',
  rate DECIMAL(10,2) NOT NULL,
  amount DECIMAL(10,2) GENERATED ALWAYS AS (quantity * rate) STORED,
  purchase_date DATE DEFAULT CURRENT_DATE,
  vendor VARCHAR(255),
  mode VARCHAR(20) DEFAULT 'monthly', -- weekly | monthly
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STAFF
-- ============================================
CREATE TABLE staff_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(100) DEFAULT 'front-desk',
  id_number VARCHAR(100), -- aadhaar
  salary DECIMAL(10,2),
  join_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ATTENDANCE
-- ============================================
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'present', -- present | absent | half-day | leave
  UNIQUE(staff_id, date)
);

-- ============================================
-- SUBSCRIPTION PAYMENTS LOG
-- ============================================
CREATE TABLE subscription_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  plan_id UUID REFERENCES plans(id),
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  razorpay_signature VARCHAR(500),
  amount INTEGER NOT NULL, -- in paise
  currency VARCHAR(10) DEFAULT 'INR',
  billing_period VARCHAR(20) DEFAULT 'monthly',
  status VARCHAR(50) DEFAULT 'pending', -- pending | success | failed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Policies: users can only see their own org's data
-- (Backend uses service role key, bypassing RLS for server operations)

CREATE POLICY "Users see own profile" ON user_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Org members see org" ON organizations
  FOR ALL USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND org_id = organizations.id)
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orgs_updated BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_bookings_updated BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Check room availability function
CREATE OR REPLACE FUNCTION check_room_available(
  p_room_id UUID,
  p_checkin DATE,
  p_checkout DATE,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM bookings
    WHERE room_id = p_room_id
      AND status NOT IN ('cancelled', 'checked-out', 'no-show')
      AND checkin_date < p_checkout
      AND checkout_date > p_checkin
      AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
  );
END;
$$ LANGUAGE plpgsql;

-- Auto-generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number(p_org_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  v_count INTEGER;
  v_year VARCHAR(4);
BEGIN
  SELECT COUNT(*) INTO v_count FROM invoices WHERE org_id = p_org_id;
  v_year := TO_CHAR(NOW(), 'YY');
  RETURN 'INV-' || v_year || '-' || LPAD((v_count + 1)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;
