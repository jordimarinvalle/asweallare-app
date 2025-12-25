-- ============================================================================
-- AS WE ALL ARE - Database Migration: Demo → Sample + Levels & Variants
-- Run this to migrate from demo terminology to sample terminology
-- and add Level + Variant fields to boxes
-- ============================================================================

-- Step 1: Add new columns to boxes table
ALTER TABLE boxes ADD COLUMN IF NOT EXISTS is_sample BOOLEAN DEFAULT false;
ALTER TABLE boxes ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE boxes ADD COLUMN IF NOT EXISTS variant TEXT DEFAULT 'full';

-- Step 2: Migrate existing is_demo data to is_sample
UPDATE boxes SET is_sample = is_demo WHERE is_demo IS NOT NULL;
UPDATE boxes SET variant = 'sample' WHERE is_sample = true;

-- Step 3: Drop the is_demo column (optional - can keep for rollback safety)
-- ALTER TABLE boxes DROP COLUMN IF EXISTS is_demo;

-- Step 4: Add constraints for variant values
-- Valid variants: sample, vol1, vol2, full
ALTER TABLE boxes DROP CONSTRAINT IF EXISTS boxes_variant_check;
ALTER TABLE boxes ADD CONSTRAINT boxes_variant_check 
  CHECK (variant IN ('sample', 'vol1', 'vol2', 'full'));

-- Step 5: Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_boxes_level ON boxes(level);
CREATE INDEX IF NOT EXISTS idx_boxes_variant ON boxes(variant);
CREATE INDEX IF NOT EXISTS idx_boxes_is_sample ON boxes(is_sample);

-- ============================================================================
-- Done! Migration complete.
-- ============================================================================
