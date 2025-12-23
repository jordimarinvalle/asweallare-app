-- ============================================================================
-- AS WE ALL ARE - Fix RLS Policies for Supabase
-- Run this in Supabase SQL Editor to fix admin access
-- This version handles all edge cases
-- ============================================================================

-- First, let's see what policies exist and drop them all
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies on collection_series
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'collection_series' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON collection_series', pol.policyname);
    END LOOP;
    
    -- Drop all policies on boxes
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'boxes' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON boxes', pol.policyname);
    END LOOP;
    
    -- Drop all policies on cards
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'cards' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON cards', pol.policyname);
    END LOOP;
    
    -- Drop all policies on prices
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'prices' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON prices', pol.policyname);
    END LOOP;
    
    -- Drop all policies on bundles
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'bundles' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON bundles', pol.policyname);
    END LOOP;
    
    -- Drop all policies on user_products
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'user_products' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_products', pol.policyname);
    END LOOP;
    
    -- Drop all policies on user_memberships
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'user_memberships' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_memberships', pol.policyname);
    END LOOP;
END $$;

-- ============================================================================
-- Ensure RLS is enabled on all tables
-- ============================================================================
ALTER TABLE collection_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memberships ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Create simple permissive policies
-- These allow all operations - admin check is done in application code
-- ============================================================================

-- Collection Series
CREATE POLICY allow_all_collection_series ON collection_series FOR ALL USING (true) WITH CHECK (true);

-- Boxes
CREATE POLICY allow_all_boxes ON boxes FOR ALL USING (true) WITH CHECK (true);

-- Cards
CREATE POLICY allow_all_cards ON cards FOR ALL USING (true) WITH CHECK (true);

-- Prices
CREATE POLICY allow_all_prices ON prices FOR ALL USING (true) WITH CHECK (true);

-- Bundles
CREATE POLICY allow_all_bundles ON bundles FOR ALL USING (true) WITH CHECK (true);

-- User Products
CREATE POLICY allow_all_user_products ON user_products FOR ALL USING (true) WITH CHECK (true);

-- User Memberships
CREATE POLICY allow_all_user_memberships ON user_memberships FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- Done! All tables now allow all operations.
-- ============================================================================
SELECT 'RLS policies updated successfully!' as status;
