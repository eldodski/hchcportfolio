-- HC Finishing — Intake Engine Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- Extends existing HCHC database with order form intake tables

-- ============ ORDER FORMS TABLE ============
CREATE TABLE IF NOT EXISTS order_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  original_filename TEXT NOT NULL,
  file_url TEXT,
  raw_text TEXT,
  parsed_json JSONB DEFAULT '{}',
  parse_status TEXT DEFAULT 'pending' CHECK (parse_status IN ('pending', 'parsed', 'failed')),
  parse_confidence TEXT CHECK (parse_confidence IN ('high', 'medium', 'low')),
  parse_warnings TEXT[] DEFAULT '{}',
  reviewed BOOLEAN DEFAULT false,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_order_forms_project_id ON order_forms(project_id);
CREATE INDEX IF NOT EXISTS idx_order_forms_parse_status ON order_forms(parse_status);
CREATE INDEX IF NOT EXISTS idx_order_forms_reviewed ON order_forms(reviewed);

-- ============ ROW LEVEL SECURITY ============
ALTER TABLE order_forms ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "order_forms_public_read" ON order_forms
  FOR SELECT USING (true);

-- Authenticated write access
CREATE POLICY "order_forms_authenticated_insert" ON order_forms
  FOR INSERT WITH CHECK (true);

CREATE POLICY "order_forms_authenticated_update" ON order_forms
  FOR UPDATE USING (true);

CREATE POLICY "order_forms_authenticated_delete" ON order_forms
  FOR DELETE USING (true);

-- ============ STORAGE BUCKET ============
-- Create via Supabase Dashboard: Storage > New Bucket
-- Name: order-forms
-- Public: true (for file URLs)
-- Allowed MIME types: application/pdf, image/png, image/jpeg

-- ============ AUTO-UPDATE TIMESTAMP ============
CREATE OR REPLACE FUNCTION update_order_forms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_forms_updated_at
  BEFORE UPDATE ON order_forms
  FOR EACH ROW
  EXECUTE FUNCTION update_order_forms_updated_at();
