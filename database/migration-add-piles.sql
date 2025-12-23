-- ============================================================================
-- AS WE ALL ARE - Migration: Add Piles Table
-- Run this to add the piles table to an existing database
-- ============================================================================

-- Create piles table
CREATE TABLE IF NOT EXISTS piles (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  image_path TEXT NOT NULL,
  collection_series_id TEXT REFERENCES collection_series(id),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add pile_id to cards table if not exists
ALTER TABLE cards ADD COLUMN IF NOT EXISTS pile_id TEXT REFERENCES piles(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cards_pile ON cards(pile_id);
CREATE INDEX IF NOT EXISTS idx_piles_series ON piles(collection_series_id);
CREATE INDEX IF NOT EXISTS idx_piles_slug ON piles(slug);

-- Create trigger for updated_at
CREATE TRIGGER update_piles_updated_at
  BEFORE UPDATE ON piles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE piles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY piles_public_read ON piles
  FOR SELECT USING (true);

CREATE POLICY piles_authenticated_all ON piles
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- Done! Migration complete.
-- ============================================================================
