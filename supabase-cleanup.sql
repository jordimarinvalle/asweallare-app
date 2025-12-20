-- AS WE ALL ARE - Cleanup Script
-- Run this in Supabase SQL Editor to remove placeholder cards

-- Delete all cards that don't have an image_path
DELETE FROM cards WHERE image_path IS NULL;

-- Verify remaining cards all have images
SELECT COUNT(*) as total_cards, 
       COUNT(image_path) as cards_with_images 
FROM cards;
