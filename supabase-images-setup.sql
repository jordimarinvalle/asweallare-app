-- AS WE ALL ARE - Card Images Setup
-- Run this in your Supabase SQL Editor

-- Add image_path column to cards table
ALTER TABLE cards ADD COLUMN IF NOT EXISTS image_path TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cards_image_path ON cards(image_path);

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- 
-- The image_path column stores the path relative to /public/cards/
-- Example: "white-box-demo/white-box-demo-blacks/card1.png"
--
-- To update a card with its image:
-- UPDATE cards SET image_path = 'white-box-demo/white-box-demo-blacks/card1.png' WHERE id = 'card_id';
--
