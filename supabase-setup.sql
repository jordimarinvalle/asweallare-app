-- AS WE ALL ARE - Database Setup SQL
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ============================================
-- 1. CREATE CARDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  color TEXT NOT NULL CHECK (color IN ('black', 'white')),
  title TEXT NOT NULL,
  hint TEXT,
  language TEXT DEFAULT 'en',
  "isDemo" BOOLEAN DEFAULT false,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read cards" ON cards;
DROP POLICY IF EXISTS "Allow authenticated insert cards" ON cards;
DROP POLICY IF EXISTS "Allow authenticated update cards" ON cards;
DROP POLICY IF EXISTS "Allow authenticated delete cards" ON cards;

-- Create policies for cards
CREATE POLICY "Allow public read cards" ON cards FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert cards" ON cards FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update cards" ON cards FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated delete cards" ON cards FOR DELETE USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cards_color ON cards(color);
CREATE INDEX IF NOT EXISTS idx_cards_is_demo ON cards("isDemo");
CREATE INDEX IF NOT EXISTS idx_cards_is_active ON cards("isActive");

-- ============================================
-- 2. CREATE SAVED_DRAWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS saved_draws (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "userEmail" TEXT,
  "blackCardId" TEXT NOT NULL,
  "whiteCardId" TEXT NOT NULL,
  "blackCardTitle" TEXT NOT NULL,
  "whiteCardTitle" TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE saved_draws ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own draws" ON saved_draws;
DROP POLICY IF EXISTS "Users can insert own draws" ON saved_draws;

-- Create policies for saved_draws
CREATE POLICY "Users can read own draws" ON saved_draws 
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert own draws" ON saved_draws 
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_draws_user_id ON saved_draws("userId");
CREATE INDEX IF NOT EXISTS idx_draws_timestamp ON saved_draws(timestamp DESC);

-- ============================================
-- 3. CREATE USER_ACCESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_access (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "accessType" TEXT NOT NULL CHECK ("accessType" IN ('free', 'paid')),
  "paymentType" TEXT CHECK ("paymentType" IN ('onetime', 'subscription')),
  "stripeSessionId" TEXT,
  "expiresAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_access ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own access" ON user_access;
DROP POLICY IF EXISTS "Allow authenticated insert access" ON user_access;
DROP POLICY IF EXISTS "Allow authenticated update access" ON user_access;

-- Create policies for user_access
CREATE POLICY "Users can read own access" ON user_access 
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Allow authenticated insert access" ON user_access 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update access" ON user_access 
  FOR UPDATE USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_access_user_id ON user_access("userId");

-- ============================================
-- 4. INSERT DEMO CARDS (Optional Sample Data)
-- ============================================
-- Uncomment and run if you want some demo cards to start with

INSERT INTO cards (id, color, title, hint, language, "isDemo", "isActive") VALUES
('demo_black_1', 'black', 'What moment from today are you grateful for?', 'Think about the small things', 'en', true, true),
('demo_black_2', 'black', 'What fear have you overcome recently?', NULL, 'en', true, true),
('demo_black_3', 'black', 'Who do you miss right now?', NULL, 'en', true, true),
('demo_white_1', 'white', 'Share a childhood memory that shaped you', NULL, 'en', true, true),
('demo_white_2', 'white', 'What would you do if you had no fear?', NULL, 'en', true, true),
('demo_white_3', 'white', 'Describe a perfect day for you', NULL, 'en', true, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
