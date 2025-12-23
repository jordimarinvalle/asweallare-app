-- ============================================================================
-- AS WE ALL ARE - Fix RLS Policies for Supabase
-- Run this in Supabase SQL Editor to fix admin access
-- ============================================================================

-- Drop existing policies that might be blocking
DROP POLICY IF EXISTS collection_series_public_read ON collection_series;
DROP POLICY IF EXISTS collection_series_authenticated_all ON collection_series;
DROP POLICY IF EXISTS collection_series_service_all ON collection_series;

DROP POLICY IF EXISTS boxes_public_read ON boxes;
DROP POLICY IF EXISTS boxes_authenticated_all ON boxes;

DROP POLICY IF EXISTS cards_public_read ON cards;
DROP POLICY IF EXISTS cards_authenticated_all ON cards;

DROP POLICY IF EXISTS prices_public_read ON prices;
DROP POLICY IF EXISTS prices_authenticated_all ON prices;
DROP POLICY IF EXISTS prices_service_all ON prices;

DROP POLICY IF EXISTS bundles_public_read ON bundles;
DROP POLICY IF EXISTS bundles_authenticated_all ON bundles;
DROP POLICY IF EXISTS bundles_service_all ON bundles;

DROP POLICY IF EXISTS user_products_read_own ON user_products;
DROP POLICY IF EXISTS user_products_authenticated_all ON user_products;

DROP POLICY IF EXISTS user_memberships_read_own ON user_memberships;
DROP POLICY IF EXISTS user_memberships_authenticated_all ON user_memberships;
DROP POLICY IF EXISTS user_memberships_service_all ON user_memberships;

-- ============================================================================
-- SIMPLE POLICIES: Allow all operations for now
-- (Admin check is done in application code)
-- ============================================================================

-- Collection Series
CREATE POLICY collection_series_select ON collection_series FOR SELECT USING (true);
CREATE POLICY collection_series_insert ON collection_series FOR INSERT WITH CHECK (true);
CREATE POLICY collection_series_update ON collection_series FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY collection_series_delete ON collection_series FOR DELETE USING (true);

-- Boxes
CREATE POLICY boxes_select ON boxes FOR SELECT USING (true);
CREATE POLICY boxes_insert ON boxes FOR INSERT WITH CHECK (true);
CREATE POLICY boxes_update ON boxes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY boxes_delete ON boxes FOR DELETE USING (true);

-- Cards
CREATE POLICY cards_select ON cards FOR SELECT USING (true);
CREATE POLICY cards_insert ON cards FOR INSERT WITH CHECK (true);
CREATE POLICY cards_update ON cards FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY cards_delete ON cards FOR DELETE USING (true);

-- Prices
CREATE POLICY prices_select ON prices FOR SELECT USING (true);
CREATE POLICY prices_insert ON prices FOR INSERT WITH CHECK (true);
CREATE POLICY prices_update ON prices FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY prices_delete ON prices FOR DELETE USING (true);

-- Bundles
CREATE POLICY bundles_select ON bundles FOR SELECT USING (true);
CREATE POLICY bundles_insert ON bundles FOR INSERT WITH CHECK (true);
CREATE POLICY bundles_update ON bundles FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY bundles_delete ON bundles FOR DELETE USING (true);

-- User Products
CREATE POLICY user_products_select ON user_products FOR SELECT USING (true);
CREATE POLICY user_products_insert ON user_products FOR INSERT WITH CHECK (true);
CREATE POLICY user_products_update ON user_products FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY user_products_delete ON user_products FOR DELETE USING (true);

-- User Memberships
CREATE POLICY user_memberships_select ON user_memberships FOR SELECT USING (true);
CREATE POLICY user_memberships_insert ON user_memberships FOR INSERT WITH CHECK (true);
CREATE POLICY user_memberships_update ON user_memberships FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY user_memberships_delete ON user_memberships FOR DELETE USING (true);

-- ============================================================================
-- Done! RLS policies updated.
-- ============================================================================
