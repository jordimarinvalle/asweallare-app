-- ============================================================================
-- Migration: Add mockup_images table
-- Run this on existing Supabase databases to add the mockup images feature
-- ============================================================================

-- Create the mockup_images table
CREATE TABLE IF NOT EXISTS mockup_images (
  id TEXT PRIMARY KEY,
  box_id TEXT REFERENCES boxes(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  image_type TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT mockup_images_type_check CHECK (image_type IN ('BOX_MAIN', 'BOX_SECONDARY', 'CARD'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_mockup_images_box_id ON mockup_images(box_id);
CREATE INDEX IF NOT EXISTS idx_mockup_images_type ON mockup_images(image_type);
CREATE INDEX IF NOT EXISTS idx_mockup_images_order ON mockup_images(display_order);

-- Enable RLS (if using Supabase)
ALTER TABLE mockup_images ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to read mockup images
CREATE POLICY "Allow read access to mockup_images" ON mockup_images
  FOR SELECT
  USING (true);

-- Policy: Allow only admins to insert/update/delete (you may need to adjust based on your admin setup)
-- For now, using service role for admin operations
