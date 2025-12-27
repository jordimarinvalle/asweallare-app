-- ============================================================================
-- AS WE ALL ARE - Local Database Schema (No RLS)
-- For local development without Supabase
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
DROP TABLE IF EXISTS local_users CASCADE;

-- ============================================================================
-- LOCAL USERS TABLE (replaces Supabase auth)
-- ============================================================================
CREATE TABLE local_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin user (password: admin123)
INSERT INTO local_users (id, email, password_hash, is_admin) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@local.dev', '$2b$10$fZpKf/cVULz6SO7a.zDgn.yjF8rKHU/PrHxAhMdGQWkG6PtQWSAgC', true);

-- ============================================================================
-- 1. COLLECTION_SERIES TABLE
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
  is_sample BOOLEAN DEFAULT false,
  full_box_id TEXT REFERENCES boxes(id),  -- Links sample box to its full version
  is_active BOOLEAN DEFAULT true,
  collection_series_id TEXT REFERENCES collection_series(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. PILES TABLE
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
-- ============================================================================
CREATE TABLE user_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES local_users(id),
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
-- ============================================================================
CREATE TABLE user_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES local_users(id),
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
-- INDEXES
-- ============================================================================
CREATE INDEX idx_mockup_images_box_id ON mockup_images(box_id);
CREATE INDEX idx_mockup_images_type ON mockup_images(image_type);
CREATE INDEX idx_mockup_images_order ON mockup_images(display_order);
CREATE INDEX idx_cards_box_id ON cards(box_id);
CREATE INDEX idx_cards_pile ON cards(pile_id);
CREATE INDEX idx_cards_active ON cards(is_active);
CREATE INDEX idx_piles_series ON piles(collection_series_id);
CREATE INDEX idx_piles_slug ON piles(slug);
CREATE INDEX idx_boxes_series ON boxes(collection_series_id);
CREATE INDEX idx_boxes_price ON boxes(price_id);
CREATE INDEX idx_boxes_display_order ON boxes(display_order);
CREATE INDEX idx_bundles_price ON bundles(price_id);
CREATE INDEX idx_user_products_user_id ON user_products(user_id);
CREATE INDEX idx_user_memberships_user_id ON user_memberships(user_id);
CREATE INDEX idx_user_memberships_expires ON user_memberships(expires_at);
CREATE INDEX idx_local_users_email ON local_users(email);

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

CREATE TRIGGER update_local_users_updated_at
  BEFORE UPDATE ON local_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Done! Local schema created successfully.
-- ============================================================================

-- ============================================================================
-- APP_CONFIG TABLE - Application settings and content
-- ============================================================================
CREATE TABLE app_config (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  title TEXT,
  tagline TEXT,
  promise TEXT,
  header_text TEXT,
  body_text TEXT,
  footer_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- APP_SOCIALS TABLE - Social links for the app
-- ============================================================================
CREATE TABLE app_socials (
  id TEXT PRIMARY KEY,
  app_id TEXT REFERENCES app_config(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default app config
INSERT INTO app_config (id, slug, name, title, tagline, promise, header_text, body_text, footer_text) VALUES
('app_asweallare', 'asweallare', 'AS WE ALL ARE', 'Unscripted Conversations', 'A therapeutic conversational card game', 'Know more about each other without the need to ask any question', 
'## Welcome to AS WE ALL ARE

A space for **authentic connection** and meaningful conversations.',
'### How It Works

1. **Select your deck** — Choose from our curated card collections
2. **Draw a card** — Each card presents a thoughtful prompt
3. **Share openly** — Take turns sharing your thoughts and experiences
4. **Listen deeply** — Create space for others to be heard

> "The quality of our lives depends on the quality of our conversations."

### Why This Matters

In a world of constant distraction, we''ve created a tool to help you:
- Build deeper connections
- Practice vulnerability
- Discover new perspectives
- Create meaningful memories',
'Made with ❤️ for authentic human connection');
