// Supabase Client for HCHC Platform
// Uses the Supabase JS SDK loaded via CDN in HTML pages

let _supabase = null;

function getSupabase() {
  if (_supabase) return _supabase;

  if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
    console.error('Supabase SDK not loaded. Add the CDN script tag before this file.');
    return null;
  }

  _supabase = window.supabase.createClient(
    HCHC_CONFIG.supabase.url,
    HCHC_CONFIG.supabase.anonKey
  );

  return _supabase;
}

// ============ MATERIALS CRUD ============

async function getMaterials(filters = {}) {
  const sb = getSupabase();
  let query = sb.from('materials').select('*').order('created_at', { ascending: false });

  if (filters.category) query = query.eq('category', filters.category);
  if (filters.tone) query = query.eq('tone', filters.tone);
  if (filters.price_tier) query = query.eq('price_tier', filters.price_tier);
  if (filters.search) query = query.ilike('name', `%${filters.search}%`);

  const { data, error } = await query;
  if (error) { console.error('getMaterials error:', error); return []; }
  return data;
}

async function getMaterial(id) {
  const sb = getSupabase();
  const { data, error } = await sb.from('materials').select('*').eq('id', id).single();
  if (error) { console.error('getMaterial error:', error); return null; }
  return data;
}

async function createMaterial(material) {
  const sb = getSupabase();
  const { data, error } = await sb.from('materials').insert([material]).select().single();
  if (error) { console.error('createMaterial error:', error); throw error; }
  return data;
}

async function updateMaterial(id, updates) {
  const sb = getSupabase();
  const { data, error } = await sb.from('materials').update(updates).eq('id', id).select().single();
  if (error) { console.error('updateMaterial error:', error); throw error; }
  return data;
}

async function deleteMaterial(id) {
  const sb = getSupabase();
  const { error } = await sb.from('materials').delete().eq('id', id);
  if (error) { console.error('deleteMaterial error:', error); throw error; }
}

// ============ IMAGE UPLOAD ============

async function uploadMaterialImage(file) {
  const sb = getSupabase();
  const ext = file.name.split('.').pop();
  const filename = `${crypto.randomUUID()}.${ext}`;

  const { error } = await sb.storage.from('material-images').upload(filename, file, {
    cacheControl: '3600',
    upsert: false
  });

  if (error) { console.error('uploadImage error:', error); throw error; }

  const { data: urlData } = sb.storage.from('material-images').getPublicUrl(filename);
  return urlData.publicUrl;
}

async function deleteMaterialImage(url) {
  if (!url) return;
  const sb = getSupabase();
  // Extract filename from full URL (after bucket name)
  const match = url.match(/\/material-images\/(.+)$/);
  if (!match) return;
  await sb.storage.from('material-images').remove([match[1]]);
}

// ============ PROJECTS CRUD ============

async function getProjects(userId) {
  const sb = getSupabase();
  let query = sb.from('projects').select('*').order('created_at', { ascending: false });
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query;
  if (error) { console.error('getProjects error:', error); return []; }
  return data;
}

async function createProject(project) {
  const sb = getSupabase();
  const { data, error } = await sb.from('projects').insert([project]).select().single();
  if (error) { console.error('createProject error:', error); throw error; }
  return data;
}

async function updateProject(id, updates) {
  const sb = getSupabase();
  const { data, error } = await sb.from('projects').update(updates).eq('id', id).select().single();
  if (error) { console.error('updateProject error:', error); throw error; }
  return data;
}

async function uploadProjectFile(file, projectId) {
  const sb = getSupabase();
  const ext = file.name.split('.').pop();
  const filename = `${projectId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await sb.storage.from('uploads').upload(filename, file, {
    cacheControl: '3600',
    upsert: false
  });

  if (error) { console.error('uploadProjectFile error:', error); throw error; }

  const { data: urlData } = sb.storage.from('uploads').getPublicUrl(filename);
  return urlData.publicUrl;
}

// ============ PRESENTATION SAVE/LOAD ============

async function getProject(id) {
  const sb = getSupabase();
  const { data, error } = await sb.from('projects').select('*').eq('id', id).single();
  if (error) { console.error('getProject error:', error); return null; }
  return data;
}

async function uploadPresentation(projectId, htmlContent) {
  const sb = getSupabase();
  const filename = `${projectId}/${Date.now()}-presentation.html`;
  const blob = new Blob([htmlContent], { type: 'text/html' });

  const { error } = await sb.storage.from('presentations').upload(filename, blob, {
    contentType: 'text/html',
    cacheControl: '3600',
    upsert: true
  });

  if (error) { console.error('uploadPresentation error:', error); throw error; }

  const { data: urlData } = sb.storage.from('presentations').getPublicUrl(filename);
  return urlData.publicUrl;
}
