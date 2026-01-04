-- ============================================================================
-- AS WE ALL ARE - Database Schema
-- Clean setup script - run this for a fresh database
-- Compatible with Supabase
-- ============================================================================

-- Drop existing tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS admin_access_attempts CASCADE;
DROP TABLE IF EXISTS app_config CASCADE;
DROP TABLE IF EXISTS user_memberships CASCADE;
DROP TABLE IF EXISTS bundles CASCADE;
DROP TABLE IF EXISTS user_products CASCADE;
DROP TABLE IF EXISTS mockup_images CASCADE;
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
  price DECIMAL(10,2) DEFAULT 0,
  price_id TEXT REFERENCES prices(id),
  color TEXT DEFAULT '#000000',
  color_palette TEXT[],
  path TEXT,  -- Asset path for box images
  display_order INTEGER DEFAULT 0,
  is_sample BOOLEAN DEFAULT false,
  is_demo BOOLEAN DEFAULT false,
  full_box_id TEXT REFERENCES boxes(id),  -- Links sample box to its full version
  level INTEGER DEFAULT 1,
  variant TEXT DEFAULT 'full',
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
-- 10. MOCKUP_IMAGES TABLE
-- Stores mockup images for boxes (hero, secondary, card mockups)
-- ============================================================================
CREATE TABLE mockup_images (
  id TEXT PRIMARY KEY,
  box_id TEXT REFERENCES boxes(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  image_type TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT mockup_images_type_check CHECK (image_type IN ('BOX_MAIN', 'BOX_SECONDARY', 'CARD'))
);

-- ============================================================================
-- 11. APP_CONFIG TABLE
-- Application-wide configuration settings
-- ============================================================================
CREATE TABLE app_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  slug TEXT UNIQUE NOT NULL DEFAULT 'asweallare',
  name TEXT DEFAULT 'AS WE ALL ARE',
  title TEXT DEFAULT 'Unscripted Conversations',
  tagline TEXT DEFAULT 'A therapeutic conversational card game',
  promise TEXT DEFAULT 'Know more about each other without the need to ask any question',
  header_text TEXT,
  body_text TEXT,
  footer_text TEXT,
  admin_emails TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 12. ADMIN_ACCESS_ATTEMPTS TABLE
-- Logs unauthorized admin login attempts
-- ============================================================================
CREATE TABLE admin_access_attempts (
  email TEXT PRIMARY KEY,
  first_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attempts_count INTEGER DEFAULT 1
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_mockup_images_box_id ON mockup_images(box_id);
CREATE INDEX idx_mockup_images_type ON mockup_images(image_type);
CREATE INDEX idx_mockup_images_order ON mockup_images(display_order);
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
CREATE INDEX idx_boxes_path ON boxes(path);
CREATE INDEX idx_bundles_price ON bundles(price_id);
CREATE INDEX idx_user_products_user_id ON user_products(user_id);
CREATE INDEX idx_user_memberships_user_id ON user_memberships(user_id);
CREATE INDEX idx_user_memberships_expires ON user_memberships(expires_at);
CREATE INDEX idx_admin_access_attempts_last ON admin_access_attempts(last_attempt_at);

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

CREATE TRIGGER update_app_config_updated_at
  BEFORE UPDATE ON app_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE collection_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE piles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE mockup_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_access_attempts ENABLE ROW LEVEL SECURITY;

-- Public read access for content tables
CREATE POLICY "Public read access" ON collection_series FOR SELECT USING (true);
CREATE POLICY "Public read access" ON prices FOR SELECT USING (true);
CREATE POLICY "Public read access" ON boxes FOR SELECT USING (true);
CREATE POLICY "Public read access" ON piles FOR SELECT USING (true);
CREATE POLICY "Public read access" ON cards FOR SELECT USING (true);
CREATE POLICY "Public read access" ON bundles FOR SELECT USING (true);
CREATE POLICY "Public read access" ON subscription_plans FOR SELECT USING (true);
CREATE POLICY "Public read access" ON mockup_images FOR SELECT USING (true);
CREATE POLICY "Public read access" ON app_config FOR SELECT USING (true);

-- User-specific policies for user data tables
CREATE POLICY "Users can view own products" ON user_products 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own memberships" ON user_memberships 
  FOR SELECT USING (auth.uid() = user_id);

-- Service role full access (for admin operations)
CREATE POLICY "Service role full access" ON collection_series FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON prices FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON boxes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON piles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON cards FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON bundles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON user_products FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON user_memberships FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON subscription_plans FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON mockup_images FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON app_config FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON admin_access_attempts FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- Done! Schema created successfully.
-- ============================================================================
