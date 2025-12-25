-- ============================================================================
-- AS WE ALL ARE - Database Schema
-- Clean setup script - run this for a fresh database
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
-- Groups of related card boxes (e.g., "Unscripted Conversations")
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
-- 2. PRICES TABLE
-- Pricing options for boxes and memberships
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
-- Card decks/boxes that users can purchase or sample
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
  display_order INTEGER DEFAULT 0,
  is_sample BOOLEAN DEFAULT false,
  full_box_id TEXT REFERENCES boxes(id),  -- Links sample box to its full version
  is_active BOOLEAN DEFAULT true,
  collection_series_id TEXT REFERENCES collection_series(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. PILES TABLE
-- Card back designs (e.g., "Black Pile", "White Pile")
-- ============================================================================
CREATE TABLE piles (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  image_path TEXT NOT NULL,
  collection_series_id TEXT REFERENCES collection_series(id),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. CARDS TABLE
-- Individual cards belonging to boxes
-- ============================================================================
CREATE TABLE cards (
  id TEXT PRIMARY KEY,
  box_id TEXT REFERENCES boxes(id) NOT NULL,
  pile_id TEXT REFERENCES piles(id) NOT NULL,
  text TEXT,
  image_path TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 6. BUNDLES TABLE
-- Groups of boxes sold together
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
-- 7. USER_PRODUCTS TABLE
-- Tracks individual box purchases per user
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
-- 8. USER_MEMBERSHIPS TABLE
-- Tracks membership/bundle purchases per user
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
-- 9. SUBSCRIPTION_PLANS TABLE
-- Available subscription tiers
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
CREATE INDEX idx_cards_pile_id ON cards(pile_id);
CREATE INDEX idx_cards_active ON cards(is_active);
CREATE INDEX idx_piles_series ON piles(collection_series_id);
CREATE INDEX idx_piles_slug ON piles(slug);
CREATE INDEX idx_boxes_series ON boxes(collection_series_id);
CREATE INDEX idx_boxes_price ON boxes(price_id);
CREATE INDEX idx_boxes_display_order ON boxes(display_order);
CREATE INDEX idx_boxes_is_sample ON boxes(is_sample);
CREATE INDEX idx_boxes_full_box ON boxes(full_box_id);
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

CREATE TRIGGER update_piles_updated_at
  BEFORE UPDATE ON piles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bundles_updated_at
  BEFORE UPDATE ON bundles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_memberships_updated_at
  BEFORE UPDATE ON user_memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Done! Schema created successfully.
-- ============================================================================
