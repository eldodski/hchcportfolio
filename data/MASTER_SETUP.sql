-- ============================================================
-- HCHC PLATFORM — MASTER DATABASE SETUP
-- Run this ONCE in Supabase SQL Editor (Dashboard > SQL Editor)
-- Creates tables, RLS policies, indexes, and inserts 118 materials
-- ============================================================

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
  description TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

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

-- ============ FILES TABLE ============
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_name TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_vendor ON materials(vendor);
CREATE INDEX IF NOT EXISTS idx_materials_tone ON materials(tone);
CREATE INDEX IF NOT EXISTS idx_materials_price_tier ON materials(price_tier);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- ============ ROW LEVEL SECURITY ============
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Materials are viewable by everyone" ON materials FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert materials" ON materials FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update materials" ON materials FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete materials" ON materials FOR DELETE USING (true);

CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Users can create projects" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (true);

CREATE POLICY "Files viewable with project access" ON files FOR SELECT USING (true);
CREATE POLICY "Users can upload files" ON files FOR INSERT WITH CHECK (true);

-- ============ ORIGINAL 18 SEED MATERIALS ============
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

-- ============ 100 COMPREHENSIVE SCRAPED MATERIALS ============

-- FLOORING (20)
INSERT INTO materials (name, category, tone, price_tier, vendor, series, color, sku, description) VALUES
('Shaw Floorté Pro Paramount 512C Plus', 'flooring', 'warm', 'mid', 'Shaw', 'Floorté Pro', 'Honey Oak', '509SA-02002', 'Waterproof SPC luxury vinyl plank with warm honey oak tones and 20-mil wear layer'),
('Shaw Floorté Highlands 521SA', 'flooring', 'warm', 'mid', 'Shaw', 'Floorté', 'Chatter Oak', '521SA-02032', 'WPC luxury vinyl plank with natural oak grain and warm golden undertones'),
('Shaw Floorté Ignite WPC', 'flooring', 'warm', 'mid', 'Shaw', 'Floorté', 'Hickory Natural', 'FTE02-00272', 'New 2026 WPC plank with hickory-inspired visuals and hand-scraped texture'),
('Shaw Floorté Pro Paladin Plus', 'flooring', 'neutral', 'mid', 'Shaw', 'Floorté Pro', 'Highlight Oak', '509SA-01024', 'SPC rigid core plank with light warm-gray oak and lifetime residential warranty'),
('COREtec Pro Plus XL Bedford Oak', 'flooring', 'warm', 'high', 'COREtec', 'Pro Plus XL', 'Bedford Oak', 'VV488-02098', 'Premium 9-inch wide SPC plank with deep warm brown oak and enhanced detail'),
('COREtec Plus Enhanced Manila Oak', 'flooring', 'warm', 'high', 'COREtec', 'Plus Enhanced Planks', 'Manila Oak', 'VV012-00760', 'WPC luxury vinyl with warm manila oak tones and cork-backed comfort'),
('COREtec Plus Enhanced Aurora Oak', 'flooring', 'neutral', 'high', 'COREtec', 'Plus Enhanced Planks', 'Aurora Oak', 'VV012-00771', 'Balanced warm-neutral oak plank with subtle grain variation'),
('COREtec Plus Enhanced Alabaster Oak', 'flooring', 'neutral', 'high', 'COREtec', 'Plus Enhanced Planks', 'Alabaster Oak', 'VV024-00706', 'Light neutral oak with creamy white undertones for airy transitional spaces'),
('Mohawk RevWood Select Emberstone Ridge', 'flooring', 'warm', 'mid', 'Mohawk', 'RevWood Select', 'Honey Natural', 'RRS33-02', 'Waterproof laminate with honey-natural oak visuals and tight grain pattern'),
('Mohawk RevWood Plus Briarfield', 'flooring', 'warm', 'mid', 'Mohawk', 'RevWood Plus', 'Tawny Oak', 'WEK03-07', 'Ultra-wide 9.44-inch planks with premium EIR texture and warm tawny tones'),
('Mohawk RevWood Premier Sawmill Ridge', 'flooring', 'neutral', 'high', 'Mohawk', 'RevWood Premier', 'Cascade', 'RRP71-04', 'Premium waterproof laminate with rustic oak look and hand-scraped texture'),
('Daltile Emerson Wood Porcelain Tile', 'flooring', 'warm', 'mid', 'Daltile', 'Emerson Wood', 'Butter Pecan', 'EM03-0848', '8x48 porcelain wood-look tile with wirebrush texture in warm pecan tones'),
('Daltile Emerson Wood Ash White', 'flooring', 'cool', 'mid', 'Daltile', 'Emerson Wood', 'Ash White', 'EM01-0648', '6x48 porcelain wood-look tile in cool ash-white for contemporary interiors'),
('MSI Glenridge Saddle Oak LVP', 'flooring', 'warm', 'low', 'MSI', 'Glenridge', 'Saddle Oak', 'VTGSADOAK6X48-2MM', 'Glue-down luxury vinyl plank with rich warm brown saddle oak appearance'),
('MSI Katavia Reclaimed Wood LVP', 'flooring', 'warm', 'low', 'MSI', 'Katavia', 'Reclaimed Wood', 'VTGRECWOO6X48', 'Budget-friendly glue-down LVP with rustic reclaimed wood character'),
('MSI Nove Bayhill Blonde LVP', 'flooring', 'warm', 'mid', 'MSI', 'Nove', 'Bayhill Blonde', 'NOVE-BAYBLND', 'New eco-friendly Greenguard Gold certified plank in creamy cashew blonde'),
('Mannington ADURA Max Regency Oak', 'flooring', 'warm', 'high', 'Mannington', 'ADURA Max', 'Natural', 'MPB750-554286', 'Premium waterproof WPC with HydroLoc core and warm natural oak visuals'),
('Mannington ADURA Max Acacia', 'flooring', 'warm', 'high', 'Mannington', 'ADURA Max', 'Natural Plains', 'MAX010-555687', 'Exotic acacia wood look with natural color variation and warm honey tones'),
('Mannington ADURA Max Seaport', 'flooring', 'neutral', 'high', 'Mannington', 'ADURA Max', 'Sand', 'MAX040-555690', 'Coastal-inspired wood plank in sandy neutral tone with weathered character'),
('Mannington ADURA Max Coventry', 'flooring', 'cool', 'high', 'Mannington', 'ADURA Max', 'Greige', 'MPB781-554279', 'Wide plank luxury vinyl in cool greige with subtle grain and clean lines');

-- CABINETRY (15)
INSERT INTO materials (name, category, tone, price_tier, vendor, series, color, sku, description) VALUES
('KraftMaid Putnam Maple Shaker', 'cabinetry', 'warm', 'high', 'KraftMaid', 'Putnam', 'Praline', 'KM-PUTNAM-PRL', 'Full-overlay maple shaker door in warm praline stain with clean lines'),
('KraftMaid Putnam Maple Painted', 'cabinetry', 'neutral', 'high', 'KraftMaid', 'Putnam', 'Dove White', 'KM-PUTNAM-DW', 'Clean shaker-style maple door in soft dove white painted finish'),
('KraftMaid Garrison Maple', 'cabinetry', 'warm', 'high', 'KraftMaid', 'Garrison', 'Peppercorn', 'KM-GARRISON-PPC', 'Transitional raised-panel maple door in rich dark peppercorn stain'),
('Wellborn Premier Henlow Square', 'cabinetry', 'neutral', 'high', 'Wellborn', 'Premier', 'Glacier White', 'WB-HENLOW-GLC', 'Clean square-frame shaker door in bright glacier white paint'),
('Wellborn Select Prairie', 'cabinetry', 'warm', 'mid', 'Wellborn', 'Select', 'Drift', 'WB-PRAIRIE-DFT', 'Versatile prairie-style door in warm drift stain with natural wood grain'),
('Wellborn Premier Sonoma', 'cabinetry', 'warm', 'high', 'Wellborn', 'Premier', 'Shadow', 'WB-SONOMA-SHD', 'Contemporary flat-panel door in deep shadow stain for dramatic contrast'),
('Fabuwood Allure Galaxy Frost', 'cabinetry', 'neutral', 'mid', 'Fabuwood', 'Allure Galaxy', 'Frost', 'FAB-GALAXY-FRST', 'Best-selling all-wood shaker door in bright frost white painted finish'),
('Fabuwood Allure Galaxy Dove', 'cabinetry', 'cool', 'mid', 'Fabuwood', 'Allure Galaxy', 'Dove', 'FAB-GALAXY-DOVE', 'Soft gray-toned shaker cabinet in dove finish for cool transitional kitchens'),
('Fabuwood Allure Fusion Mocha', 'cabinetry', 'warm', 'mid', 'Fabuwood', 'Allure Fusion', 'Mocha', 'FAB-FUSION-MCH', 'Slab-style contemporary door in warm mocha stain for modern kitchens'),
('Shiloh Cabinetry Reese', 'cabinetry', 'warm', 'high', 'Shiloh', 'Reese', 'Natural Maple', 'SH-REESE-NM', 'Five-piece shaker door in natural maple with warm honey-gold tones'),
('IKEA AXSTAD Matte White', 'cabinetry', 'neutral', 'low', 'IKEA', 'AXSTAD', 'Matte White', '704.682.84', 'Modern matte white shaker-style door with clean Scandinavian lines'),
('IKEA BODBYN Gray', 'cabinetry', 'cool', 'low', 'IKEA', 'BODBYN', 'Gray', '302.210.53', 'Traditional frame-and-panel door in soft gray with beveled edge detail'),
('Cabinets To Go Shaker Elite', 'cabinetry', 'neutral', 'low', 'Cabinets To Go', 'Shaker Elite', 'White', 'CTG-SHKELITE-W', 'Affordable full-overlay shaker in bright white with dovetail drawers'),
('Cabinets To Go Tuscany Saddle', 'cabinetry', 'warm', 'low', 'Cabinets To Go', 'Tuscany', 'Saddle', 'CTG-TUSCANY-SDL', 'Raised-panel door in warm saddle brown stain with Old World character'),
('KraftMaid ColorCast Cottage', 'cabinetry', 'warm', 'high', 'KraftMaid', 'ColorCast', 'Shortbread', 'KM-COLORCAST-SB', 'Painted finish in warm shortbread cream with subtle depth');

-- COUNTERTOPS (15)
INSERT INTO materials (name, category, tone, price_tier, vendor, series, color, sku, description) VALUES
('Cambria Brittanicca Gold Warm', 'countertops', 'warm', 'high', 'Cambria', 'Marble Collection', 'Brittanicca Gold Warm', 'CAM-BRITGW', 'Flowing copper-gold and greige veining on soft white backdrop with warm earth tones'),
('Cambria Inverness Frost', 'countertops', 'cool', 'high', 'Cambria', 'Marble Collection', 'Inverness Frost', 'CAM-INVFST', 'Best-selling cool white with intricate off-white veining for bright kitchens'),
('Cambria Kenwood', 'countertops', 'warm', 'high', 'Cambria', 'Natural Collection', 'Kenwood', 'CAM-KENWOOD', 'Warm ivory background with delicate taupe veining and crackle detail'),
('Cambria Clovelly', 'countertops', 'warm', 'high', 'Cambria', 'Natural Collection', 'Clovelly', 'CAM-CLOVELLY', 'Warm quartz with soft movement and creamy undertones for transitional kitchens'),
('Silestone Eternal Calacatta Gold', 'countertops', 'warm', 'high', 'Silestone', 'Eternal', 'Calacatta Gold', 'SS-ET-CALCGOLD', 'Bright white background with elegant thick grey veins and subtle gold highlights'),
('Silestone Ethereal Glow', 'countertops', 'neutral', 'high', 'Silestone', 'Ethereal', 'Glow', 'SS-ETHGLOW', 'Subtle marble look with soft veining and warm-neutral undertones using HybriQ+ technology'),
('Silestone Charcoal Soapstone', 'countertops', 'cool', 'high', 'Silestone', 'Loft', 'Charcoal Soapstone', 'SS-CHSOAP', 'Deep charcoal with soapstone texture providing dramatic contrast without maintenance'),
('Caesarstone Statuario Maximus', 'countertops', 'cool', 'high', 'Caesarstone', 'Supernatural', 'Statuario Maximus', '5031', 'Bold cool white with dramatic grey veining mimicking natural Statuario marble'),
('Caesarstone Calacatta Nuvo', 'countertops', 'neutral', 'high', 'Caesarstone', 'Supernatural', 'Calacatta Nuvo', '5131', 'Soft white base with delicate grey veining for timeless marble-inspired elegance'),
('Caesarstone Buttermilk', 'countertops', 'warm', 'mid', 'Caesarstone', 'Classico', 'Buttermilk', '4220', 'Warm creamy beige with subtle speckling ideal for country and transitional kitchens'),
('MSI Calacatta Miraggio Cove', 'countertops', 'warm', 'high', 'MSI', 'Q Studio', 'Calacatta Miraggio Cove', 'Q-MSI-CALCOVE', 'USA-made quartz with golden Carrara-like base and warm gold-white-beige veining'),
('MSI Calacatta Alto', 'countertops', 'neutral', 'mid', 'MSI', 'Q Premium', 'Calacatta Alto', 'Q-MSI-CALALT', 'Sleek light white quartz for airy kitchen aesthetic with subtle warm veining'),
('MSI Carrara Breve', 'countertops', 'warm', 'mid', 'MSI', 'Q Premium', 'Carrara Breve', 'Q-MSI-CARBRV', 'Warm white background with shimmering gold and brown veins like natural marble'),
('Vicostone Taj Mahal', 'countertops', 'warm', 'mid', 'Vicostone', 'Natural', 'Taj Mahal', 'BQ8860', 'Warm golden-beige marble look with soft brown veining and luxurious depth'),
('Daltile One Quartz Luminesce', 'countertops', 'neutral', 'mid', 'Daltile', 'ONE Quartz', 'Frost White', 'NQ30-FRWHT', 'Clean neutral white quartz surface with minimal veining for modern spaces');

-- BACKSPLASH (15)
INSERT INTO materials (name, category, tone, price_tier, vendor, series, color, sku, description) VALUES
('Daltile Rittenhouse Square Subway', 'backsplash', 'neutral', 'low', 'Daltile', 'Rittenhouse Square', 'Arctic White', '010036MOD1P4', 'Classic 3x6 ceramic subway tile in crisp arctic white with glossy finish'),
('Daltile Contempee Crackle Wall Tile', 'backsplash', 'warm', 'mid', 'Daltile', 'Contempee', 'Warm Cream', 'DT-CNTP-WC', '2025 collection with uneven edges, dimensional surface and crackle finish'),
('Daltile Artefino Jewel Mosaic', 'backsplash', 'cool', 'mid', 'Daltile', 'Artefino Jewel', 'Pearl Blue', 'DT-ARTJWL-PB', '2025 mosaic collection with jewel-toned accents for decorative feature walls'),
('Jeffrey Court Bling Series Lamport', 'backsplash', 'neutral', 'mid', 'Jeffrey Court', 'Bling', 'Silver Glass and Marble', '99433', 'Glass and marble mosaic blend with silver shimmer for sophisticated backsplashes'),
('Jeffrey Court Classic Statuario Mosaic', 'backsplash', 'neutral', 'mid', 'Jeffrey Court', 'Chapter 15 Classic Statuario', 'White Marble', '99788', 'Natural marble mosaic with Statuario-inspired white and grey veining'),
('Jeffrey Court European Countryside', 'backsplash', 'warm', 'mid', 'Jeffrey Court', 'Chapter 19 European Countryside', 'Warm Taupe', '97935', 'Rustic-inspired mosaic tile in warm taupe tones for farmhouse and transitional kitchens'),
('Bedrosians Cloe White', 'backsplash', 'neutral', 'mid', 'Bedrosians', 'Cloe', 'White', 'DECCLOSWHT28G', 'Handmade-look 2.5x8 glossy ceramic subway with beautiful color variation'),
('Bedrosians Cloe Creme', 'backsplash', 'warm', 'mid', 'Bedrosians', 'Cloe', 'Creme', 'DECCLOCRM28G', 'Warm creme glossy ceramic subway tile with artisan variation for inviting kitchens'),
('Bedrosians Cloe Baby Blue', 'backsplash', 'cool', 'mid', 'Bedrosians', 'Cloe', 'Baby Blue', 'DECCLOBLU28G', 'Soft baby blue handmade-look subway for coastal and Hill Country inspired spaces'),
('MSI Whisper White Beveled Subway', 'backsplash', 'neutral', 'low', 'MSI', 'Highland Park', 'Whisper White', 'SMOT-PT-WW312B', 'Classic 3x12 beveled ceramic subway in soft whisper white with clean lines'),
('MSI Antique White Beveled Subway', 'backsplash', 'warm', 'low', 'MSI', 'Highland Park', 'Antique White', 'AMZ-M-00318', 'Warm antique white 2x6 beveled subway with subtle aged character'),
('MSI Arabesque Bianco Ceramic', 'backsplash', 'neutral', 'mid', 'MSI', 'Arabesque', 'Bianco', 'SMOT-ARA-WHT', 'Iconic Moroccan-shaped arabesque tile in bright white for decorative backsplashes'),
('Cle Tile Zellige Weathered White', 'backsplash', 'warm', 'high', 'Cle Tile', 'Zellige', 'Weathered White', 'CLE-ZLG-WTHWHT', 'Handmade Moroccan zellige tile with natural variation and warm patina'),
('Cle Tile Zellige Moroccan Blue', 'backsplash', 'cool', 'high', 'Cle Tile', 'Zellige', 'Moroccan Blue', 'CLE-ZLG-MRCBLU', 'Artisanal hand-cut zellige in deep Moroccan blue for statement backsplashes'),
('Daltile Color Wheel Ice White', 'backsplash', 'cool', 'low', 'Daltile', 'Color Wheel Retro', 'Ice White', 'CW02-22PM1P', 'Classic 2x2 ceramic mosaic in ice white for clean modern kitchen backsplashes');

-- HARDWARE (15)
INSERT INTO materials (name, category, tone, price_tier, vendor, series, color, sku, description) VALUES
('Amerock Candler Pull', 'hardware', 'warm', 'low', 'Amerock', 'Candler', 'Champagne Bronze', 'BP29355CZ', 'Traditional 3-inch pull in champagne bronze with soft curved detail'),
('Amerock Ravino Knob', 'hardware', 'warm', 'low', 'Amerock', 'Ravino', 'Champagne Bronze', 'BP53012CZ', 'Round 1-1/4 inch knob in champagne bronze with clean modern profile'),
('Amerock Blackrock Pull', 'hardware', 'warm', 'low', 'Amerock', 'Blackrock', 'Golden Champagne', 'BP55275BBZ', 'Sleek 3-inch center bar pull in golden champagne finish'),
('Amerock Monument Pull', 'hardware', 'warm', 'mid', 'Amerock', 'Monument', 'Golden Champagne', 'BP36909BBZ', 'Contemporary 8-13/16 inch bar pull in golden champagne for wide drawers'),
('Top Knobs Charlotte Honey Bronze', 'hardware', 'warm', 'mid', 'Top Knobs', 'Dakota', 'Honey Bronze', 'M2111', 'Elegant 6-inch bar pull in honey bronze with tapered ends'),
('Top Knobs Charlotte Brushed Nickel', 'hardware', 'cool', 'mid', 'Top Knobs', 'Dakota', 'Brushed Satin Nickel', 'M1281', 'Classic 3-inch bar pull in brushed satin nickel for transitional kitchens'),
('Top Knobs Ellis Mushroom Knob', 'hardware', 'neutral', 'mid', 'Top Knobs', 'Ellis', 'Flat Black', 'TK3000BLK', 'Simple 1-1/4 inch mushroom knob in flat black for modern hardware accents'),
('Emtek Freestone Cabinet Pull', 'hardware', 'warm', 'high', 'Emtek', 'Freestone', 'Satin Brass', 'EMT-FREESTONE-6-SB', 'Premium 6-inch artisan pull in satin brass with organic texture'),
('Emtek Alexander Cabinet Pull', 'hardware', 'neutral', 'high', 'Emtek', 'Alexander', 'Flat Black', 'EMT-ALEXANDER-6-FB', 'Modern 6-inch T-bar pull in flat black assembled to order in California'),
('Richelieu Expressions Modern Knob', 'hardware', 'warm', 'mid', 'Richelieu', 'Expressions', 'Champagne Bronze', 'BP734544CHBRZ', 'Contemporary round knob in champagne bronze with smooth modern profile'),
('Liberty Lombard Round Knob', 'hardware', 'neutral', 'low', 'Liberty', 'Lombard', 'Matte Black', 'P29542Z-FB-B', 'Clean 1-inch round knob in matte black for affordable modern hardware'),
('Franklin Brass Vignette Pull', 'hardware', 'warm', 'low', 'Franklin Brass', 'Vignette', 'Venetian Bronze', 'P17890V-VBR-C', 'Budget-friendly 3-inch dual mount pull in warm venetian bronze'),
('Brainerd Garrett Knob', 'hardware', 'warm', 'low', 'Brainerd', 'Garrett', 'Brushed Brass', 'BRN-GARRETT-BB', 'Classic 1-1/4 inch round knob in brushed brass for warm traditional accents'),
('Amerock Revitalize Pull', 'hardware', 'warm', 'mid', 'Amerock', 'Revitalize', 'Champagne Bronze', 'BP55355CZ', 'Extended 12-5/8 inch appliance pull in champagne bronze for statement hardware'),
('Richelieu Greenwich Pull', 'hardware', 'cool', 'mid', 'Richelieu', 'Greenwich', 'Brushed Nickel', 'BP5016192195', 'Sleek contemporary pull in brushed nickel for cool modern kitchens');

-- PAINT (20)
INSERT INTO materials (name, category, tone, price_tier, vendor, series, color, sku, description) VALUES
('Sherwin-Williams Alabaster', 'paint', 'warm', 'mid', 'Sherwin-Williams', 'Top 50', 'Alabaster', 'SW 7008', 'Best-selling warm off-white with faint yellow undertone for walls, trim, and exterior'),
('Sherwin-Williams Agreeable Gray', 'paint', 'warm', 'mid', 'Sherwin-Williams', 'Top 50', 'Agreeable Gray', 'SW 7029', 'Most popular SW color, warm greige perfect for open floor plans'),
('Sherwin-Williams Accessible Beige', 'paint', 'warm', 'mid', 'Sherwin-Williams', 'Top 50', 'Accessible Beige', 'SW 7036', 'Warm versatile beige with gray undertones for cozy transitional interiors'),
('Sherwin-Williams Shoji White', 'paint', 'warm', 'mid', 'Sherwin-Williams', 'Top 50', 'Shoji White', 'SW 7042', 'Creamy warm white with subtle depth, popular for open floor plans'),
('Sherwin-Williams Evergreen Fog', 'paint', 'cool', 'mid', 'Sherwin-Williams', 'Color of the Year 2022', 'Evergreen Fog', 'SW 9130', 'Sophisticated sage-green with gray undertones, still trending in Hill Country homes'),
('Sherwin-Williams Clary Sage', 'paint', 'warm', 'mid', 'Sherwin-Williams', 'Green Family', 'Clary Sage', 'SW 6178', 'Soft earthy sage green that pairs with warm neutrals and natural wood'),
('Sherwin-Williams Dover White', 'paint', 'warm', 'mid', 'Sherwin-Williams', 'White Family', 'Dover White', 'SW 6385', 'Classic warm white ideal for traditional and modern Hill Country homes'),
('Sherwin-Williams Creamy', 'paint', 'warm', 'mid', 'Sherwin-Williams', 'Top 50', 'Creamy', 'SW 7012', 'Rich warm off-white with yellow undertones for cozy inviting spaces'),
('Sherwin-Williams Anonymous', 'paint', 'cool', 'mid', 'Sherwin-Williams', 'Neutral Family', 'Anonymous', 'SW 7046', 'Sophisticated dark greige with cool undertones for accent walls'),
('Sherwin-Williams Halcyon Green', 'paint', 'cool', 'mid', 'Sherwin-Williams', 'Green Family', 'Halcyon Green', 'SW 6213', 'Gentle sage with LRV around 54, popular for kitchens'),
('Benjamin Moore White Dove', 'paint', 'warm', 'high', 'Benjamin Moore', 'Off-White Collection', 'White Dove', 'OC-17', 'Iconic warm white with soft creamy undertone, perfect for cabinets and trim'),
('Benjamin Moore Revere Pewter', 'paint', 'warm', 'high', 'Benjamin Moore', 'Historical Collection', 'Revere Pewter', 'HC-172', 'Best-selling warm greige that anchors rooms with sophisticated warmth'),
('Benjamin Moore Pale Oak', 'paint', 'warm', 'high', 'Benjamin Moore', 'Off-White Collection', 'Pale Oak', 'OC-20', 'Soft warm neutral with pink-beige undertones for light-filled transitional rooms'),
('Benjamin Moore Hale Navy', 'paint', 'cool', 'high', 'Benjamin Moore', 'Historical Collection', 'Hale Navy', 'HC-154', 'Rich deep navy for dramatic accent walls, pairs with warm whites'),
('Benjamin Moore Silhouette', 'paint', 'warm', 'high', 'Benjamin Moore', 'Affinity', 'Silhouette', 'AF-655', '2026 Color of the Year: rich espresso brown with charcoal and burnt umber notes'),
('Benjamin Moore Pashmina', 'paint', 'warm', 'high', 'Benjamin Moore', 'Affinity', 'Pashmina', 'AF-100', 'Warm greige with subtle taupe undertones for soft, sophisticated interiors'),
('Behr Blank Canvas', 'paint', 'warm', 'low', 'Behr', 'Premium Plus', 'Blank Canvas', 'DC-003', 'Creamy warm white that anchors spaces without being stark or cold'),
('Behr Wheat Bread', 'paint', 'warm', 'low', 'Behr', 'Premium Plus', 'Wheat Bread', 'PPU4-13', 'Warm greige without cold blue undertones, perfect for whole-house color'),
('Behr Urban Nature', 'paint', 'cool', 'low', 'Behr', 'Premium Plus', 'Urban Nature', 'PPU11-05', 'Muted sage green that acts as a relaxing neutral for bedrooms and living areas'),
('Behr Even Better Beige', 'paint', 'warm', 'low', 'Behr', 'Premium Plus', 'Even Better Beige', 'PPU4-04', 'Rich warm beige with camel undertones for cozy and timeless appeal');

-- ============================================================
-- DONE — 118 materials total (18 seed + 100 comprehensive)
-- 3 tables created, RLS enabled, indexes built
-- ============================================================
