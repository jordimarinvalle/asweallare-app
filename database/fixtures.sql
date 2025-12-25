-- ============================================================================
-- AS WE ALL ARE - Database Fixtures
-- Run this AFTER schema.sql to populate initial data
-- ============================================================================

-- ============================================================================
-- 1. COLLECTION SERIES
-- ============================================================================
INSERT INTO collection_series (id, name, description, display_order, is_active) VALUES
('unscripted_conversations', 'Unscripted Conversations', 'A card game for meaningful conversations and deeper connections', 1, true);

-- ============================================================================
-- 2. PRICES
-- ============================================================================
INSERT INTO prices (id, label, payment_info, hook_info, amount, promo_amount, promo_enabled, currency, membership_days, stripe_price_id, display_order, is_active) VALUES
-- Free/Demo pricing (no charge)
('price_free', 'Free', 'No payment required', 'Try it free!', 0.00, NULL, false, 'USD', NULL, NULL, 0, true),

-- Individual box prices
('price_box_standard', 'Standard Box', 'One-time purchase', 'Unlock 108 conversation cards', 29.00, 19.00, true, 'USD', NULL, NULL, 1, true),
('price_box_xl', 'XL Box', 'One-time purchase', 'Unlock 216 conversation cards', 49.00, 39.00, true, 'USD', NULL, NULL, 2, true),

-- Membership prices
('price_membership_30', '30-Day All Access', 'One-time payment', 'Full access for 30 days', 9.99, NULL, false, 'USD', 30, NULL, 3, true),
('price_membership_90', '90-Day All Access', 'One-time payment', 'Full access for 90 days - Save 20%', 24.99, NULL, false, 'USD', 90, NULL, 4, true),
('price_membership_365', 'Annual All Access', 'One-time payment', 'Full access for 1 year - Best value!', 79.99, NULL, false, 'USD', 365, NULL, 5, true);

-- ============================================================================
-- 3. PILES (Card Backs)
-- ============================================================================
INSERT INTO piles (id, slug, name, image_path, collection_series_id, display_order, is_active) VALUES
('pile_black', 'black', 'Black Pile', '/collections/unscripted_conversations/piles/black.png', 'unscripted_conversations', 1, true),
('pile_white', 'white', 'White Pile', '/collections/unscripted_conversations/piles/white.png', 'unscripted_conversations', 2, true);

-- ============================================================================
-- 4. BOXES (Card Decks)
-- ============================================================================
INSERT INTO boxes (id, name, description, description_short, tagline, topics, price_id, color, color_palette, path, display_order, is_sample, level, variant, is_active, collection_series_id) VALUES
-- Sample Box (free entry point for Level 1)
('box_sample_l1', 'Sample Cards', 'A free starter deck to experience Unscripted Conversations. Perfect for trying out the game.', '12 cards', 'Start Here', ARRAY['Introduction', 'Starter'], 'price_free', '#6B7280', ARRAY['#6B7280', '#9CA3AF'], 'sample-l1', 0, true, 1, 'sample', true, 'unscripted_conversations'),

-- Level 1: White Box Family
('box_white_full', 'White Box - Full', 'The complete Level 1 experience with all conversation cards.', '108 cards', 'Level 1', ARRAY['Connection', 'Discovery'], 'price_box_standard', '#FFFFFF', ARRAY['#FFFFFF', '#F3F4F6'], 'white-full', 1, false, 1, 'full', true, 'unscripted_conversations');

-- ============================================================================
-- Done! Fixtures loaded successfully.
-- ============================================================================
