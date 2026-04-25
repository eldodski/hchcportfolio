// HC Finishing — Supabase Client
// CRUD operations for order form intake

let _supabase = null;

function getSupabase() {
  if (_supabase) return _supabase;

  if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
    console.error('Supabase SDK not loaded. Add the CDN script tag before this file.');
    return null;
  }

  _supabase = window.supabase.createClient(
    HCF_CONFIG.supabase.url,
    HCF_CONFIG.supabase.anonKey
  );

  return _supabase;
}

// ============ ORDER FORM CRUD ============

async function saveOrderForm(data) {
  const sb = getSupabase();
  const { data: result, error } = await sb
    .from('order_forms')
    .insert({
      original_filename: data.original_filename,
      file_url: data.file_url || null,
      raw_text: data.raw_text,
      parsed_json: data.parsed_json,
      parse_status: 'parsed',
      parse_confidence: data.parse_confidence || 'low',
      parse_warnings: data.parse_warnings || [],
      project_id: data.project_id || null
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving order form:', error);
    throw error;
  }
  return result;
}

async function updateOrderForm(id, updates) {
  const sb = getSupabase();
  const { data: result, error } = await sb
    .from('order_forms')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating order form:', error);
    throw error;
  }
  return result;
}

async function approveOrderForm(id, reviewedBy) {
  return updateOrderForm(id, {
    reviewed: true,
    reviewed_by: reviewedBy || 'designer',
    reviewed_at: new Date().toISOString()
  });
}

async function getOrderForm(id) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('order_forms')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching order form:', error);
    throw error;
  }
  return data;
}

async function getOrderForms(filters = {}) {
  const sb = getSupabase();
  let query = sb.from('order_forms').select('*').order('created_at', { ascending: false });

  if (filters.project_id) query = query.eq('project_id', filters.project_id);
  if (filters.parse_status) query = query.eq('parse_status', filters.parse_status);
  if (typeof filters.reviewed === 'boolean') query = query.eq('reviewed', filters.reviewed);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching order forms:', error);
    throw error;
  }
  return data || [];
}

async function uploadOrderFormFile(file) {
  const sb = getSupabase();
  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

  const { data, error } = await sb.storage
    .from('order-forms')
    .upload(filename, file, {
      contentType: file.type,
      upsert: false
    });

  if (error) {
    console.error('Error uploading file:', error);
    throw error;
  }

  const { data: urlData } = sb.storage
    .from('order-forms')
    .getPublicUrl(filename);

  return urlData.publicUrl;
}
