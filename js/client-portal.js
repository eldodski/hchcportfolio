// ============================================================
// HCHC Client Portal helper
// Talks to the client-portal Supabase edge function.
// Every request carries the visitor's Clerk session token, which the
// function checks before it returns anything.
// ============================================================

const HCHCPortal = (function () {
  'use strict';

  // The name Supabase gave the function when it was deployed.
  const FUNCTION_NAME = 'client-portal';
  const ENDPOINT = HCHC_CONFIG.supabase.url + '/functions/v1/' + FUNCTION_NAME;

  async function _token() {
    if (!window.Clerk || !window.Clerk.session) throw new Error('Please sign in.');
    const token = await window.Clerk.session.getToken();
    if (!token) throw new Error('Please sign in.');
    return token;
  }

  async function _post(body, isForm) {
    const headers = { Authorization: 'Bearer ' + (await _token()) };
    if (!isForm) headers['Content-Type'] = 'application/json';
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: headers,
      body: isForm ? body : JSON.stringify(body)
    });
    return res;
  }

  async function _json(res) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
    return data;
  }

  // call('overview', { project_id }) and so on
  async function call(action, data) {
    return _json(await _post(Object.assign({ action: action }, data || {})));
  }

  // Sends a message with optional files (a FileList or array of File)
  async function send(projectId, text, files) {
    const form = new FormData();
    form.append('action', 'send');
    form.append('project_id', projectId);
    form.append('body', text || '');
    Array.from(files || []).forEach(f => form.append('files', f, f.name));
    return _json(await _post(form, true));
  }

  // Downloads a document and returns a temporary link to it in the browser
  async function fileUrl(projectId, fileId) {
    const res = await _post({ action: 'file', project_id: projectId, file_id: fileId });
    if (!res.ok) await _json(res);
    return URL.createObjectURL(await res.blob());
  }

  return { call, send, fileUrl };
})();
