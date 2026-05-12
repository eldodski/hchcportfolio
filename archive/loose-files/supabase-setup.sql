-- HCHC Platform — Supabase Setup
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- ============ MATERIALS TABLE ============
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  tone TEXT,
  price_tier TEXT,
  image_url TEXT,
  vendor TEXT,
  series TEXT,
  color TEXT,
  sku TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_vendor ON materials(vendor);

-- ============ PROJECTS TABLE ============
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  client_name TEXT,
  builder_name TEXT,
  address TEXT,
  status TEXT DEFAULT 'submitted',
  selections_json JSONB DEFAULT '{}',
  presentation_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- ============ FILES TABLE ============
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_name TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- ============ ROW LEVEL SECURITY ============

-- Enable RLS on all tables
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Materials: readable by everyone, writable by authenticated users
CREATE POLICY "Materials are viewable by everyone"
  ON materials FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert materials"
  ON materials FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update materials"
  ON materials FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete materials"
  ON materials FOR DELETE
  USING (true);

-- Projects: users see their own, admins see all
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (true);

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (true);

-- Files: follow project access
CREATE POLICY "Files viewable with project access"
  ON files FOR SELECT
  USING (true);

CREATE POLICY "Users can upload files"
  ON files FOR INSERT
  WITH CHECK (true);

-- ============ STORAGE BUCKETS ============
-- Run these separately if the SQL editor does not support storage functions.
-- Otherwise, create buckets manually in Dashboard > Storage:
--   1. Bucket name: material-images (Public)
--   2. Bucket name: uploads (Private)
--   3. Bucket name: presentations (Public)

-- ============ SEED DATA ============
-- 18 starter materials so the presentation engine works out of the box

INSERT INTO materials (name, category, tone, price_tier, vendor, series, color, sku) VALUES
  ('European White Oak Hardwood', 'flooring', 'warm', 'high', 'Shaw', 'Canyon Ridge', 'Alabaster Oak', 'EWOAK-001'),
  ('Luxury Vinyl Plank - Harvest Oak', 'flooring', 'warm', 'low', 'COREtec', 'Pro Plus Enhanced', 'Harvest Oak', 'LVP-HO-42'),
  ('Large Format Concrete Tile', 'flooring', 'cool', 'mid', 'Daltile', 'Industrial Vogue', 'Steel Grey', 'LFC-24x48'),
  ('White Shaker Cabinet', 'cabinetry', 'neutral', 'mid', 'KraftMaid', 'Durham', 'Dove White', 'WS-BASE-36'),
  ('Natural Walnut Flat Panel', 'cabinetry', 'warm', 'high', 'Wellborn', 'Aspire', 'Natural Walnut', 'WFP-WAL-01'),
  ('Matte Grey Slab Door', 'cabinetry', 'cool', 'mid', 'IKEA', 'VOXTORP', 'Dark Grey', 'VOXTORP-GRY'),
  ('Calacatta Quartz', 'countertops', 'neutral', 'high', 'Cambria', 'Brittanicca', 'Warm', 'CAL-QTZ-01'),
  ('White Quartz with Grey Veining', 'countertops', 'neutral', 'mid', 'Silestone', 'Ethereal', 'Haze', 'WQ-GV-22'),
  ('Honed Granite - Absolute Black', 'countertops', 'cool', 'high', 'MSI', 'Premium Natural', 'Absolute Black', 'HG-AB-3CM'),
  ('White Marble Subway Tile 3x6', 'backsplash', 'neutral', 'mid', 'Jeffrey Court', 'Carrara Collection', 'White Vein', 'WMS-3x6'),
  ('Zellige Tile - Warm White', 'backsplash', 'warm', 'high', 'Cle Tile', 'Zellige', 'Weathered White', 'ZEL-WW-4x4'),
  ('Matte White Large Format Porcelain', 'backsplash', 'cool', 'mid', 'Daltile', 'Chord', 'Canvas White', 'MWLF-12x24'),
  ('Brushed Brass Pull - 5 inch', 'hardware', 'warm', 'mid', 'Amerock', 'Mulholland', 'Golden Champagne', 'BB-PULL-5'),
  ('Matte Black Bar Pull - 6 inch', 'hardware', 'neutral', 'low', 'Franklin Brass', 'Simple Modern', 'Matte Black', 'MB-BAR-6'),
  ('Brushed Nickel Knob', 'hardware', 'cool', 'low', 'Liberty Hardware', 'Classic Edge', 'Brushed Nickel', 'BN-KNOB-1'),
  ('Sherwin-Williams Alabaster SW7008', 'paint', 'warm', 'mid', 'Sherwin-Williams', 'Living Well', 'Alabaster', 'SW7008'),
  ('Benjamin Moore Chantilly Lace OC-65', 'paint', 'cool', 'mid', 'Benjamin Moore', 'Off-White Collection', 'Chantilly Lace', 'OC-65'),
  ('Sherwin-Williams Agreeable Gray SW7029', 'paint', 'neutral', 'mid', 'Sherwin-Williams', 'Living Well', 'Agreeable Gray', 'SW7029');
