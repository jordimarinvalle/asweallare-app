-- ============================================================================
-- AS WE ALL ARE - Database Fixtures (Initial Data)
-- Run this file after schema.sql to populate initial data
-- ============================================================================

-- ============================================================================
-- 1. COLLECTION SERIES
-- ============================================================================
INSERT INTO collection_series (id, name, description, display_order, is_active) VALUES
  ('unscripted_conversations', 'Unscripted Conversations', 'A conversation game designed to create meaningful connections through thoughtful prompts and shared stories.', 1, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;

-- ============================================================================
-- 2. BOXES (Decks)
-- ============================================================================
INSERT INTO boxes (id, name, description, description_short, tagline, topics, price, color, color_palette, path, display_order, is_demo, is_active, collection_series_id) VALUES
  ('box_demo', 'Demo Box', 'A free sample of 24 conversation cards to try before you buy.', '24 free cards', 'Get a taste of meaningful conversations', ARRAY['Getting to know each other', 'Light life reflections', 'Fun conversation starters'], 0, '#FFFFFF', ARRAY['#FFFFFF', '#F5F5F5', '#E0E0E0'], 'white-box-demo', 1, true, true, 'unscripted_conversations'),
  ('box_white', 'White Box: Level 1 — Life · Vol 1', 'The foundational deck with 108 conversation cards covering life experiences, personal growth, and meaningful connections.', '108 conversation cards', 'Level 1 — Life · Volume 1', ARRAY['Life experiences', 'Personal growth', 'Relationships', 'Dreams and aspirations'], 15.00, '#FFFFFF', ARRAY['#FFFFFF', '#F8F8F8', '#EFEFEF'], 'white-box-108', 2, false, true, 'unscripted_conversations'),
  ('box_white_xl', 'White Box: Level 1 — Life · Vols 1 & 2', 'The complete Level 1 experience with 216 conversation cards spanning both volumes.', '216 conversation cards', 'Level 1 — Life · Volumes 1 & 2', ARRAY['Life experiences', 'Personal growth', 'Relationships', 'Dreams', 'Memories', 'Future plans'], 25.00, '#FFFFFF', ARRAY['#FFFFFF', '#FAFAFA', '#F0F0F0'], 'white-box-216', 3, false, true, 'unscripted_conversations'),
  ('box_black', 'Black Box: Level 3 — Life Struggles', 'Deep conversation cards exploring life challenges, overcoming adversity, and personal struggles.', '108 deep conversation cards', 'Level 3 — Life Struggles & Overcomes', ARRAY['Life challenges', 'Overcoming adversity', 'Deep reflections', 'Personal struggles'], 15.00, '#000000', ARRAY['#000000', '#1A1A1A', '#333333'], 'black-box-108', 4, false, true, 'unscripted_conversations'),
  ('box_red', 'Red Box: Level 2 — Intimacy & Love', 'Intimate conversation cards exploring love, relationships, vulnerability, and deep connections.', '108 intimate conversation cards', 'Level 2 — Intimacy & Love', ARRAY['Intimacy', 'Love', 'Relationships', 'Vulnerability', 'Connection'], 15.00, '#D12128', ARRAY['#D12128', '#B91C22', '#8B0000'], 'red-box-108', 5, false, true, 'unscripted_conversations')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  description_short = EXCLUDED.description_short,
  tagline = EXCLUDED.tagline,
  topics = EXCLUDED.topics,
  price = EXCLUDED.price,
  color = EXCLUDED.color,
  color_palette = EXCLUDED.color_palette,
  path = EXCLUDED.path,
  display_order = EXCLUDED.display_order,
  is_demo = EXCLUDED.is_demo,
  collection_series_id = EXCLUDED.collection_series_id;

-- ============================================================================
-- 3. PRICES (Membership Options)
-- ============================================================================
INSERT INTO prices (id, label, payment_info, hook_info, amount, currency, is_membership, membership_days, display_order, is_active) VALUES
  ('membership_24h', '24-Hour Pass', 'One-time payment', 'Perfect for a single game night', 1.00, 'USD', true, 1, 1, true),
  ('membership_90d', '90-Day Membership', 'One-time payment', 'Great for regular game nights', 3.00, 'USD', true, 90, 2, true),
  ('membership_180d', '180-Day Membership', 'One-time payment', 'Best value for frequent players', 5.00, 'USD', true, 180, 3, true),
  ('membership_365d', 'Annual Membership', 'One-time payment', 'Full year of meaningful conversations', 7.00, 'USD', true, 365, 4, true)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  payment_info = EXCLUDED.payment_info,
  hook_info = EXCLUDED.hook_info,
  amount = EXCLUDED.amount,
  membership_days = EXCLUDED.membership_days,
  display_order = EXCLUDED.display_order;

-- ============================================================================
-- 4. BUNDLES
-- ============================================================================
INSERT INTO bundles (id, name, description, price_id, box_ids, display_order, is_active) VALUES
  ('all_access', 'All Access Bundle', 'Access to all card collections in Unscripted Conversations', 'membership_365d', ARRAY['box_white', 'box_white_xl', 'box_black', 'box_red'], 1, true),
  ('white_collection', 'White Box Collection', 'Access to all White Box Level 1 cards', 'membership_90d', ARRAY['box_white', 'box_white_xl'], 2, true),
  ('deep_conversations', 'Deep Conversations Bundle', 'Access to Black Box and Red Box for deeper conversations', 'membership_180d', ARRAY['box_black', 'box_red'], 3, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_id = EXCLUDED.price_id,
  box_ids = EXCLUDED.box_ids,
  display_order = EXCLUDED.display_order;

-- ============================================================================
-- 5. SUBSCRIPTION PLANS (Legacy - for backwards compatibility)
-- ============================================================================
INSERT INTO subscription_plans (id, name, description, price, interval, is_active) VALUES
  ('plan_all_access', 'All Access Pass', 'Access to all current and future card boxes', 9.99, 'month', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price;

-- ============================================================================
-- 6. SAMPLE CARDS (Demo Box)
-- These are example cards - replace with your actual content
-- ============================================================================
INSERT INTO cards (id, color, title, hint, box_id, isdemo, isactive) VALUES
  ('card_demo_001', 'white', 'What is a childhood memory that still makes you smile?', 'Think of a specific moment', 'box_demo', true, true),
  ('card_demo_002', 'white', 'If you could have dinner with anyone, living or dead, who would it be?', 'And what would you talk about?', 'box_demo', true, true),
  ('card_demo_003', 'white', 'What is something you are grateful for today?', 'Big or small', 'box_demo', true, true),
  ('card_demo_004', 'black', 'What is a fear you have overcome?', 'How did you do it?', 'box_demo', true, true),
  ('card_demo_005', 'white', 'What does your ideal day look like?', 'From morning to night', 'box_demo', true, true),
  ('card_demo_006', 'black', 'What is a lesson you learned the hard way?', 'Share the story', 'box_demo', true, true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  hint = EXCLUDED.hint;

-- ============================================================================
-- Done! Fixtures loaded successfully.
-- ============================================================================
