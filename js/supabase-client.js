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

// ============ SOCIAL POSTS CRUD ============

async function getSocialPosts(filters = {}) {
  const sb = getSupabase();
  let query = sb.from('social_posts').select('*').order('created_at', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.project_type) query = query.eq('project_type', filters.project_type);
  if (filters.limit) query = query.limit(filters.limit);
  if (filters.offset !== undefined) query = query.range(filters.offset, filters.offset + (filters.limit || 12) - 1);

  const { data, error } = await query;
  if (error) { console.error('getSocialPosts error:', error); return []; }
  return data;
}

async function getPublishedPosts(filters = {}) {
  const sb = getSupabase();
  const limit = filters.limit || 12;
  const offset = filters.offset || 0;

  let query = sb.from('social_posts').select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.project_type) query = query.eq('project_type', filters.project_type);

  const { data, error } = await query;
  if (error) { console.error('getPublishedPosts error:', error); return []; }
  return data;
}

async function getLatestPosts(filters = {}) {
  const sb = getSupabase();
  const limit = filters.limit || 6;

  // Try full query with pinned/content_tag columns first
  let query = sb.from('social_posts').select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);

  // Only add pinned ordering and content_tag filter if columns exist
  try {
    let fullQuery = sb.from('social_posts').select('*')
      .eq('status', 'published')
      .order('pinned', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(limit);

    if (filters.content_tag) fullQuery = fullQuery.eq('content_tag', filters.content_tag);

    const { data, error } = await fullQuery;
    if (!error) return data || [];
    // If pinned/content_tag columns don't exist, fall through to basic query
    console.warn('getLatestPosts: falling back to basic query (missing columns)');
  } catch (e) {
    console.warn('getLatestPosts: falling back to basic query', e);
  }

  // Fallback: no pinned ordering, no content_tag filter
  const { data, error } = await query;
  if (error) { console.error('getLatestPosts error:', error); return []; }
  return data;
}

async function getPublishedPostCount(filters = {}) {
  const sb = getSupabase();
  let query = sb.from('social_posts').select('id', { count: 'exact', head: true })
    .eq('status', 'published');
  if (filters.project_type) query = query.eq('project_type', filters.project_type);
  const { count, error } = await query;
  if (error) { console.error('getPublishedPostCount error:', error); return 0; }
  return count || 0;
}

async function createSocialPost(post) {
  const sb = getSupabase();
  const { data, error } = await sb.from('social_posts').insert([post]).select().single();
  if (error) { console.error('createSocialPost error:', error); throw error; }
  return data;
}

async function updateSocialPost(id, updates) {
  const sb = getSupabase();
  updates.updated_at = new Date().toISOString();
  const { data, error } = await sb.from('social_posts').update(updates).eq('id', id).select().single();
  if (error) { console.error('updateSocialPost error:', error); throw error; }
  return data;
}

async function deleteSocialPost(id) {
  const sb = getSupabase();
  // Get the post first to clean up its image
  const { data: post } = await sb.from('social_posts').select('image_path').eq('id', id).single();
  if (post?.image_path) {
    await sb.storage.from('social-images').remove([post.image_path]);
  }
  const { error } = await sb.from('social_posts').delete().eq('id', id);
  if (error) { console.error('deleteSocialPost error:', error); throw error; }
}

async function uploadSocialImage(file) {
  const ext = file.name.split('.').pop();
  const filename = `${crypto.randomUUID()}.${ext}`;

  // Use server-side upload proxy to bypass storage RLS
  const base64 = await _fileToBase64(file);
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bucket: 'social-images',
      filename,
      contentType: file.type,
      fileBase64: base64,
    }),
  });

  const result = await res.json();
  if (!res.ok) {
    console.error('uploadSocialImage error:', result);
    throw new Error(result.error || 'Image upload failed');
  }

  return { url: result.url, path: result.path };
}

// Convert a File to base64 string (without data URL prefix)
function _fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function deleteSocialImage(path) {
  if (!path) return;
  const sb = getSupabase();
  await sb.storage.from('social-images').remove([path]);
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
