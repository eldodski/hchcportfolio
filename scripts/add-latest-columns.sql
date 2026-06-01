-- Add columns needed for public site "Latest" feed (UI Flow 02 spec)
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- 1. Add new columns to social_posts table
ALTER TABLE social_posts
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS content_tag TEXT,
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT false;

-- 2. Create unique index on slug for individual post pages
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_posts_slug
  ON social_posts (slug) WHERE slug IS NOT NULL;

-- 3. Create index for pinned + published ordering (Latest feed query)
CREATE INDEX IF NOT EXISTS idx_social_posts_latest
  ON social_posts (pinned DESC, published_at DESC)
  WHERE status = 'published';

-- 4. Backfill content_tag from project_type for existing posts
-- Maps existing project_type values to content_tag categories
UPDATE social_posts SET content_tag = 'projects'
  WHERE project_type IN ('kitchen', 'bathroom', 'living', 'bedroom', 'exterior', 'flooring')
  AND content_tag IS NULL;

UPDATE social_posts SET content_tag = 'tips'
  WHERE project_type IN ('tile', 'moodboard')
  AND content_tag IS NULL;

-- 5. Generate slugs for existing published posts that lack one
UPDATE social_posts SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      COALESCE(title, LEFT(caption, 60)),
      '[^a-zA-Z0-9\s-]', '', 'g'
    ),
    '\s+', '-', 'g'
  )
) || '-' || LEFT(id::text, 8)
WHERE status = 'published' AND slug IS NULL;
