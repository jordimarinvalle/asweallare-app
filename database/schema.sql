-- ============================================================================
-- AS WE ALL ARE - Database Schema
-- Run this file to create/recreate the database structure
-- ============================================================================

-- Drop existing tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS user_memberships CASCADE;
DROP TABLE IF EXISTS bundles CASCADE;
DROP TABLE IF EXISTS user_products CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS piles CASCADE;
DROP TABLE IF EXISTS boxes CASCADE;
DROP TABLE IF EXISTS prices CASCADE;
DROP TABLE IF EXISTS collection_series CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;

-- ============================================================================
-- 1. COLLECTION_SERIES TABLE
-- Represents a family of games that can be combined together
-- ============================================================================
CREATE TABLE collection_series (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. PRICES TABLE (now defined BEFORE boxes since boxes reference it)
-- Membership/access pricing options - reusable across boxes and bundles
-- ============================================================================
CREATE TABLE prices (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  payment_info TEXT,
  hook_info TEXT,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  promo_amount DECIMAL(10,2) DEFAULT NULL,
  promo_enabled BOOLEAN DEFAULT false,
  currency TEXT DEFAULT 'USD',
  membership_days INTEGER,
  stripe_price_id TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. BOXES TABLE
-- Card collections/decks with metadata
-- NOTE: price_id links to a Price entity (no direct price value on box)
-- ============================================================================
CREATE TABLE boxes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  description_short TEXT,
  tagline TEXT,
  topics TEXT[],
  price_id TEXT REFERENCES prices(id),
  color TEXT DEFAULT '#000000',
  color_palette TEXT[],
  path TEXT,
  display_order INTEGER DEFAULT 0,
  is_demo BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  collection_series_id TEXT REFERENCES collection_series(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. CARDS TABLE
-- Individual cards with title, hint, image
-- ============================================================================
CREATE TABLE cards (
  id TEXT PRIMARY KEY,
  color TEXT NOT NULL CHECK (color IN ('black', 'white')),
  title TEXT NOT NULL,
  hint TEXT,
  language TEXT DEFAULT 'en',
  isdemo BOOLEAN DEFAULT false,
  isactive BOOLEAN DEFAULT true,
  box_id TEXT REFERENCES boxes(id),
  image_path TEXT,
  createdat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. BUNDLES TABLE
-- Groups of boxes with a shared price
-- NOTE: price_id links to a Price entity
-- ============================================================================
CREATE TABLE bundles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_id TEXT REFERENCES prices(id),
  box_ids TEXT[] NOT NULL DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 6. USER_PRODUCTS TABLE (Legacy - backwards compatibility)
-- Box purchases and subscriptions
-- ============================================================================
CREATE TABLE user_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  box_id TEXT REFERENCES boxes(id),
  purchase_type TEXT DEFAULT 'one_time',
  stripe_subscription_id TEXT,
  stripe_payment_id TEXT,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 7. USER_MEMBERSHIPS TABLE
-- Time-based membership tracking
-- ============================================================================
CREATE TABLE user_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  bundle_id TEXT REFERENCES bundles(id),
  price_id TEXT REFERENCES prices(id),
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  stripe_payment_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 8. SUBSCRIPTION_PLANS TABLE (Legacy)
-- Pricing configuration
-- ============================================================================
CREATE TABLE subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  interval TEXT DEFAULT 'month',
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_cards_box_id ON cards(box_id);
CREATE INDEX idx_cards_color ON cards(color);
CREATE INDEX idx_boxes_series ON boxes(collection_series_id);
CREATE INDEX idx_boxes_price ON boxes(price_id);
CREATE INDEX idx_boxes_display_order ON boxes(display_order);
CREATE INDEX idx_bundles_price ON bundles(price_id);
CREATE INDEX idx_user_products_user_id ON user_products(user_id);
CREATE INDEX idx_user_memberships_user_id ON user_memberships(user_id);
CREATE INDEX idx_user_memberships_expires ON user_memberships(expires_at);

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_collection_series_updated_at
  BEFORE UPDATE ON collection_series
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prices_updated_at
  BEFORE UPDATE ON prices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boxes_updated_at
  BEFORE UPDATE ON boxes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bundles_updated_at
  BEFORE UPDATE ON bundles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_memberships_updated_at
  BEFORE UPDATE ON user_memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (for Supabase)
-- Note: For local PostgreSQL without Supabase, you can skip RLS
-- ============================================================================

-- Enable RLS
ALTER TABLE collection_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memberships ENABLE ROW LEVEL SECURITY;

-- Public read policies (anyone can read active items)
CREATE POLICY collection_series_public_read ON collection_series
  FOR SELECT USING (true);

CREATE POLICY prices_public_read ON prices
  FOR SELECT USING (true);

CREATE POLICY boxes_public_read ON boxes
  FOR SELECT USING (true);

CREATE POLICY cards_public_read ON cards
  FOR SELECT USING (true);

CREATE POLICY bundles_public_read ON bundles
  FOR SELECT USING (true);

-- User can read their own data
CREATE POLICY user_products_read_own ON user_products
  FOR SELECT USING (true);

CREATE POLICY user_memberships_read_own ON user_memberships
  FOR SELECT USING (true);

-- Allow all operations for authenticated users (admin check in app)
CREATE POLICY collection_series_authenticated_all ON collection_series
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY prices_authenticated_all ON prices
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY boxes_authenticated_all ON boxes
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY cards_authenticated_all ON cards
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY bundles_authenticated_all ON bundles
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY user_products_authenticated_all ON user_products
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY user_memberships_authenticated_all ON user_memberships
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- Done! Schema created successfully.
-- ============================================================================
