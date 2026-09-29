// Supabase Edge Function: client-portal
// Powers the homeowner dashboard (/dashboard/homeowner/) and the admin
// Clients page (/admin/clients.html).
//
// - Documents come from each client's Google Drive "For Client" folder.
// - Messages are saved, attachments go to the "From Client" folder,
//   and Ena gets an email with reply-to set to the client.
//
// Deploy with "Verify JWT" turned OFF. Every request must carry a Clerk
// session token, which this function checks against Clerk's public keys.
//
// Secrets (Supabase > Edge Functions > Secrets):
//   HCHC_SECRET_KEY               sb_secret key (already set)
//   RESEND_API_KEY                (already set)
//   GOOGLE_SERVICE_ACCOUNT_JSON   the full service account JSON file contents
//   HCHC_CLIENTS_DRIVE_ID         ID of the "HCHC Clients" Shared Drive

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createRemoteJWKSet, jwtVerify } from 'npm:jose@5'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SECRET_KEY = Deno.env.get('HCHC_SECRET_KEY')!
const CLERK_ISSUER = Deno.env.get('CLERK_ISSUER') || 'https://rapid-mackerel-28.clerk.accounts.dev'
const CLIENTS_DRIVE_ID = Deno.env.get('HCHC_CLIENTS_DRIVE_ID') || ''
const ENA_EMAIL = 'ena.dodski@hillcountryhomeconcepts.com'
const SITE_URL = 'https://www.hillcountryhomeconcepts.com'
const ADMIN_IDS = ['user_3CrNXd96VPw20vqdr9pZGwDLu9S']

// Document categories, in the order clients see them.
// Each one is a subfolder inside the client's "For Client" folder.
const CATEGORIES = [
  'Estimates and Quotes',
  'Product Schedules',
  'Design Presentations',
  'Mood Boards',
  'Other Documents',
]

const MAX_FILES = 10
const MAX_TOTAL_BYTES = 20 * 1024 * 1024 // 20 MB per message
const MAX_MESSAGES_PER_HOUR = 20

// ---------------------------------------------------------------
// Origin check (same list as the contact form function)
// ---------------------------------------------------------------

const ALLOWED_HOSTS = [
  'hillcountryhomeconcepts.com',
  'www.hillcountryhomeconcepts.com',
  'hchcportfolio.vercel.app',
  'localhost',
  '127.0.0.1',
]

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false
  try {
    const host = new URL(origin).hostname
    return ALLOWED_HOSTS.includes(host) || /^hchcportfolio-[a-z0-9-]+\.vercel\.app$/.test(host)
  } catch {
    return false
  }
}

function corsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Expose-Headers': 'Content-Disposition',
    'Vary': 'Origin',
  }
}

class HttpError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

// ---------------------------------------------------------------
// Who is calling? (Clerk session token)
// ---------------------------------------------------------------

const clerkKeys = createRemoteJWKSet(new URL(`${CLERK_ISSUER}/.well-known/jwks.json`))

interface Caller {
  clerkId: string
  email: string
  name: string
  role: string
  status: string
  isAdmin: boolean
}

async function getCaller(req: Request, sb: SupabaseClient): Promise<Caller> {
  const auth = req.headers.get('authorization') || ''
  const token = auth.replace(/^Bearer\s+/i, '')
  if (!token) throw new HttpError(401, 'Please sign in.')

  let clerkId: string
  try {
    const { payload } = await jwtVerify(token, clerkKeys, { issuer: CLERK_ISSUER })
    // Clerk puts the page origin in "azp". Refuse tokens made for other sites.
    if (payload.azp && !isAllowedOrigin(String(payload.azp))) throw new Error('wrong azp')
    clerkId = String(payload.sub)
  } catch {
    throw new HttpError(401, 'Your session has expired. Please sign in again.')
  }

  const { data: profile } = await sb
    .from('user_profiles')
    .select('email, first_name, last_name, role, status')
    .eq('clerk_user_id', clerkId)
    .maybeSingle()

  const role = profile?.role || ''
  return {
    clerkId,
    email: (profile?.email || '').toLowerCase(),
    name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
    role,
    status: profile?.status || 'pending',
    isAdmin: role === 'admin' || ADMIN_IDS.includes(clerkId),
  }
}

// ---------------------------------------------------------------
// Google Drive (service account)
// ---------------------------------------------------------------

let googleToken: { value: string; expires: number } | null = null

function b64url(data: ArrayBuffer | string): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function getGoogleToken(): Promise<string> {
  if (googleToken && googleToken.expires > Date.now() + 60_000) return googleToken.value

  const raw = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')
  if (!raw) throw new HttpError(500, 'Google Drive is not connected yet.')
  const sa = JSON.parse(raw)

  const pem = String(sa.private_key).replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0))
  const key = await crypto.subtle.importKey(
    'pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'],
  )

  const now = Math.floor(Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${header}.${claims}`))
  const assertion = `${header}.${claims}.${b64url(signature)}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  })
  if (!res.ok) {
    console.error('Google token error:', res.status, await res.text())
    throw new HttpError(502, 'Could not connect to Google Drive.')
  }
  const data = await res.json()
  googleToken = { value: data.access_token, expires: Date.now() + data.expires_in * 1000 }
  return googleToken.value
}

async function drive(path: string, init: RequestInit = {}, base = 'https://www.googleapis.com/drive/v3'): Promise<Response> {
  const token = await getGoogleToken()
  const url = new URL(base + path)
  url.searchParams.set('supportsAllDrives', 'true')
  const res = await fetch(url, {
    ...init,
    headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    console.error('Drive error:', path, res.status, await res.text())
    throw new HttpError(502, 'Google Drive request failed.')
  }
  return res
}

interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  modifiedTime?: string
  webViewLink?: string
  parents?: string[]
}

const FOLDER = 'application/vnd.google-apps.folder'
const FILE_FIELDS = 'id,name,mimeType,size,modifiedTime,webViewLink,parents'

async function listChildren(folderId: string): Promise<DriveFile[]> {
  const q = `'${folderId}' in parents and trashed = false`
  const params = new URLSearchParams({
    q,
    fields: `files(${FILE_FIELDS})`,
    orderBy: 'folder,modifiedTime desc',
    pageSize: '200',
    includeItemsFromAllDrives: 'true',
    corpora: 'allDrives',
  })
  const res = await drive(`/files?${params}`)
  return (await res.json()).files || []
}

async function createFolder(name: string, parentId: string): Promise<string> {
  const res = await drive('/files?fields=id', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, mimeType: FOLDER, parents: [parentId] }),
  })
  return (await res.json()).id
}

async function getFile(fileId: string): Promise<DriveFile> {
  const res = await drive(`/files/${encodeURIComponent(fileId)}?fields=${FILE_FIELDS}`)
  return await res.json()
}

async function uploadFile(file: File, name: string, parentId: string): Promise<DriveFile> {
  const boundary = 'hchc' + crypto.randomUUID().replace(/-/g, '')
  const meta = JSON.stringify({ name, parents: [parentId] })
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n`,
    `--${boundary}\r\nContent-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`,
    await file.arrayBuffer(),
    `\r\n--${boundary}--`,
  ])
  const res = await drive(
    `/files?uploadType=multipart&fields=${FILE_FIELDS}`,
    { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body },
    'https://www.googleapis.com/upload/drive/v3',
  )
  return await res.json()
}

// Google Docs, Sheets, and Slides have no file to download, so send a PDF.
const EXPORTABLE: Record<string, string> = {
  'application/vnd.google-apps.document': 'application/pdf',
  'application/vnd.google-apps.spreadsheet': 'application/pdf',
  'application/vnd.google-apps.presentation': 'application/pdf',
  'application/vnd.google-apps.drawing': 'application/pdf',
}

// ---------------------------------------------------------------
// Projects and membership
// ---------------------------------------------------------------

interface Project {
  id: string
  name: string
  drive_folder_id: string | null
  for_client_folder_id: string | null
  from_client_folder_id: string | null
}

// Returns the projects this person may see. Also links any invitation
// that matches their verified email, so an invite works even if they
// signed up before Ena added them.
async function projectsFor(sb: SupabaseClient, caller: Caller): Promise<Project[]> {
  if (caller.email) {
    await sb.from('client_members')
      .update({ clerk_user_id: caller.clerkId, joined_at: new Date().toISOString() })
      .eq('email', caller.email)
      .is('clerk_user_id', null)
  }
  const { data: rows } = await sb
    .from('client_members')
    .select('project_id')
    .eq('clerk_user_id', caller.clerkId)
  const ids = (rows || []).map((r) => r.project_id)
  if (!ids.length) return []
  const { data } = await sb
    .from('client_projects')
    .select('id, name, drive_folder_id, for_client_folder_id, from_client_folder_id')
    .in('id', ids)
    .eq('archived', false)
    .order('created_at', { ascending: false })
  return data || []
}

async function projectById(sb: SupabaseClient, id: string): Promise<Project> {
  const { data } = await sb
    .from('client_projects')
    .select('id, name, drive_folder_id, for_client_folder_id, from_client_folder_id')
    .eq('id', id)
    .maybeSingle()
  if (!data) throw new HttpError(404, 'Project not found.')
  return data
}

// Clients may only open projects they belong to. Ena may open any project.
async function projectForCaller(sb: SupabaseClient, caller: Caller, id: string): Promise<Project> {
  if (caller.isAdmin) return projectById(sb, id)
  const projects = await projectsFor(sb, caller)
  const project = projects.find((p) => p.id === id)
  if (!project) throw new HttpError(403, 'You do not have access to this project.')
  return project
}

async function listDocuments(project: Project) {
  if (!project.for_client_folder_id) return []
  const top = await listChildren(project.for_client_folder_id)
  const groups: { category: string; files: unknown[] }[] = []
  const loose = top.filter((f) => f.mimeType !== FOLDER && !f.mimeType.includes('shortcut'))

  const folders = top.filter((f) => f.mimeType === FOLDER)
  folders.sort((a, b) => {
    const ia = CATEGORIES.indexOf(a.name), ib = CATEGORIES.indexOf(b.name)
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.name.localeCompare(b.name)
  })
  for (const folder of folders) {
    const files = (await listChildren(folder.id))
      .filter((f) => f.mimeType !== FOLDER && !f.mimeType.includes('shortcut'))
    groups.push({ category: folder.name, files: files.map(publicFile) })
  }
  if (loose.length) groups.push({ category: 'General', files: loose.map(publicFile) })
  return groups
}

function publicFile(f: DriveFile) {
  return {
    id: f.id,
    name: f.name,
    type: EXPORTABLE[f.mimeType] ? 'application/pdf' : f.mimeType,
    size: f.size ? Number(f.size) : null,
    modified: f.modifiedTime || null,
  }
}

// A file may be opened only if it sits in the project's "For Client"
// folder or in one of the category folders directly inside it.
async function assertFileInProject(project: Project, fileId: string): Promise<DriveFile> {
  const file = await getFile(fileId)
  const root = project.for_client_folder_id
  if (!root || file.mimeType === FOLDER) throw new HttpError(403, 'File not available.')
  const parent = file.parents?.[0]
  if (parent === root) return file
  if (parent) {
    const parentFolder = await getFile(parent)
    if (parentFolder.parents?.[0] === root) return file
  }
  throw new HttpError(403, 'File not available.')
}

async function listMessages(sb: SupabaseClient, projectId: string) {
  const { data } = await sb
    .from('client_messages')
    .select('id, sender_name, sender_email, body, attachments, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(100)
  return (data || []).map((m) => ({
    ...m,
    attachments: (m.attachments || []).map((a: { name: string; size?: number }) => ({ name: a.name, size: a.size })),
  }))
}

// ---------------------------------------------------------------
// Email (Resend)
// ---------------------------------------------------------------

async function sendEmail(msg: Record<string, unknown>): Promise<boolean> {
  const key = Deno.env.get('RESEND_API_KEY')
  if (!key) {
    console.error('RESEND_API_KEY is not set')
    return false
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(msg),
    })
    if (!res.ok) console.error('Resend error:', res.status, await res.text())
    return res.ok
  } catch (e) {
    console.error('Email send failed:', e)
    return false
  }
}

async function sendInvite(email: string, name: string, projectName: string): Promise<boolean> {
  const link = `${SITE_URL}/signup/homeowner?email=${encodeURIComponent(email)}`
  const greeting = name ? `Hello ${escapeHtml(name.split(' ')[0])},` : 'Hello,'
  return sendEmail({
    from: 'Ena Dodski, Hill Country Home Concepts <notifications@hillcountryhomeconcepts.com>',
    to: email,
    reply_to: ENA_EMAIL,
    subject: 'Your Hill Country Home Concepts project portal',
    html: `
      <div style="font-family: Georgia, serif; color: #3C2A21; max-width: 560px; line-height: 1.6;">
        <p>${greeting}</p>
        <p>I have set up a private project portal for <strong>${escapeHtml(projectName)}</strong>.
        In your portal you can view your estimates, product schedules, design presentations, and mood boards.
        You can also send me messages, photos, and documents at any time.</p>
        <p style="margin: 28px 0;">
          <a href="${link}" style="background: #1B2A4A; color: #F5F0EB; padding: 12px 24px; text-decoration: none; font-family: Arial, sans-serif; font-size: 14px; letter-spacing: 1px;">CREATE YOUR ACCOUNT</a>
        </p>
        <p>Please sign up with this email address (${escapeHtml(email)}) so your account connects to your project.
        If you already have an account, simply sign in at <a href="${SITE_URL}/login">${SITE_URL.replace('https://', '')}/login</a>.</p>
        <p>Warmly,<br>Ena Dodski<br>Hill Country Home Concepts</p>
      </div>`,
  })
}

// ---------------------------------------------------------------
// Actions
// ---------------------------------------------------------------

async function handle(req: Request, origin: string): Promise<Response> {
  const sb = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY)
  const caller = await getCaller(req, sb)

  const isForm = (req.headers.get('content-type') || '').includes('multipart/form-data')
  const form = isForm ? await req.formData() : null
  const body: Record<string, unknown> = form ? Object.fromEntries(form.entries()) : await req.json().catch(() => ({}))
  const action = clean(body.action, 40)

  const ok = (data: unknown) => new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  })

  // ---- Any signed-in person ----

  if (action === 'status') {
    // Used by the "pending" page to notice when an invited client is ready.
    const projects = await projectsFor(sb, caller)
    let status = caller.status
    // An invited homeowner is approved as soon as their account links to a project.
    if (projects.length && caller.role === 'homeowner' && status === 'pending') {
      await sb.from('user_profiles').update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('clerk_user_id', caller.clerkId)
      await sb.from('signup_requests').update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('clerk_user_id', caller.clerkId).eq('status', 'pending')
      status = 'active'
    }
    return ok({ status, role: caller.role, hasProject: projects.length > 0 })
  }

  // ---- Clients (and Ena) ----

  if (action === 'overview') {
    if (caller.status !== 'active' && !caller.isAdmin) throw new HttpError(403, 'Your account is not active yet.')
    const projects = caller.isAdmin && body.project_id
      ? [await projectById(sb, clean(body.project_id, 64))]
      : await projectsFor(sb, caller)
    if (!projects.length) return ok({ projects: [], documents: [], messages: [] })
    const wanted = clean(body.project_id, 64)
    const project = projects.find((p) => p.id === wanted) || projects[0]
    const [documents, messages] = await Promise.all([listDocuments(project), listMessages(sb, project.id)])
    return ok({
      projects: projects.map((p) => ({ id: p.id, name: p.name })),
      project: { id: project.id, name: project.name },
      documents,
      messages,
    })
  }

  if (action === 'file') {
    if (caller.status !== 'active' && !caller.isAdmin) throw new HttpError(403, 'Your account is not active yet.')
    const project = await projectForCaller(sb, caller, clean(body.project_id, 64))
    const file = await assertFileInProject(project, clean(body.file_id, 128))
    const exportType = EXPORTABLE[file.mimeType]
    const res = exportType
      ? await drive(`/files/${file.id}/export?mimeType=${encodeURIComponent(exportType)}`)
      : await drive(`/files/${file.id}?alt=media`)
    const filename = exportType && !file.name.toLowerCase().endsWith('.pdf') ? `${file.name}.pdf` : file.name
    return new Response(res.body, {
      status: 200,
      headers: {
        ...corsHeaders(origin),
        'Content-Type': exportType || file.mimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    })
  }

  if (action === 'send') {
    if (caller.status !== 'active' && !caller.isAdmin) throw new HttpError(403, 'Your account is not active yet.')
    const project = await projectForCaller(sb, caller, clean(body.project_id, 64))
    const text = clean(body.body, 5000)
    const files = form ? form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0) : []
    if (!text && !files.length) throw new HttpError(400, 'Please write a message or attach a file.')
    if (files.length > MAX_FILES) throw new HttpError(400, `Please attach no more than ${MAX_FILES} files at a time.`)
    if (files.reduce((n, f) => n + f.size, 0) > MAX_TOTAL_BYTES) {
      throw new HttpError(400, 'These files are too large to send together. The limit is 20 MB per message.')
    }

    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await sb.from('client_messages')
      .select('id', { count: 'exact', head: true })
      .eq('sender_clerk_id', caller.clerkId)
      .gte('created_at', since)
    if ((count ?? 0) >= MAX_MESSAGES_PER_HOUR) throw new HttpError(429, 'Too many messages. Please try again later.')

    // 1. Put attachments in the client's "From Client" folder
    const attachments: { name: string; drive_file_id: string; link?: string; size: number }[] = []
    if (files.length) {
      if (!project.from_client_folder_id) throw new HttpError(500, 'This project has no upload folder yet.')
      const stamp = new Date().toISOString().slice(0, 10)
      for (const f of files) {
        const safeName = f.name.replace(/[\\/:*?"<>|]+/g, '_').slice(0, 180) || 'upload'
        const up = await uploadFile(f, `${stamp} ${safeName}`, project.from_client_folder_id)
        attachments.push({ name: f.name, drive_file_id: up.id, link: up.webViewLink, size: f.size })
      }
    }

    // 2. Save the message
    const senderName = caller.name || caller.email
    const { data: saved, error } = await sb.from('client_messages').insert({
      project_id: project.id,
      sender_clerk_id: caller.clerkId,
      sender_email: caller.email,
      sender_name: senderName,
      body: text || null,
      attachments,
    }).select('id').single()
    if (error) {
      console.error('Save message error:', error)
      throw new HttpError(500, 'Could not save your message.')
    }

    // 3. Email Ena (the message is already saved, so a failure here is not fatal)
    const folderLink = project.from_client_folder_id
      ? `https://drive.google.com/drive/folders/${project.from_client_folder_id}` : ''
    const sent = await sendEmail({
      from: 'HCHC Client Portal <notifications@hillcountryhomeconcepts.com>',
      to: ENA_EMAIL,
      reply_to: caller.email || undefined,
      subject: `${project.name}: message from ${senderName}`,
      html: `
        <p><strong>${escapeHtml(senderName)}</strong> (${escapeHtml(caller.email)}) sent a message from the
        <strong>${escapeHtml(project.name)}</strong> portal.</p>
        ${text ? `<blockquote style="border-left: 3px solid #C4A265; margin: 16px 0; padding: 4px 16px;">${escapeHtml(text).replace(/\n/g, '<br>')}</blockquote>` : ''}
        ${attachments.length ? `<p><strong>Attachments (saved to Google Drive):</strong></p><ul>${attachments.map((a) =>
          `<li>${a.link ? `<a href="${a.link}">${escapeHtml(a.name)}</a>` : escapeHtml(a.name)}</li>`).join('')}</ul>` : ''}
        ${folderLink ? `<p><a href="${folderLink}">Open the From Client folder</a></p>` : ''}
        <p>Reply to this email to answer ${escapeHtml(senderName)} directly.</p>`,
    })
    if (sent) await sb.from('client_messages').update({ email_sent: true }).eq('id', saved.id)

    return ok({ ok: true })
  }

  // ---- Ena only ----

  if (!action.startsWith('admin_')) throw new HttpError(400, 'Unknown request.')
  if (!caller.isAdmin) throw new HttpError(403, 'Only Ena can do this.')

  if (action === 'admin_list') {
    const { data: projects } = await sb.from('client_projects')
      .select('id, name, drive_folder_id, archived, created_at, client_members(id, email, name, clerk_user_id, invited_at, joined_at)')
      .order('created_at', { ascending: false })
    const { data: pending } = await sb.from('user_profiles')
      .select('clerk_user_id, email, first_name, last_name, status, created_at')
      .eq('role', 'homeowner')
      .order('created_at', { ascending: false })
      .limit(100)
    const linked = new Set((projects || []).flatMap((p) => (p.client_members || []).map((m: { clerk_user_id: string | null }) => m.clerk_user_id)))
    return ok({
      projects: projects || [],
      unlinked: (pending || []).filter((u) => !linked.has(u.clerk_user_id)),
      driveConnected: !!CLIENTS_DRIVE_ID && !!Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON'),
    })
  }

  if (action === 'admin_create_project') {
    const name = clean(body.name, 120)
    if (!name) throw new HttpError(400, 'Please enter a project name.')
    if (!CLIENTS_DRIVE_ID) throw new HttpError(500, 'The HCHC Clients Shared Drive is not connected yet.')
    const main = await createFolder(name, CLIENTS_DRIVE_ID)
    const forClient = await createFolder('For Client', main)
    const fromClient = await createFolder('From Client', main)
    for (const c of CATEGORIES) await createFolder(c, forClient)
    const { data, error } = await sb.from('client_projects').insert({
      name, drive_folder_id: main, for_client_folder_id: forClient, from_client_folder_id: fromClient,
    }).select('id').single()
    if (error) throw new HttpError(500, 'Could not save the project.')
    return ok({ id: data.id })
  }

  if (action === 'admin_add_member') {
    const project = await projectById(sb, clean(body.project_id, 64))
    const email = clean(body.email, 320).toLowerCase()
    const name = clean(body.name, 200)
    if (!isEmail(email)) throw new HttpError(400, 'Please enter a valid email address.')

    // Does this person already have an account?
    const { data: existing } = await sb.from('user_profiles')
      .select('clerk_user_id, role, status, first_name, last_name')
      .eq('email', email)
      .maybeSingle()

    const { error } = await sb.from('client_members').upsert({
      project_id: project.id,
      email,
      name: name || (existing ? `${existing.first_name || ''} ${existing.last_name || ''}`.trim() : null),
      clerk_user_id: existing?.clerk_user_id || null,
      joined_at: existing ? new Date().toISOString() : null,
    }, { onConflict: 'project_id,email' })
    if (error) throw new HttpError(500, 'Could not add this person.')

    if (existing) {
      // Adding someone to a project approves their homeowner account.
      if (existing.role === 'homeowner' && existing.status !== 'active') {
        await sb.from('user_profiles').update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('clerk_user_id', existing.clerk_user_id)
        await sb.from('signup_requests').update({ status: 'approved', reviewed_at: new Date().toISOString() })
          .eq('clerk_user_id', existing.clerk_user_id).eq('status', 'pending')
      }
      return ok({ ok: true, linked: true })
    }

    const invited = body.send_invite === true || body.send_invite === 'true'
      ? await sendInvite(email, name, project.name) : false
    if (invited) {
      await sb.from('client_members').update({ invited_at: new Date().toISOString() })
        .eq('project_id', project.id).eq('email', email)
    }
    return ok({ ok: true, linked: false, invited })
  }

  if (action === 'admin_resend_invite') {
    const { data: m } = await sb.from('client_members')
      .select('email, name, project_id, clerk_user_id').eq('id', clean(body.member_id, 64)).maybeSingle()
    if (!m) throw new HttpError(404, 'Person not found.')
    if (m.clerk_user_id) throw new HttpError(400, 'This person has already joined.')
    const project = await projectById(sb, m.project_id)
    const invited = await sendInvite(m.email, m.name || '', project.name)
    if (!invited) throw new HttpError(502, 'The invitation email could not be sent.')
    await sb.from('client_members').update({ invited_at: new Date().toISOString() }).eq('id', clean(body.member_id, 64))
    return ok({ ok: true })
  }

  if (action === 'admin_remove_member') {
    await sb.from('client_members').delete().eq('id', clean(body.member_id, 64))
    return ok({ ok: true })
  }

  if (action === 'admin_archive_project') {
    await sb.from('client_projects').update({ archived: body.archived !== false && body.archived !== 'false' })
      .eq('id', clean(body.project_id, 64))
    return ok({ ok: true })
  }

  throw new HttpError(400, 'Unknown request.')
}

serve(async (req) => {
  const origin = req.headers.get('origin')
  if (!isAllowedOrigin(origin)) return new Response('Forbidden', { status: 403 })
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin!) })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders(origin!) })

  try {
    return await handle(req, origin!)
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500
    const message = e instanceof HttpError ? e.message : 'Something went wrong.'
    if (!(e instanceof HttpError)) console.error('Unexpected error:', e)
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders(origin!), 'Content-Type': 'application/json' },
    })
  }
})
