-- Social Posts Table Migration
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- 1. Create the social_posts table
CREATE TABLE social_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  caption TEXT,
  hashtags TEXT[],
  image_url TEXT,
  image_path TEXT,
  platforms TEXT[] DEFAULT '{}',
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  rejected_reason TEXT,
  project_type TEXT,
  alt_text TEXT,
  meta JSONB DEFAULT '{}'
);

-- 2. Create indexes for performance
CREATE INDEX idx_social_posts_public ON social_posts (published_at DESC) WHERE status = 'published';
CREATE INDEX idx_social_posts_status ON social_posts (status, scheduled_at);

-- 3. Enable Row Level Security
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

-- 4. Public can read published posts (no auth needed for /social feed)
CREATE POLICY "Public read published" ON social_posts
  FOR SELECT USING (status = 'published');

-- 5. Authenticated users (admin/designer) have full access
CREATE POLICY "Authenticated full access" ON social_posts
  FOR ALL USING (auth.role() = 'authenticated');

-- NOTE: After running this SQL, also create a 'social-images' storage bucket:
-- 1. Go to Storage in the Supabase dashboard
-- 2. Click "New bucket"
-- 3. Name: social-images
-- 4. Check "Public bucket"
-- 5. Set file size limit to 5MB
