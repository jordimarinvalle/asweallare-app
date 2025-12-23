-- ============================================================================
-- MIGRATION: Refactor Data Model for Decks, Series, Prices & Bundles
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. CREATE COLLECTION_SERIES TABLE
-- Represents a family of games that can be combined together
-- ============================================================================
CREATE TABLE IF NOT EXISTS collection_series (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default collection series
INSERT INTO collection_series (id, name, description, display_order, is_active) 
VALUES (
  'unscripted_conversations',
  'Unscripted Conversations',
  'A conversation game designed to create meaningful connections through thoughtful prompts and shared stories.',
  1,
  true
) ON CONFLICT (id) DO NOTHING;

-- 2. ALTER BOXES TABLE
-- Add new fields to existing boxes table
-- ============================================================================

-- Add collection_series_id column
ALTER TABLE boxes 
ADD COLUMN IF NOT EXISTS collection_series_id TEXT REFERENCES collection_series(id);

-- Add new description fields
ALTER TABLE boxes 
ADD COLUMN IF NOT EXISTS description_short TEXT;

ALTER TABLE boxes 
ADD COLUMN IF NOT EXISTS tagline TEXT;

-- Add topics array
ALTER TABLE boxes 
ADD COLUMN IF NOT EXISTS topics TEXT[];

-- Add color_palette array (3 colors)
ALTER TABLE boxes 
ADD COLUMN IF NOT EXISTS color_palette TEXT[];

-- Add path for routing/assets
ALTER TABLE boxes 
ADD COLUMN IF NOT EXISTS path TEXT;

-- Add display_order for intentional ordering
ALTER TABLE boxes 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Add is_active flag
ALTER TABLE boxes 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add timestamps if not exist
ALTER TABLE boxes 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE boxes 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing boxes to belong to unscripted_conversations series
UPDATE boxes 
SET collection_series_id = 'unscripted_conversations'
WHERE collection_series_id IS NULL;

-- 3. CREATE PRICES TABLE
-- Defines membership/access options (time-based)
-- ============================================================================
CREATE TABLE IF NOT EXISTS prices (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  payment_info TEXT,
  hook_info TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  is_membership BOOLEAN DEFAULT true,
  membership_days INTEGER,
  stripe_price_id TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default price options
INSERT INTO prices (id, label, payment_info, hook_info, amount, currency, is_membership, membership_days, display_order, is_active) 
VALUES 
  ('membership_24h', '24-Hour Pass', 'One-time payment', 'Perfect for a single game night', 1.00, 'USD', true, 1, 1, true),
  ('membership_90d', '90-Day Membership', 'One-time payment', 'Great for regular game nights', 3.00, 'USD', true, 90, 2, true),
  ('membership_180d', '180-Day Membership', 'One-time payment', 'Best value for frequent players', 5.00, 'USD', true, 180, 3, true),
  ('membership_365d', 'Annual Membership', 'One-time payment', 'Full year of meaningful conversations', 7.00, 'USD', true, 365, 4, true)
ON CONFLICT (id) DO NOTHING;

-- 4. CREATE BUNDLES TABLE
-- Links boxes to prices
-- ============================================================================
CREATE TABLE IF NOT EXISTS bundles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_id TEXT REFERENCES prices(id),
  box_ids TEXT[] NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CREATE USER_MEMBERSHIPS TABLE
-- Track user memberships (time-based access)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_memberships (
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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id ON user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_expires ON user_memberships(expires_at);

-- 6. UPDATE EXISTING BOXES WITH NEW DATA
-- Set display_order and other fields for existing boxes
-- ============================================================================

-- Update Demo Box
UPDATE boxes SET 
  description_short = 'Try 24 cards for free',
  tagline = 'Get a taste of meaningful conversations',
  topics = ARRAY['Getting to know each other', 'Light life reflections', 'Fun conversation starters'],
  color_palette = ARRAY['#FFFFFF', '#F5F5F5', '#E0E0E0'],
  path = 'white-box-demo',
  display_order = 1
WHERE id = 'box_demo';

-- Update White Box (108 cards)
UPDATE boxes SET 
  description_short = '108 conversation cards',
  tagline = 'Level 1 — Life · Volume 1',
  topics = ARRAY['Life experiences', 'Personal growth', 'Relationships', 'Dreams and aspirations'],
  color_palette = ARRAY['#FFFFFF', '#F8F8F8', '#EFEFEF'],
  path = 'white-box-108',
  display_order = 2
WHERE id = 'box_white';

-- Update White Box XL (216 cards)
UPDATE boxes SET 
  description_short = '216 conversation cards',
  tagline = 'Level 1 — Life · Volumes 1 & 2',
  topics = ARRAY['Life experiences', 'Personal growth', 'Relationships', 'Dreams', 'Memories', 'Future plans'],
  color_palette = ARRAY['#FFFFFF', '#FAFAFA', '#F0F0F0'],
  path = 'white-box-216',
  display_order = 3
WHERE id = 'box_white_xl';

-- Update Black Box
UPDATE boxes SET 
  description_short = '108 deep conversation cards',
  tagline = 'Level 3 — Life Struggles & Overcomes',
  topics = ARRAY['Life challenges', 'Overcoming adversity', 'Deep reflections', 'Personal struggles'],
  color_palette = ARRAY['#000000', '#1A1A1A', '#333333'],
  path = 'black-box-108',
  display_order = 4
WHERE id = 'box_black';

-- Update Red Box
UPDATE boxes SET 
  description_short = '108 intimate conversation cards',
  tagline = 'Level 2 — Intimacy & Love',
  topics = ARRAY['Intimacy', 'Love', 'Relationships', 'Vulnerability', 'Connection'],
  color_palette = ARRAY['#D12128', '#B91C22', '#8B0000'],
  path = 'red-box-108',
  display_order = 5
WHERE id = 'box_red';

-- 7. CREATE DEFAULT BUNDLES
-- Link existing boxes to prices
-- ============================================================================

-- All Access Bundle (all boxes)
INSERT INTO bundles (id, name, description, price_id, box_ids, display_order, is_active)
VALUES (
  'all_access',
  'All Access',
  'Access to all card collections in Unscripted Conversations',
  'membership_365d',
  ARRAY['box_white', 'box_white_xl', 'box_black', 'box_red'],
  1,
  true
) ON CONFLICT (id) DO NOTHING;

-- White Box Bundle
INSERT INTO bundles (id, name, description, price_id, box_ids, display_order, is_active)
VALUES (
  'white_box_bundle',
  'White Box Collection',
  'Access to White Box Level 1 cards',
  'membership_90d',
  ARRAY['box_white'],
  2,
  true
) ON CONFLICT (id) DO NOTHING;

-- 8. ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE collection_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memberships ENABLE ROW LEVEL SECURITY;

-- Collection series - public read
CREATE POLICY collection_series_public_read ON collection_series
  FOR SELECT USING (is_active = true);

-- Prices - public read
CREATE POLICY prices_public_read ON prices
  FOR SELECT USING (is_active = true);

-- Bundles - public read
CREATE POLICY bundles_public_read ON bundles
  FOR SELECT USING (is_active = true);

-- User memberships - users can read their own
CREATE POLICY user_memberships_read_own ON user_memberships
  FOR SELECT USING (auth.uid() = user_id);

-- Service role bypass for admin operations
CREATE POLICY collection_series_service_all ON collection_series
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY prices_service_all ON prices
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY bundles_service_all ON bundles
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY user_memberships_service_all ON user_memberships
  FOR ALL USING (auth.role() = 'service_role');

-- 9. CREATE HELPER FUNCTION
-- Get user's accessible boxes based on memberships
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_accessible_box_ids(p_user_id UUID)
RETURNS TEXT[] AS $$
DECLARE
  accessible_ids TEXT[];
BEGIN
  -- Get box IDs from active, non-expired memberships
  SELECT ARRAY_AGG(DISTINCT unnest)
  INTO accessible_ids
  FROM (
    SELECT unnest(b.box_ids)
    FROM user_memberships um
    JOIN bundles b ON um.bundle_id = b.id
    WHERE um.user_id = p_user_id
      AND um.is_active = true
      AND um.expires_at > NOW()
  ) sub;
  
  -- Also include boxes from legacy user_products
  SELECT ARRAY_AGG(DISTINCT box_id) || COALESCE(accessible_ids, ARRAY[]::TEXT[])
  INTO accessible_ids
  FROM user_products
  WHERE user_id = p_user_id
    AND is_active = true;
  
  RETURN COALESCE(accessible_ids, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. ADD UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_collection_series_updated_at
  BEFORE UPDATE ON collection_series
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prices_updated_at
  BEFORE UPDATE ON prices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bundles_updated_at
  BEFORE UPDATE ON bundles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_memberships_updated_at
  BEFORE UPDATE ON user_memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Done! Run this migration in Supabase SQL Editor
