-- ============================================================================
-- AS WE ALL ARE - Fixtures: Piles
-- Default pile data for Unscripted Conversations
-- ============================================================================

-- Insert default piles (black and white)
INSERT INTO piles (id, slug, name, image_path, collection_series_id, display_order, is_active)
VALUES 
  ('pile_black', 'black', 'Black', 'collections/unscripted_conversations/piles/black.png', 'unscripted_conversations', 1, true),
  ('pile_white', 'white', 'White', 'collections/unscripted_conversations/piles/white.png', 'unscripted_conversations', 2, true)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  collection_series_id = EXCLUDED.collection_series_id,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- ============================================================================
-- Done! Fixtures inserted.
-- ============================================================================
