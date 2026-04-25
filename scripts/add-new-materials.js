// Add new materials to Supabase: Lions Floors LVP, Masterbrand Cabinetry, Emser/DalTile/Arizona Tile
// Run: node scripts/add-new-materials.js

const SUPABASE_URL = 'https://eqqllaiswgkoxrivgmig.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcWxsYWlzd2drb3hyaXZnbWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NjY5NjAsImV4cCI6MjA5MjA0Mjk2MH0.D8KuzcRktLom6lTL7QChPih8CmZaThEpjy5lGYl-ZAM';

const materials = [

  // ==========================================
  // LIONS FLOOR - DISTRICT (6 mil LVP)
  // ==========================================
  { name: 'Lions Floor District Billings', category: 'flooring', tone: 'warm', price_tier: 'low', vendor: 'Lions Floor', series: 'District', color: 'Billings', sku: 'LI-DT01', description: 'Glue-down LVP, 7.25"x48", 2mm thick, 6mil wear layer, oak, EIR texture' },
  { name: 'Lions Floor District Chesterbrook', category: 'flooring', tone: 'warm', price_tier: 'low', vendor: 'Lions Floor', series: 'District', color: 'Chesterbrook', sku: 'LI-DT02', description: 'Glue-down LVP, 7.25"x48", 2mm thick, 6mil wear layer, EIR texture' },
  { name: 'Lions Floor District Los Alamos', category: 'flooring', tone: 'warm', price_tier: 'low', vendor: 'Lions Floor', series: 'District', color: 'Los Alamos', sku: 'LI-DT03', description: 'Glue-down LVP, 7.25"x48", 2mm thick, 6mil wear layer, EIR texture' },
  { name: 'Lions Floor District Brentwood', category: 'flooring', tone: 'warm', price_tier: 'low', vendor: 'Lions Floor', series: 'District', color: 'Brentwood', sku: 'LI-DT04', description: 'Glue-down LVP, 7.25"x48", 2mm thick, 6mil wear layer, EIR texture' },
  { name: 'Lions Floor District Brighton', category: 'flooring', tone: 'warm', price_tier: 'low', vendor: 'Lions Floor', series: 'District', color: 'Brighton', sku: 'LI-DT05', description: 'Glue-down LVP, 7.25"x48", 2mm thick, 6mil wear layer, hickory, EIR texture' },
  { name: 'Lions Floor District Ardmore', category: 'flooring', tone: 'warm', price_tier: 'low', vendor: 'Lions Floor', series: 'District', color: 'Ardmore', sku: 'LI-DT06', description: 'Glue-down LVP, 7.25"x48", 2mm thick, 6mil wear layer, EIR texture' },
  { name: 'Lions Floor District Carmel', category: 'flooring', tone: 'warm', price_tier: 'low', vendor: 'Lions Floor', series: 'District', color: 'Carmel', sku: 'LI-DT07', description: 'Glue-down LVP, 7.25"x48", 2mm thick, 6mil wear layer, EIR texture' },
  { name: 'Lions Floor District Clayton', category: 'flooring', tone: 'neutral', price_tier: 'low', vendor: 'Lions Floor', series: 'District', color: 'Clayton', sku: 'LI-DT08', description: 'Glue-down LVP, 7.25"x48", 2mm thick, 6mil wear layer, EIR texture' },
  { name: 'Lions Floor District Bellevue', category: 'flooring', tone: 'neutral', price_tier: 'low', vendor: 'Lions Floor', series: 'District', color: 'Bellevue', sku: 'LI-DT09', description: 'Glue-down LVP, 7.25"x48", 2mm thick, 6mil wear layer, EIR texture' },
  { name: 'Lions Floor District Irvine', category: 'flooring', tone: 'cool', price_tier: 'low', vendor: 'Lions Floor', series: 'District', color: 'Irvine', sku: 'LI-DT10', description: 'Glue-down LVP, 7.25"x48", 2mm thick, 6mil wear layer, EIR texture' },
  { name: 'Lions Floor District Arlington', category: 'flooring', tone: 'warm', price_tier: 'low', vendor: 'Lions Floor', series: 'District', color: 'Arlington', sku: 'LI-DT11', description: 'Glue-down LVP, 7.25"x48", 2mm thick, 6mil wear layer, EIR texture' },
  { name: 'Lions Floor District Westfield', category: 'flooring', tone: 'neutral', price_tier: 'low', vendor: 'Lions Floor', series: 'District', color: 'Westfield', sku: 'LI-DT12', description: 'Glue-down LVP, 7.25"x48", 2mm thick, 6mil wear layer, EIR texture' },

  // ==========================================
  // LIONS FLOOR - DISTRICT PRO (12 mil LVP)
  // ==========================================
  { name: 'Lions Floor District Pro Marquee', category: 'flooring', tone: 'warm', price_tier: 'low', vendor: 'Lions Floor', series: 'District Pro', color: 'Marquee', sku: 'LI-DP01', description: 'Glue-down LVP, 7.25"x48", 2mm thick, 12mil wear layer, oak' },
  { name: 'Lions Floor District Pro Metro', category: 'flooring', tone: 'warm', price_tier: 'low', vendor: 'Lions Floor', series: 'District Pro', color: 'Metro', sku: 'LI-DP02', description: 'Glue-down LVP, 7.25"x48", 2mm thick, 12mil wear layer, oak' },
  { name: 'Lions Floor District Pro West Chelsea', category: 'flooring', tone: 'warm', price_tier: 'low', vendor: 'Lions Floor', series: 'District Pro', color: 'West Chelsea', sku: 'LI-DP03', description: 'Glue-down LVP, 7.25"x48", 2mm thick, 12mil wear layer' },
  { name: 'Lions Floor District Pro Midtown East', category: 'flooring', tone: 'neutral', price_tier: 'low', vendor: 'Lions Floor', series: 'District Pro', color: 'Midtown East', sku: 'LI-DP04', description: 'Glue-down LVP, 7.25"x48", 2mm thick, 12mil wear layer' },
  { name: 'Lions Floor District Pro Sun Valley', category: 'flooring', tone: 'warm', price_tier: 'low', vendor: 'Lions Floor', series: 'District Pro', color: 'Sun Valley', sku: 'LI-DP05', description: 'Glue-down LVP, 7.25"x48", 2mm thick, 12mil wear layer' },
  { name: 'Lions Floor District Pro Westgate', category: 'flooring', tone: 'warm', price_tier: 'low', vendor: 'Lions Floor', series: 'District Pro', color: 'Westgate', sku: 'LI-DP06', description: 'Glue-down LVP, 7.25"x48", 2mm thick, 12mil wear layer, hickory, dark' },
  { name: 'Lions Floor District Pro East Aspen', category: 'flooring', tone: 'warm', price_tier: 'low', vendor: 'Lions Floor', series: 'District Pro', color: 'East Aspen', sku: 'LI-DP07', description: 'Glue-down LVP, 7.25"x48", 2mm thick, 12mil wear layer' },
  { name: 'Lions Floor District Pro Capitol Hill', category: 'flooring', tone: 'neutral', price_tier: 'low', vendor: 'Lions Floor', series: 'District Pro', color: 'Capitol Hill', sku: 'LI-DP08', description: 'Glue-down LVP, 7.25"x48", 2mm thick, 12mil wear layer' },
  { name: 'Lions Floor District Pro Plano', category: 'flooring', tone: 'warm', price_tier: 'low', vendor: 'Lions Floor', series: 'District Pro', color: 'Plano', sku: 'LI-DP09', description: 'Glue-down LVP, 7.25"x48", 2mm thick, 12mil wear layer' },
  { name: 'Lions Floor District Pro Chandler', category: 'flooring', tone: 'warm', price_tier: 'low', vendor: 'Lions Floor', series: 'District Pro', color: 'Chandler', sku: 'LI-DP10', description: 'Glue-down LVP, 7.25"x48", 2mm thick, 12mil wear layer' },
  { name: 'Lions Floor District Pro Murrieta', category: 'flooring', tone: 'neutral', price_tier: 'low', vendor: 'Lions Floor', series: 'District Pro', color: 'Murrieta', sku: 'LI-DP11', description: 'Glue-down LVP, 7.25"x48", 2mm thick, 12mil wear layer' },
  { name: 'Lions Floor District Pro Roseville', category: 'flooring', tone: 'warm', price_tier: 'low', vendor: 'Lions Floor', series: 'District Pro', color: 'Roseville', sku: 'LI-DP12', description: 'Glue-down LVP, 7.25"x48", 2mm thick, 12mil wear layer' },

  // ==========================================
  // LIONS FLOOR - DISTRICT MAX (20 mil LVP)
  // ==========================================
  { name: 'Lions Floor District Max Atherton', category: 'flooring', tone: 'warm', price_tier: 'low', vendor: 'Lions Floor', series: 'District Max', color: 'Atherton', sku: 'LI-DM01', description: 'Glue-down LVP, 7.25"x48", 2.5mm thick, 20mil wear layer, oak, EIR texture' },
  { name: 'Lions Floor District Max Scarsdale', category: 'flooring', tone: 'warm', price_tier: 'low', vendor: 'Lions Floor', series: 'District Max', color: 'Scarsdale', sku: 'LI-DM02', description: 'Glue-down LVP, 7.25"x48", 2.5mm thick, 20mil wear layer, EIR texture' },
  { name: 'Lions Floor District Max Hillsborough', category: 'flooring', tone: 'warm', price_tier: 'low', vendor: 'Lions Floor', series: 'District Max', color: 'Hillsborough', sku: 'LI-DM03', description: 'Glue-down LVP, 7.25"x48", 2.5mm thick, 20mil wear layer, EIR texture' },
  { name: 'Lions Floor District Max Weston', category: 'flooring', tone: 'neutral', price_tier: 'low', vendor: 'Lions Floor', series: 'District Max', color: 'Weston', sku: 'LI-DM04', description: 'Glue-down LVP, 7.25"x48", 2.5mm thick, 20mil wear layer, EIR texture' },
  { name: 'Lions Floor District Max Overland Park', category: 'flooring', tone: 'warm', price_tier: 'low', vendor: 'Lions Floor', series: 'District Max', color: 'Overland Park', sku: 'LI-DM05', description: 'Glue-down LVP, 7.25"x48", 2.5mm thick, 20mil wear layer, EIR texture' },
  { name: 'Lions Floor District Max Greenwich', category: 'flooring', tone: 'cool', price_tier: 'low', vendor: 'Lions Floor', series: 'District Max', color: 'Greenwich', sku: 'LI-DM06', description: 'Glue-down LVP, 7.25"x48", 2.5mm thick, 20mil wear layer, EIR texture' },
  { name: 'Lions Floor District Max Naperville', category: 'flooring', tone: 'warm', price_tier: 'low', vendor: 'Lions Floor', series: 'District Max', color: 'Naperville', sku: 'LI-DM07', description: 'Glue-down LVP, 7.25"x48", 2.5mm thick, 20mil wear layer, EIR texture' },
  { name: 'Lions Floor District Max Winnetka', category: 'flooring', tone: 'neutral', price_tier: 'low', vendor: 'Lions Floor', series: 'District Max', color: 'Winnetka', sku: 'LI-DM08', description: 'Glue-down LVP, 7.25"x48", 2.5mm thick, 20mil wear layer, EIR texture' },
  { name: 'Lions Floor District Max Westport', category: 'flooring', tone: 'warm', price_tier: 'low', vendor: 'Lions Floor', series: 'District Max', color: 'Westport', sku: 'LI-DM09', description: 'Glue-down LVP, 7.25"x48", 2.5mm thick, 20mil wear layer, EIR texture' },
  { name: 'Lions Floor District Max Brookline', category: 'flooring', tone: 'cool', price_tier: 'low', vendor: 'Lions Floor', series: 'District Max', color: 'Brookline', sku: 'LI-DM10', description: 'Glue-down LVP, 7.25"x48", 2.5mm thick, 20mil wear layer, EIR texture' },
  { name: 'Lions Floor District Max Belvedere', category: 'flooring', tone: 'warm', price_tier: 'low', vendor: 'Lions Floor', series: 'District Max', color: 'Belvedere', sku: 'LI-DM11', description: 'Glue-down LVP, 7.25"x48", 2.5mm thick, 20mil wear layer, EIR texture' },
  { name: 'Lions Floor District Max Truckee', category: 'flooring', tone: 'warm', price_tier: 'low', vendor: 'Lions Floor', series: 'District Max', color: 'Truckee', sku: 'LI-DM12', description: 'Glue-down LVP, 7.25"x48", 2.5mm thick, 20mil wear layer, EIR texture' },

  // ==========================================
  // MASTERBRAND - ARISTOKRAFT (Budget/Builder)
  // ==========================================
  { name: 'Aristokraft Brellin Slab White', category: 'cabinetry', tone: 'neutral', price_tier: 'low', vendor: 'Aristokraft', series: 'Brellin', color: 'White', sku: 'ARK-BRELLIN-WH', description: 'PureStyle laminate slab door, full overlay, modern/transitional. Masterbrand budget tier.' },
  { name: 'Aristokraft Brellin Slab Stone Gray', category: 'cabinetry', tone: 'cool', price_tier: 'low', vendor: 'Aristokraft', series: 'Brellin', color: 'Stone Gray', sku: 'ARK-BRELLIN-SG', description: 'PureStyle laminate slab door, full overlay, modern/transitional. Masterbrand budget tier.' },
  { name: 'Aristokraft Brellin Slab Navy Blue', category: 'cabinetry', tone: 'cool', price_tier: 'low', vendor: 'Aristokraft', series: 'Brellin', color: 'Navy Blue', sku: 'ARK-BRELLIN-NV', description: 'PureStyle laminate slab door, full overlay, modern/transitional. Masterbrand budget tier.' },
  { name: 'Aristokraft Benton Shaker Dove White', category: 'cabinetry', tone: 'neutral', price_tier: 'low', vendor: 'Aristokraft', series: 'Benton', color: 'Dove White', sku: 'ARK-BENTON-DW', description: '5-piece birch Shaker door, painted. Masterbrand budget tier.' },
  { name: 'Aristokraft Benton Shaker Flagstone', category: 'cabinetry', tone: 'warm', price_tier: 'low', vendor: 'Aristokraft', series: 'Benton', color: 'Flagstone', sku: 'ARK-BENTON-FS', description: '5-piece birch Shaker door, stained. Masterbrand budget tier.' },
  { name: 'Aristokraft Sinclair Raised Panel Sarsaparilla', category: 'cabinetry', tone: 'warm', price_tier: 'low', vendor: 'Aristokraft', series: 'Sinclair', color: 'Sarsaparilla', sku: 'ARK-SINCLAIR-SP', description: 'Traditional raised panel birch door, partial overlay. Masterbrand budget tier.' },
  { name: 'Aristokraft Sinclair Raised Panel Burlap', category: 'cabinetry', tone: 'warm', price_tier: 'low', vendor: 'Aristokraft', series: 'Sinclair', color: 'Burlap', sku: 'ARK-SINCLAIR-BL', description: 'Traditional raised panel birch door, partial overlay. Masterbrand budget tier.' },

  // ==========================================
  // MASTERBRAND - DIAMOND (Mid-Range)
  // ==========================================
  { name: 'Diamond Distinction Shaker White', category: 'cabinetry', tone: 'neutral', price_tier: 'mid', vendor: 'Diamond', series: 'Distinction', color: 'White', sku: 'DIA-DIST-SH-WH', description: 'Maple Shaker door, painted white. 100+ finish options. Masterbrand mid-range.' },
  { name: 'Diamond Distinction Shaker Mineral', category: 'cabinetry', tone: 'cool', price_tier: 'mid', vendor: 'Diamond', series: 'Distinction', color: 'Mineral', sku: 'DIA-DIST-SH-MN', description: 'Maple Shaker door, painted warm gray. Masterbrand mid-range.' },
  { name: 'Diamond Distinction Slab Naval', category: 'cabinetry', tone: 'cool', price_tier: 'mid', vendor: 'Diamond', series: 'Distinction', color: 'Naval', sku: 'DIA-DIST-SL-NV', description: 'Maple slab door, painted navy. Masterbrand mid-range.' },
  { name: 'Diamond Distinction Raised Panel Natural Cherry', category: 'cabinetry', tone: 'warm', price_tier: 'mid', vendor: 'Diamond', series: 'Distinction', color: 'Natural Cherry', sku: 'DIA-DIST-RP-NC', description: 'Cherry raised panel door, natural stain. Masterbrand mid-range.' },
  { name: 'Diamond Vibe Shaker White', category: 'cabinetry', tone: 'neutral', price_tier: 'mid', vendor: 'Diamond', series: 'Vibe', color: 'White', sku: 'DIA-VIBE-SH-WH', description: 'Entry-level Diamond, Shaker door, painted white. Masterbrand mid-range.' },
  { name: 'Diamond Edge Shaker Dove', category: 'cabinetry', tone: 'neutral', price_tier: 'mid', vendor: 'Diamond', series: 'Edge', color: 'Dove', sku: 'DIA-EDGE-SH-DV', description: 'Designer-inspired Shaker door, painted dove. Masterbrand mid-range.' },

  // ==========================================
  // MASTERBRAND - HOMECREST (Mid-Range)
  // ==========================================
  { name: 'Homecrest Arbor Shaker White', category: 'cabinetry', tone: 'neutral', price_tier: 'mid', vendor: 'Homecrest', series: 'Arbor', color: 'White', sku: 'HC-ARBOR-WH', description: 'Popular transitional Shaker door, painted white. 300+ combinations. Masterbrand mid-range.' },
  { name: 'Homecrest Arbor Shaker Fog', category: 'cabinetry', tone: 'cool', price_tier: 'mid', vendor: 'Homecrest', series: 'Arbor', color: 'Fog', sku: 'HC-ARBOR-FG', description: 'Transitional Shaker door, painted gray. Masterbrand mid-range.' },
  { name: 'Homecrest Dover Shaker Natural Oak', category: 'cabinetry', tone: 'warm', price_tier: 'mid', vendor: 'Homecrest', series: 'Dover', color: 'Natural Oak', sku: 'HC-DOVER-NO', description: 'Oak Shaker door, natural stain. Masterbrand mid-range.' },
  { name: 'Homecrest Dover Shaker Hickory Saddle', category: 'cabinetry', tone: 'warm', price_tier: 'mid', vendor: 'Homecrest', series: 'Dover', color: 'Hickory Saddle', sku: 'HC-DOVER-HS', description: 'Hickory Shaker door, warm saddle stain. Masterbrand mid-range.' },
  { name: 'Homecrest Juno Contemporary Laminate', category: 'cabinetry', tone: 'neutral', price_tier: 'mid', vendor: 'Homecrest', series: 'Juno', color: 'Textured Laminate', sku: 'HC-JUNO-TL', description: 'Contemporary European design, vertical wood grain textured laminate. Masterbrand mid-range.' },

  // ==========================================
  // MASTERBRAND - KEMPER (Mid-Range Semi-Custom)
  // ==========================================
  { name: 'Kemper Larsen Shaker Brightest White', category: 'cabinetry', tone: 'neutral', price_tier: 'mid', vendor: 'Kemper', series: 'Larsen', color: 'Brightest White', sku: 'KMP-LARSEN-BW', description: 'Wide-rail Shaker, full overlay, maple. Emerge series. Masterbrand semi-custom.' },
  { name: 'Kemper Larsen Shaker Sterling White', category: 'cabinetry', tone: 'neutral', price_tier: 'mid', vendor: 'Kemper', series: 'Larsen', color: 'Sterling White', sku: 'KMP-LARSEN-SW', description: 'Wide-rail Shaker, full overlay, maple. Emerge series. Masterbrand semi-custom.' },
  { name: 'Kemper Larsen Shaker Naval', category: 'cabinetry', tone: 'cool', price_tier: 'mid', vendor: 'Kemper', series: 'Larsen', color: 'Naval', sku: 'KMP-LARSEN-NV', description: 'Wide-rail Shaker, full overlay, painted navy. Emerge series. Masterbrand semi-custom.' },
  { name: 'Kemper Larsen Shaker Coastline', category: 'cabinetry', tone: 'cool', price_tier: 'mid', vendor: 'Kemper', series: 'Larsen', color: 'Coastline', sku: 'KMP-LARSEN-CL', description: 'Wide-rail Shaker, full overlay, stained. Emerge series. Masterbrand semi-custom.' },
  { name: 'Kemper Larsen Shaker Natural Walnut', category: 'cabinetry', tone: 'warm', price_tier: 'mid', vendor: 'Kemper', series: 'Larsen', color: 'Natural Walnut', sku: 'KMP-LARSEN-NW', description: 'Wide-rail Shaker, full overlay, walnut. Emerge series. Masterbrand semi-custom.' },

  // ==========================================
  // MASTERBRAND - SCHROCK (Mid-Premium)
  // ==========================================
  { name: 'Schrock Entra Shaker White', category: 'cabinetry', tone: 'neutral', price_tier: 'mid', vendor: 'Schrock', series: 'Entra', color: 'White', sku: 'SCH-ENTRA-WH', description: 'Clean contemporary Shaker, PureStyle available. Masterbrand mid-premium.' },
  { name: 'Schrock Trademark Raised Panel Cherry', category: 'cabinetry', tone: 'warm', price_tier: 'high', vendor: 'Schrock', series: 'Trademark', color: 'Natural Cherry', sku: 'SCH-TM-RP-CH', description: 'Sophisticated raised panel, cherry, professional finish. Masterbrand mid-premium.' },
  { name: 'Schrock Boutique Inset Maple White', category: 'cabinetry', tone: 'neutral', price_tier: 'high', vendor: 'Schrock', series: 'Boutique', color: 'White', sku: 'SCH-BTQ-IN-WH', description: 'Fashion-forward inset/beaded inset door, maple, painted white. Masterbrand premium.' },

  // ==========================================
  // MASTERBRAND - DECORA (Premium Semi-Custom)
  // ==========================================
  { name: 'Decora Shaker Maple Dove White', category: 'cabinetry', tone: 'neutral', price_tier: 'high', vendor: 'Decora', series: 'Semi-Custom', color: 'Dove White', sku: 'DEC-SH-MP-DW', description: '73+ door styles, 200 embellishments, maple Shaker painted. Masterbrand premium semi-custom.' },
  { name: 'Decora Shaker Maple Mineral', category: 'cabinetry', tone: 'cool', price_tier: 'high', vendor: 'Decora', series: 'Semi-Custom', color: 'Mineral', sku: 'DEC-SH-MP-MN', description: 'Premium Shaker, maple, painted warm gray. Satin sheen available. Masterbrand premium.' },
  { name: 'Decora Shaker Cherry Natural', category: 'cabinetry', tone: 'warm', price_tier: 'high', vendor: 'Decora', series: 'Semi-Custom', color: 'Natural Cherry', sku: 'DEC-SH-CH-NT', description: 'Premium cherry Shaker, natural stain. 2000+ SW custom paint colors. Masterbrand premium.' },
  { name: 'Decora Raised Panel Oak Summit Ridge', category: 'cabinetry', tone: 'warm', price_tier: 'high', vendor: 'Decora', series: 'Summit', color: 'Ridge', sku: 'DEC-RP-OK-RG', description: 'New Summit stain collection, oak raised panel. Masterbrand premium semi-custom.' },
  { name: 'Decora Slab Walnut Natural', category: 'cabinetry', tone: 'warm', price_tier: 'high', vendor: 'Decora', series: 'Semi-Custom', color: 'Natural Walnut', sku: 'DEC-SL-WL-NT', description: 'Premium walnut slab door, natural finish. Masterbrand premium.' },

  // ==========================================
  // MASTERBRAND - OMEGA/DYNASTY (Premium/Luxury)
  // ==========================================
  { name: 'Dynasty by Omega Shaker Maple White', category: 'cabinetry', tone: 'neutral', price_tier: 'high', vendor: 'Omega', series: 'Dynasty', color: 'White', sku: 'OMG-DYN-SH-WH', description: 'Semi-custom, plywood box, dovetail drawers, soft-close. Framed and frameless. Masterbrand premium.' },
  { name: 'Dynasty by Omega Shaker Maple Naval', category: 'cabinetry', tone: 'cool', price_tier: 'high', vendor: 'Omega', series: 'Dynasty', color: 'Naval', sku: 'OMG-DYN-SH-NV', description: 'Semi-custom, painted navy, plywood box, dovetail drawers. Masterbrand premium.' },
  { name: 'Dynasty by Omega Beaded Inset White', category: 'cabinetry', tone: 'neutral', price_tier: 'high', vendor: 'Omega', series: 'Dynasty Beaded Inset', color: 'White', sku: 'OMG-DYN-BI-WH', description: 'Beaded inset door, painted white. Premium traditional. Masterbrand luxury.' },
  { name: 'Omega Pinnacle Custom Walnut', category: 'cabinetry', tone: 'warm', price_tier: 'high', vendor: 'Omega', series: 'Pinnacle', color: 'Natural Walnut', sku: 'OMG-PIN-WL-NT', description: 'Full custom, highest tier. Walnut, natural finish. Masterbrand luxury.' },

  // ==========================================
  // MASTERBRAND - STARMARK (Mid-Premium)
  // ==========================================
  { name: 'StarMark Francis Shaker Maple White', category: 'cabinetry', tone: 'neutral', price_tier: 'high', vendor: 'StarMark', series: 'Francis', color: 'White', sku: 'SM-FRANCIS-WH', description: 'New 2025 Shaker, 1/16" ordering precision. Masterbrand mid-premium.' },
  { name: 'StarMark Colville Slab Lush Forest', category: 'cabinetry', tone: 'cool', price_tier: 'high', vendor: 'StarMark', series: 'Colville', color: 'Lush Forest', sku: 'SM-COLVILLE-LF', description: 'Modern slab door, 2026 Finish of the Year. Masterbrand mid-premium.' },

  // ==========================================
  // MASTERBRAND - ULTRACRAFT (Frameless)
  // ==========================================
  { name: 'UltraCraft Frameless Slab White', category: 'cabinetry', tone: 'neutral', price_tier: 'mid', vendor: 'UltraCraft', series: 'Euro Frameless', color: 'White', sku: 'UC-SLAB-WH', description: 'European frameless construction, 15% more space, 100-year warranty. Masterbrand mid-range.' },
  { name: 'UltraCraft Frameless Slab Walnut', category: 'cabinetry', tone: 'warm', price_tier: 'mid', vendor: 'UltraCraft', series: 'Euro Frameless', color: 'Natural Walnut', sku: 'UC-SLAB-WL', description: 'European frameless, walnut veneer slab, 100-year warranty. Masterbrand mid-range.' },

  // ==========================================
  // EMSER TILE - CARU
  // ==========================================
  { name: 'Emser Caru Rengo 13x13', category: 'backsplash', tone: 'cool', price_tier: 'low', vendor: 'Emser', series: 'Caru', color: 'Rengo', sku: 'F84CARERE1313M', description: 'Glazed ceramic, matte, 13"x13", pressed edge. Floor/wall/backsplash.' },
  { name: 'Emser Caru Colina 13x13', category: 'backsplash', tone: 'warm', price_tier: 'low', vendor: 'Emser', series: 'Caru', color: 'Colina', sku: 'F84CARECO1313M', description: 'Glazed ceramic, matte, 13"x13", pressed edge. Floor/wall/backsplash.' },
  { name: 'Emser Caru Lampa 13x13', category: 'backsplash', tone: 'warm', price_tier: 'low', vendor: 'Emser', series: 'Caru', color: 'Lampa', sku: 'F84CARELA1313M', description: 'Glazed ceramic, matte, 13"x13", pressed edge. Floor/wall/backsplash.' },

  // ==========================================
  // EMSER TILE - BROOK II
  // ==========================================
  { name: 'Emser Brook II Cream 12x24', category: 'backsplash', tone: 'warm', price_tier: 'low', vendor: 'Emser', series: 'Brook II', color: 'Cream', sku: 'F84BROOCR1224', description: 'Glazed ceramic, matte, 12"x24". Floor/wall/backsplash.' },
  { name: 'Emser Brook II White 12x24', category: 'backsplash', tone: 'neutral', price_tier: 'low', vendor: 'Emser', series: 'Brook II', color: 'White', sku: 'F84BROOWH1224', description: 'Glazed ceramic, matte, 12"x24". Floor/wall/backsplash.' },
  { name: 'Emser Brook II Silver 12x24', category: 'backsplash', tone: 'cool', price_tier: 'low', vendor: 'Emser', series: 'Brook II', color: 'Silver', sku: 'F84BROOSI1224', description: 'Glazed ceramic, matte, 12"x24". Floor/wall/backsplash.' },
  { name: 'Emser Brook II Graphite 12x24', category: 'backsplash', tone: 'cool', price_tier: 'low', vendor: 'Emser', series: 'Brook II', color: 'Graphite', sku: 'F84BROOGT1224', description: 'Glazed ceramic, matte, 12"x24". Floor/wall/backsplash.' },

  // ==========================================
  // EMSER TILE - STERLINA II
  // ==========================================
  { name: 'Emser Sterlina II White 12x24', category: 'backsplash', tone: 'neutral', price_tier: 'mid', vendor: 'Emser', series: 'Sterlina II', color: 'White', sku: 'F20STERWH1224', description: 'Glazed porcelain, rectified, matte and polished available. 12"x24". Marble+concrete aesthetic.' },
  { name: 'Emser Sterlina II Ivory 12x24', category: 'backsplash', tone: 'warm', price_tier: 'mid', vendor: 'Emser', series: 'Sterlina II', color: 'Ivory', sku: 'F20STERIV1224', description: 'Glazed porcelain, rectified, matte and polished. 12"x24". Floor/wall/backsplash/shower.' },
  { name: 'Emser Sterlina II Dove 12x24', category: 'backsplash', tone: 'warm', price_tier: 'mid', vendor: 'Emser', series: 'Sterlina II', color: 'Dove', sku: 'F20STERDO1224', description: 'Glazed porcelain, rectified, matte and polished. 12"x24". Light warm gray.' },
  { name: 'Emser Sterlina II Silver 12x24', category: 'backsplash', tone: 'cool', price_tier: 'mid', vendor: 'Emser', series: 'Sterlina II', color: 'Silver', sku: 'F20STERSI1224', description: 'Glazed porcelain, rectified, matte and polished. 12"x24". Cool light gray.' },
  { name: 'Emser Sterlina II Gray 12x24', category: 'backsplash', tone: 'neutral', price_tier: 'mid', vendor: 'Emser', series: 'Sterlina II', color: 'Gray', sku: 'F20STERGR1224', description: 'Glazed porcelain, rectified, matte and polished. 12"x24". Medium neutral gray.' },
  { name: 'Emser Sterlina II Henna 12x24', category: 'backsplash', tone: 'warm', price_tier: 'mid', vendor: 'Emser', series: 'Sterlina II', color: 'Henna', sku: 'F20STERHE1224', description: 'Glazed porcelain, rectified, matte and polished. 12"x24". Warm terracotta tone.' },
  { name: 'Emser Sterlina II Asphalt 12x24', category: 'backsplash', tone: 'cool', price_tier: 'mid', vendor: 'Emser', series: 'Sterlina II', color: 'Asphalt', sku: 'F20STERAS1224', description: 'Glazed porcelain, rectified, matte and polished. 12"x24". Very dark charcoal.' },

  // ==========================================
  // DALTILE - CORE FUNDAMENTALS ADVANTAGE
  // ==========================================
  { name: 'DalTile Advantage Aria White 12x24', category: 'backsplash', tone: 'neutral', price_tier: 'low', vendor: 'Daltile', series: 'Core Fundamentals Advantage', color: 'Aria White', sku: 'EP20', description: 'Glazed ceramic, matte, Made in USA, ZeroTox. Floor/wall/backsplash/shower.' },
  { name: 'DalTile Advantage Portrait White 12x24', category: 'backsplash', tone: 'neutral', price_tier: 'low', vendor: 'Daltile', series: 'Core Fundamentals Advantage', color: 'Portrait White', sku: 'AQ01', description: 'Glazed ceramic, matte, Made in USA. High variation. Floor/wall/backsplash.' },
  { name: 'DalTile Advantage White Canvas 12x24', category: 'backsplash', tone: 'warm', price_tier: 'low', vendor: 'Daltile', series: 'Core Fundamentals Advantage', color: 'White Canvas', sku: 'SV16', description: 'Glazed ceramic, matte, Made in USA. Warm soft white. Floor/wall/backsplash.' },
  { name: 'DalTile Advantage Washed White 12x24', category: 'backsplash', tone: 'neutral', price_tier: 'low', vendor: 'Daltile', series: 'Core Fundamentals Advantage', color: 'Washed White', sku: 'LS40', description: 'Glazed ceramic, matte, Made in USA. Slightly textured white.' },
  { name: 'DalTile Advantage Renoir Grey 12x24', category: 'backsplash', tone: 'neutral', price_tier: 'low', vendor: 'Daltile', series: 'Core Fundamentals Advantage', color: 'Renoir Grey', sku: 'AQ03', description: 'Glazed ceramic, matte, Made in USA. Medium gray, high variation.' },
  { name: 'DalTile Advantage Trumpet Grey 12x24', category: 'backsplash', tone: 'cool', price_tier: 'low', vendor: 'Daltile', series: 'Core Fundamentals Advantage', color: 'Trumpet Grey', sku: 'EP22', description: 'Glazed ceramic, matte, Made in USA. Cool-toned gray, high variation.' },
  { name: 'DalTile Advantage Cement Grey 12x24', category: 'backsplash', tone: 'cool', price_tier: 'low', vendor: 'Daltile', series: 'Core Fundamentals Advantage', color: 'Cement Grey', sku: 'SV18', description: 'Glazed ceramic, matte, Made in USA. Cool medium gray.' },
  { name: 'DalTile Advantage Aged Grey 12x24', category: 'backsplash', tone: 'warm', price_tier: 'low', vendor: 'Daltile', series: 'Core Fundamentals Advantage', color: 'Aged Grey', sku: 'LS42', description: 'Glazed ceramic, matte, Made in USA. Medium warm gray, high variation.' },
  { name: 'DalTile Advantage Mural Taupe 12x24', category: 'backsplash', tone: 'warm', price_tier: 'low', vendor: 'Daltile', series: 'Core Fundamentals Advantage', color: 'Mural Taupe', sku: 'AQ02', description: 'Glazed ceramic, matte, Made in USA. Warm taupe/greige.' },
  { name: 'DalTile Advantage Percussion Taupe 12x24', category: 'backsplash', tone: 'warm', price_tier: 'low', vendor: 'Daltile', series: 'Core Fundamentals Advantage', color: 'Percussion Taupe', sku: 'EP21', description: 'Glazed ceramic, matte, Made in USA. Warm taupe.' },
  { name: 'DalTile Advantage Golden Sand 12x24', category: 'backsplash', tone: 'warm', price_tier: 'low', vendor: 'Daltile', series: 'Core Fundamentals Advantage', color: 'Golden Sand', sku: 'SV17', description: 'Glazed ceramic, matte, Made in USA. Warm sandy tan.' },
  { name: 'DalTile Advantage Distressed Beige 12x24', category: 'backsplash', tone: 'warm', price_tier: 'low', vendor: 'Daltile', series: 'Core Fundamentals Advantage', color: 'Distressed Beige', sku: 'LS41', description: 'Glazed ceramic, matte, Made in USA. Warm beige, high variation.' },

  // ==========================================
  // ARIZONA TILE - FLASH (Backsplash)
  // ==========================================
  { name: 'Arizona Tile Flash White 3x12', category: 'backsplash', tone: 'neutral', price_tier: 'mid', vendor: 'Arizona Tile', series: 'Flash', color: 'White', sku: 'AT-FLH312-WHT', description: 'Zellige-inspired glazed ceramic, 3"x12" subway, wall/backsplash only. 40%+ recycled content. Made in Spain.' },
  { name: 'Arizona Tile Flash Ivory 3x12', category: 'backsplash', tone: 'warm', price_tier: 'mid', vendor: 'Arizona Tile', series: 'Flash', color: 'Ivory', sku: 'AT-FLH312-IVOY', description: 'Zellige-inspired glazed ceramic, 3"x12" subway, wall/backsplash only. Warm off-white.' },
  { name: 'Arizona Tile Flash Blush 3x12', category: 'backsplash', tone: 'warm', price_tier: 'mid', vendor: 'Arizona Tile', series: 'Flash', color: 'Blush', sku: 'AT-FLH312-BLUS', description: 'Zellige-inspired glazed ceramic, 3"x12" subway, wall/backsplash only. Soft pink/rose.' },
  { name: 'Arizona Tile Flash Light Blue 3x12', category: 'backsplash', tone: 'cool', price_tier: 'mid', vendor: 'Arizona Tile', series: 'Flash', color: 'Light Blue', sku: 'AT-FLH312-LIGBLU', description: 'Zellige-inspired glazed ceramic, 3"x12" subway, wall/backsplash only. Pale soft blue.' },
  { name: 'Arizona Tile Flash Cobalt 3x12', category: 'backsplash', tone: 'cool', price_tier: 'mid', vendor: 'Arizona Tile', series: 'Flash', color: 'Cobalt', sku: 'AT-FLH312-COB', description: 'Zellige-inspired glazed ceramic, 3"x12" subway, wall/backsplash only. Deep saturated blue.' },
  { name: 'Arizona Tile Flash Cool Grey 3x12', category: 'backsplash', tone: 'cool', price_tier: 'mid', vendor: 'Arizona Tile', series: 'Flash', color: 'Cool Grey', sku: 'AT-FLH312-COGRY', description: 'Zellige-inspired glazed ceramic, 3"x12" subway, wall/backsplash only. Neutral mid-grey.' },
  { name: 'Arizona Tile Flash Lead 3x12', category: 'backsplash', tone: 'cool', price_tier: 'mid', vendor: 'Arizona Tile', series: 'Flash', color: 'Lead', sku: 'AT-FLH312-LEAD', description: 'Zellige-inspired glazed ceramic, 3"x12" subway, wall/backsplash only. Dark charcoal.' },
  { name: 'Arizona Tile Flash Graphite 3x12', category: 'backsplash', tone: 'cool', price_tier: 'mid', vendor: 'Arizona Tile', series: 'Flash', color: 'Graphite', sku: 'AT-FLH312-GRAPH', description: 'Zellige-inspired glazed ceramic, 3"x12" subway, wall/backsplash only. Near-black.' },
];

async function insertMaterials() {
  console.log(`Inserting ${materials.length} materials into Supabase...`);

  // Insert in batches of 20
  const batchSize = 20;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < materials.length; i += batchSize) {
    const batch = materials.slice(i, i + batchSize);

    const response = await fetch(`${SUPABASE_URL}/rest/v1/materials`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(batch)
    });

    if (response.ok) {
      const data = await response.json();
      inserted += data.length;
      console.log(`  Batch ${Math.floor(i/batchSize) + 1}: ${data.length} inserted (${inserted} total)`);
    } else {
      const err = await response.text();
      console.error(`  Batch ${Math.floor(i/batchSize) + 1} FAILED: ${response.status} - ${err}`);
      errors++;
    }
  }

  console.log(`\nDone: ${inserted} inserted, ${errors} batch errors`);
  console.log(`Total materials in request: ${materials.length}`);
}

insertMaterials().catch(console.error);
