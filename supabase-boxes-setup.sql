-- AS WE ALL ARE - Boxes System Database Setup
-- Run this in your Supabase SQL Editor AFTER the initial setup
-- Dashboard → SQL Editor → New Query

-- ============================================
-- 1. CREATE BOXES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS boxes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 10.00,
  color TEXT NOT NULL DEFAULT '#000000',  -- Hex color for UI theming
  display_order INTEGER DEFAULT 0,
  is_demo BOOLEAN DEFAULT false,  -- If true, this box is available to all users
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE boxes ENABLE ROW LEVEL SECURITY;

-- Policies for boxes
DROP POLICY IF EXISTS "Allow public read boxes" ON boxes;
CREATE POLICY "Allow public read boxes" ON boxes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated manage boxes" ON boxes;
CREATE POLICY "Allow authenticated manage boxes" ON boxes 
  FOR ALL USING (true) WITH CHECK (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_boxes_active ON boxes(is_active);
CREATE INDEX IF NOT EXISTS idx_boxes_order ON boxes(display_order);

-- ============================================
-- 2. ADD BOX_ID TO CARDS TABLE
-- ============================================
-- Add box_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'cards' AND column_name = 'box_id') THEN
    ALTER TABLE cards ADD COLUMN box_id TEXT REFERENCES boxes(id);
  END IF;
END $$;

-- Create index for box_id
CREATE INDEX IF NOT EXISTS idx_cards_box_id ON cards(box_id);

-- ============================================
-- 3. CREATE USER_PRODUCTS TABLE (replaces user_access for box purchases)
-- ============================================
CREATE TABLE IF NOT EXISTS user_products (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  box_id TEXT REFERENCES boxes(id),
  purchase_type TEXT NOT NULL CHECK (purchase_type IN ('one_time', 'subscription', 'all_access')),
  stripe_session_id TEXT,
  stripe_subscription_id TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,  -- NULL for one_time purchases (lifetime)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;

-- Policies for user_products
DROP POLICY IF EXISTS "Users can read own products" ON user_products;
CREATE POLICY "Users can read own products" ON user_products 
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Allow insert products" ON user_products;
CREATE POLICY "Allow insert products" ON user_products 
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update products" ON user_products;
CREATE POLICY "Allow update products" ON user_products 
  FOR UPDATE USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_products_user ON user_products(user_id);
CREATE INDEX IF NOT EXISTS idx_user_products_box ON user_products(box_id);
CREATE INDEX IF NOT EXISTS idx_user_products_active ON user_products(is_active);

-- Unique constraint: user can only have one active purchase per box
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_products_unique 
  ON user_products(user_id, box_id) WHERE is_active = true AND purchase_type != 'all_access';

-- ============================================
-- 4. CREATE SUBSCRIPTION_PLANS TABLE (for pricing configuration)
-- ============================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  interval TEXT NOT NULL CHECK (interval IN ('month', 'quarter', 'year')),
  stripe_price_id TEXT,  -- Link to Stripe Price object
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Allow public read plans" ON subscription_plans;
CREATE POLICY "Allow public read plans" ON subscription_plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin manage plans" ON subscription_plans;
CREATE POLICY "Allow admin manage plans" ON subscription_plans 
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 5. INSERT DEFAULT BOXES
-- ============================================
INSERT INTO boxes (id, name, description, price, color, display_order, is_demo, is_active) VALUES
  ('box_demo', 'Demo Box', 'Free starter deck to try the game', 0.00, '#9CA3AF', 0, true, true),
  ('box_white', 'White Box', 'Light and reflective conversation starters', 15.00, '#FFFFFF', 1, false, true),
  ('box_black', 'Black Box', 'Deep and meaningful questions', 15.00, '#000000', 2, false, true),
  ('box_red', 'Red Box', 'Bold and daring topics', 15.00, '#D12128', 3, false, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  color = EXCLUDED.color,
  display_order = EXCLUDED.display_order,
  is_demo = EXCLUDED.is_demo;

-- ============================================
-- 6. INSERT DEFAULT SUBSCRIPTION PLAN
-- ============================================
INSERT INTO subscription_plans (id, name, description, price, interval, is_active) VALUES
  ('plan_all_access_monthly', 'All Access Monthly', 'Access to all boxes, billed monthly', 5.00, 'month', true),
  ('plan_all_access_quarterly', 'All Access Quarterly', 'Access to all boxes, billed every 3 months', 12.00, 'quarter', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price;

-- ============================================
-- 7. UPDATE EXISTING DEMO CARDS TO BELONG TO DEMO BOX
-- ============================================
UPDATE cards SET box_id = 'box_demo' WHERE "isDemo" = true AND box_id IS NULL;

-- ============================================
-- 8. CREATE HELPER VIEW FOR USER'S ACCESSIBLE CARDS
-- ============================================
CREATE OR REPLACE VIEW user_accessible_boxes AS
SELECT DISTINCT 
  b.id as box_id,
  b.name,
  b.description,
  b.price,
  b.color,
  b.display_order,
  b.is_demo,
  CASE 
    WHEN b.is_demo = true THEN true
    WHEN up.id IS NOT NULL AND up.is_active = true THEN true
    ELSE false
  END as has_access
FROM boxes b
LEFT JOIN user_products up ON (
  up.box_id = b.id 
  OR up.purchase_type = 'all_access'
) AND up.is_active = true
WHERE b.is_active = true
ORDER BY b.display_order;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- 
-- Summary of new tables:
-- - boxes: Defines card collections (White Box, Black Box, Red Box, etc.)
-- - user_products: Tracks which boxes each user has purchased
-- - subscription_plans: Configurable pricing for subscriptions
--
-- The cards table now has a box_id column to link cards to boxes.
--
-- Next steps:
-- 1. Run this SQL in Supabase
-- 2. Assign existing cards to boxes (UPDATE cards SET box_id = 'box_white' WHERE ...)
-- 3. Update the API to use box-based filtering
-- 4. Create the Box Selection UI
--
