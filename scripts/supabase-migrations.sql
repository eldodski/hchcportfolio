-- ============================================================
-- PHASE A: Data Foundation Migrations
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================

-- 1. Add material_type column to materials table
ALTER TABLE materials ADD COLUMN IF NOT EXISTS material_type text;

-- 2. Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_materials_material_type ON materials (material_type);

-- 3. Add edgeProtection as a valid category (if using enum/check constraint, skip if no constraint)
-- No constraint detected — category is free text, so no ALTER needed.

-- ============================================================
-- 4. Insert Edge Protection Materials
-- ============================================================

-- Schluter Metal Profiles
INSERT INTO materials (name, vendor, series, color, category, material_type, tone, price_tier)
VALUES
  ('Schluter Jolly Chrome', 'Schluter', 'Jolly', 'Chrome', 'edgeProtection', 'Metal Profile', 'cool', 'mid'),
  ('Schluter Jolly Brushed Brass', 'Schluter', 'Jolly', 'Brushed Brass', 'edgeProtection', 'Metal Profile', 'warm', 'premium'),
  ('Schluter Jolly Brushed Nickel', 'Schluter', 'Jolly', 'Brushed Nickel', 'edgeProtection', 'Metal Profile', 'cool', 'mid'),
  ('Schluter Jolly Stainless Steel', 'Schluter', 'Jolly', 'Stainless Steel', 'edgeProtection', 'Metal Profile', 'cool', 'premium'),
  ('Schluter Rondec Chrome', 'Schluter', 'Rondec', 'Chrome', 'edgeProtection', 'Metal Profile', 'cool', 'mid'),
  ('Schluter Rondec Brushed Brass', 'Schluter', 'Rondec', 'Brushed Brass', 'edgeProtection', 'Metal Profile', 'warm', 'premium'),
  ('Schluter Rondec Brushed Nickel', 'Schluter', 'Rondec', 'Brushed Nickel', 'edgeProtection', 'Metal Profile', 'cool', 'mid'),
  ('Schluter Rondec Stainless Steel', 'Schluter', 'Rondec', 'Stainless Steel', 'edgeProtection', 'Metal Profile', 'cool', 'premium'),
  ('Schluter Quadec Chrome', 'Schluter', 'Quadec', 'Chrome', 'edgeProtection', 'Metal Profile', 'cool', 'mid'),
  ('Schluter Quadec Brushed Brass', 'Schluter', 'Quadec', 'Brushed Brass', 'edgeProtection', 'Metal Profile', 'warm', 'premium'),
  ('Schluter Quadec Brushed Nickel', 'Schluter', 'Quadec', 'Brushed Nickel', 'edgeProtection', 'Metal Profile', 'cool', 'mid'),
  ('Schluter Quadec Stainless Steel', 'Schluter', 'Quadec', 'Stainless Steel', 'edgeProtection', 'Metal Profile', 'cool', 'premium');

-- Emser Metal Profiles
INSERT INTO materials (name, vendor, series, color, category, material_type, tone, price_tier)
VALUES
  ('Emser Metal Profile Chrome', 'Emser', 'Metal Profile', 'Chrome', 'edgeProtection', 'Metal Profile', 'cool', 'mid'),
  ('Emser Metal Profile Brushed Nickel', 'Emser', 'Metal Profile', 'Brushed Nickel', 'edgeProtection', 'Metal Profile', 'cool', 'mid'),
  ('Emser Metal Profile Brass', 'Emser', 'Metal Profile', 'Brass', 'edgeProtection', 'Metal Profile', 'warm', 'premium');

-- Bullnose Tile
INSERT INTO materials (name, vendor, series, color, category, material_type, tone, price_tier)
VALUES
  ('Bullnose White', 'Generic', 'Bullnose', 'White', 'edgeProtection', 'Bullnose', 'cool', 'builder'),
  ('Bullnose Almond', 'Generic', 'Bullnose', 'Almond', 'edgeProtection', 'Bullnose', 'warm', 'builder');

-- Pencil Rail Tile
INSERT INTO materials (name, vendor, series, color, category, material_type, tone, price_tier)
VALUES
  ('Pencil Rail White', 'Generic', 'Pencil Rail', 'White', 'edgeProtection', 'Pencil Rail', 'cool', 'builder'),
  ('Pencil Rail Carrara', 'Generic', 'Pencil Rail', 'Carrara', 'edgeProtection', 'Pencil Rail', 'neutral', 'mid');

-- Cigarro Stone/Marble
INSERT INTO materials (name, vendor, series, color, category, material_type, tone, price_tier)
VALUES
  ('Cigarro Bianco Carrara', 'Generic', 'Cigarro', 'Bianco Carrara', 'edgeProtection', 'Cigarro', 'cool', 'premium'),
  ('Cigarro Crema Marfil', 'Generic', 'Cigarro', 'Crema Marfil', 'edgeProtection', 'Cigarro', 'warm', 'premium');
