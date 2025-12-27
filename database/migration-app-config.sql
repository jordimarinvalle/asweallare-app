-- Migration: Add app_config and app_socials tables
-- Run this on Supabase to add the new tables

-- ============================================================================
-- APP_CONFIG TABLE - Application settings and content
-- ============================================================================
CREATE TABLE IF NOT EXISTS app_config (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  title TEXT,
  tagline TEXT,
  promise TEXT,
  header_text TEXT,
  body_text TEXT,
  footer_text TEXT,
  build_version TEXT DEFAULT '1.0.0',
  admin_emails TEXT DEFAULT 'jordi.asweallare@gmail.com',
  primary_color TEXT DEFAULT '#D12128',
  secondary_color TEXT DEFAULT '#1F2937',
  accent_color TEXT DEFAULT '#6B7280',
  danger_color TEXT DEFAULT '#DC2626',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- APP_SOCIALS TABLE - Social links for the app
-- ============================================================================
CREATE TABLE IF NOT EXISTS app_socials (
  id TEXT PRIMARY KEY,
  app_id TEXT REFERENCES app_config(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_socials ENABLE ROW LEVEL SECURITY;

-- Public read access for app_config
CREATE POLICY "Public can read app_config" ON app_config
  FOR SELECT USING (true);

-- Public read access for active app_socials
CREATE POLICY "Public can read active app_socials" ON app_socials
  FOR SELECT USING (is_active = true);

-- Admin full access policies (assuming admin check via auth)
CREATE POLICY "Admins can manage app_config" ON app_config
  FOR ALL USING (true);

CREATE POLICY "Admins can manage app_socials" ON app_socials
  FOR ALL USING (true);

-- Insert default app config if not exists
INSERT INTO app_config (id, slug, name, title, tagline, promise, header_text, body_text, footer_text) 
SELECT 
  'app_asweallare', 
  'asweallare', 
  'AS WE ALL ARE', 
  'Unscripted Conversations', 
  'A therapeutic conversational card game', 
  'Know more about each other without the need to ask any question', 
  '## Welcome to AS WE ALL ARE

A space for **authentic connection** and meaningful conversations.',
  '### How It Works

1. **Select your deck** — Choose from our curated card collections
2. **Draw a card** — Each card presents a thoughtful prompt
3. **Share openly** — Take turns sharing your thoughts and experiences
4. **Listen deeply** — Create space for others to be heard

> "The quality of our lives depends on the quality of our conversations."

### Why This Matters

In a world of constant distraction, we''ve created a tool to help you:
- Build deeper connections
- Practice vulnerability
- Discover new perspectives
- Create meaningful memories',
  'Made with ❤️ for authentic human connection'
WHERE NOT EXISTS (SELECT 1 FROM app_config WHERE slug = 'asweallare');
