-- ============================================================================
-- AS WE ALL ARE - Database Migration Script
-- Run this to migrate from old schema to new schema
-- This script adds the new columns and handles the transition
-- ============================================================================

-- Step 1: Add promo columns to prices table
ALTER TABLE prices ADD COLUMN IF NOT EXISTS promo_amount DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE prices ADD COLUMN IF NOT EXISTS promo_enabled BOOLEAN DEFAULT false;

-- Step 2: Add price_id column to boxes table
ALTER TABLE boxes ADD COLUMN IF NOT EXISTS price_id TEXT REFERENCES prices(id);

-- Step 3: Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_boxes_price ON boxes(price_id);

-- ============================================================================
-- NOTE: The old 'price' column on boxes is now deprecated.
-- You should manually migrate data if needed:
--
-- Example: Create prices from existing box prices
-- INSERT INTO prices (id, label, amount, is_active)
-- SELECT 
--   'price_' || id,
--   name || ' - Price',
--   price,
--   true
-- FROM boxes
-- WHERE price > 0
-- ON CONFLICT (id) DO NOTHING;
--
-- Then link boxes to their new prices:
-- UPDATE boxes SET price_id = 'price_' || id WHERE price > 0;
--
-- ============================================================================

-- Step 4: If you want to drop the old price column (only after migration):
-- ALTER TABLE boxes DROP COLUMN IF EXISTS price;

-- ============================================================================
-- Done! Migration complete.
-- ============================================================================
