-- ============================================================
-- HCHC Auth & Navigation Migrations
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- Run this AFTER the Clerk JWT template is configured
-- ============================================================

-- ============================================================
-- 1. USER PROFILES TABLE
-- Stores role, tier, status for each Clerk user
-- ============================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id text UNIQUE NOT NULL,
  email text,
  first_name text,
  last_name text,
  company_name text,
  role text NOT NULL DEFAULT 'homeowner'
    CHECK (role IN ('admin', 'interior_designer', 'builder', 'homeowner')),
  tier text DEFAULT NULL
    CHECK (tier IS NULL OR tier IN ('tier_1', 'tier_2', 'tier_3')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
  terms_agreed boolean DEFAULT false,
  terms_agreed_at timestamptz,
  terms_version text,
  subscription_end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast lookups by Clerk user ID
CREATE INDEX IF NOT EXISTS idx_user_profiles_clerk_id ON user_profiles (clerk_user_id);

-- Prevent admin role from being set via normal flows
-- (Admin accounts are created directly in Supabase by Ena)
-- Note: This constraint allows INSERT with admin only if done directly in SQL editor
-- The Edge Function enforces role != 'admin' on signup

-- ============================================================
-- 2. SIGNUP REQUESTS TABLE
-- Queue for Ena to approve/reject new accounts
-- ============================================================

CREATE TABLE IF NOT EXISTS signup_requests (
  request_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  clerk_user_id text NOT NULL,
  role_requested text NOT NULL,
  email text NOT NULL,
  name text,
  company_name text,
  submitted_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  admin_notes text
);

CREATE INDEX IF NOT EXISTS idx_signup_requests_status ON signup_requests (status);

-- ============================================================
-- 3. NOTIFICATION LOG TABLE
-- Fallback for email notifications until Resend is configured
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL,
  recipient text NOT NULL,
  subject text,
  body text,
  sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 4. ENABLE ROW-LEVEL SECURITY ON ALL TABLES
-- ============================================================

-- Enable RLS (tables with RLS enabled and no policies block all access — safe default)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE signup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Enable on social_posts if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'social_posts') THEN
    EXECUTE 'ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- ============================================================
-- 5. RLS POLICIES — user_profiles
-- ============================================================

-- Users can read their own profile
CREATE POLICY "Users read own profile"
  ON user_profiles FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- Admin can read all profiles
CREATE POLICY "Admin reads all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE clerk_user_id = auth.jwt() ->> 'sub'
      AND role = 'admin'
    )
  );

-- Users can update their own profile (limited fields handled at app layer)
CREATE POLICY "Users update own profile"
  ON user_profiles FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub')
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

-- Admin can update all profiles
CREATE POLICY "Admin updates all profiles"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE clerk_user_id = auth.jwt() ->> 'sub'
      AND role = 'admin'
    )
  );

-- Insert handled by Edge Function (service role), not client
-- Admin can delete
CREATE POLICY "Admin deletes profiles"
  ON user_profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE clerk_user_id = auth.jwt() ->> 'sub'
      AND role = 'admin'
    )
  );

-- ============================================================
-- 6. RLS POLICIES — signup_requests
-- ============================================================

-- Only admin can read signup requests
CREATE POLICY "Admin reads signup requests"
  ON signup_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE clerk_user_id = auth.jwt() ->> 'sub'
      AND role = 'admin'
    )
  );

-- Only admin can update signup requests
CREATE POLICY "Admin updates signup requests"
  ON signup_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE clerk_user_id = auth.jwt() ->> 'sub'
      AND role = 'admin'
    )
  );

-- ============================================================
-- 7. RLS POLICIES — materials
-- ============================================================

-- Any active authenticated user can read materials
CREATE POLICY "Active users read materials"
  ON materials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE clerk_user_id = auth.jwt() ->> 'sub'
      AND status = 'active'
    )
  );

-- Also allow anon/public read for the public materials page
CREATE POLICY "Public reads materials"
  ON materials FOR SELECT
  USING (true);

-- Admin only for insert/update/delete
CREATE POLICY "Admin manages materials"
  ON materials FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE clerk_user_id = auth.jwt() ->> 'sub'
      AND role = 'admin'
    )
  );

-- ============================================================
-- 8. RLS POLICIES — projects
-- ============================================================

-- Users see only their own projects
CREATE POLICY "Users read own projects"
  ON projects FOR SELECT
  USING (user_id = auth.jwt() ->> 'sub');

-- Admin sees all projects
CREATE POLICY "Admin reads all projects"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE clerk_user_id = auth.jwt() ->> 'sub'
      AND role = 'admin'
    )
  );

-- Users can insert/update their own projects
CREATE POLICY "Users manage own projects"
  ON projects FOR ALL
  USING (user_id = auth.jwt() ->> 'sub');

-- Admin manages all projects
CREATE POLICY "Admin manages all projects"
  ON projects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE clerk_user_id = auth.jwt() ->> 'sub'
      AND role = 'admin'
    )
  );

-- ============================================================
-- 9. RLS POLICIES — social_posts (if exists)
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'social_posts') THEN
    -- Published posts readable by everyone
    EXECUTE 'CREATE POLICY "Public reads published posts" ON social_posts FOR SELECT USING (published_at IS NOT NULL)';
    -- Admin manages all posts
    EXECUTE 'CREATE POLICY "Admin manages posts" ON social_posts FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE clerk_user_id = auth.jwt() ->> ''sub'' AND role = ''admin''))';
  END IF;
END $$;

-- ============================================================
-- 10. RLS POLICIES — notification_log
-- ============================================================

-- Admin only
CREATE POLICY "Admin manages notifications"
  ON notification_log FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE clerk_user_id = auth.jwt() ->> 'sub'
      AND role = 'admin'
    )
  );

-- ============================================================
-- 11. INSERT ENA'S ADMIN ACCOUNT
-- ============================================================

INSERT INTO user_profiles (clerk_user_id, email, first_name, last_name, role, status)
VALUES (
  'user_3CrNXd96VPw20vqdr9pZGwDLu9S',
  'ena.dodski@gmail.com',
  'Ena',
  'Dodski',
  'admin',
  'active'
)
ON CONFLICT (clerk_user_id) DO UPDATE SET
  role = 'admin',
  status = 'active',
  updated_at = now();

-- ============================================================
-- DONE. Verify by checking Table Editor for user_profiles and signup_requests.
-- ============================================================
