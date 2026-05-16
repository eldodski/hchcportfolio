-- ============================================================
-- FIX: Ensure public read policies exist for materials and social_posts
-- Run this in Supabase SQL Editor if materials show empty
-- ============================================================

-- Drop and recreate materials public read policy
DROP POLICY IF EXISTS "Public reads materials" ON materials;
CREATE POLICY "Public reads materials"
  ON materials FOR SELECT
  USING (true);

-- Drop and recreate social_posts public read policy for published posts
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'social_posts') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public reads published posts" ON social_posts';
    EXECUTE 'CREATE POLICY "Public reads published posts" ON social_posts FOR SELECT USING (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Admin manages posts" ON social_posts';
    EXECUTE 'CREATE POLICY "Admin manages posts" ON social_posts FOR ALL USING (true)';
  END IF;
END $$;

-- Verify policies
SELECT tablename, policyname, cmd, qual FROM pg_policies
WHERE tablename IN ('materials', 'social_posts')
ORDER BY tablename, policyname;
