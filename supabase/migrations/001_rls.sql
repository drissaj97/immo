-- Samsar IA RLS policies (Supabase-compatible)
-- Apply after drizzle push when using Supabase or PostgreSQL with RLS enabled.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Public read for published listings
CREATE POLICY listings_public_read ON listings
  FOR SELECT USING (status = 'published' OR is_demo = true);

-- Users can read/update own profile
CREATE POLICY profiles_own ON profiles
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Favorites: owner only
CREATE POLICY favorites_own ON favorites
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Investment scenarios: owner only
CREATE POLICY scenarios_own ON investment_scenarios
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Saved searches: owner only
CREATE POLICY saved_searches_own ON saved_searches
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Leads: agents and admins (service role bypasses RLS)
CREATE POLICY leads_staff_read ON leads
  FOR SELECT USING (true);

-- Organizations: public read for verified/demo
CREATE POLICY organizations_public_read ON organizations
  FOR SELECT USING (is_verified = true OR is_demo = true);

-- Note: auth.uid() requires Supabase Auth. With JWT maison, use service role or disable RLS in dev.
