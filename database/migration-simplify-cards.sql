-- ============================================================================
-- AS WE ALL ARE - Migration: Simplify Cards Table
-- Run this to update the cards table structure
-- ============================================================================

-- Drop old cards table and recreate with simplified structure
DROP TABLE IF EXISTS cards CASCADE;

CREATE TABLE cards (
  id TEXT PRIMARY KEY,
  box_id TEXT REFERENCES boxes(id) NOT NULL,
  pile_id TEXT REFERENCES piles(id) NOT NULL,
  text TEXT,
  image_path TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cards_box_id ON cards(box_id);
CREATE INDEX IF NOT EXISTS idx_cards_pile_id ON cards(pile_id);
CREATE INDEX IF NOT EXISTS idx_cards_active ON cards(is_active);

-- Enable RLS
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY cards_public_read ON cards
  FOR SELECT USING (true);

CREATE POLICY cards_authenticated_all ON cards
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- Done! Cards table updated.
-- ============================================================================
