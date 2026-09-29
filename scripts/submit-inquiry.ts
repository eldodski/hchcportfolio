// Supabase Edge Function: submit-inquiry
// Receives the homepage contact form, saves it to the inquiries table,
// then emails a copy to Ena through Resend.
// The inquiry is saved first, so it is never lost if the email step fails.
// Deploy with "Verify JWT" turned OFF (the site calls it without signing in).

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SECRET_KEY = Deno.env.get('HCHC_SECRET_KEY')!
const NOTIFY_TO = 'ena.dodski@hillcountryhomeconcepts.com'

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
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  }
}

function json(body: unknown, status: number, origin: string) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  })
}

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

serve(async (req) => {
  const origin = req.headers.get('origin')

  // SECURITY: Only the HCHC website may submit inquiries
  if (!isAllowedOrigin(origin)) {
    return new Response('Forbidden', { status: 403 })
  }
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin!) })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, origin!)
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid request' }, 400, origin!)
  }

  // Hidden field that people never see; bots tend to fill it in.
  // Pretend it worked so the bot moves on.
  if (clean(body.website, 200)) {
    return json({ ok: true }, 200, origin!)
  }

  const inquiry = {
    name: clean(body.name, 200),
    email: clean(body.email, 320),
    project_type: clean(body.project_type, 100) || null,
    timeline: clean(body.timeline, 100) || null,
    message: clean(body.message, 5000) || null,
    page: clean(body.page, 300) || null,
  }

  if (!inquiry.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inquiry.email)) {
    return json({ error: 'Please enter your name and a valid email address.' }, 400, origin!)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY)

  // Simple flood protection: at most 5 inquiries per email address in 10 minutes
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('inquiries')
    .select('id', { count: 'exact', head: true })
    .eq('email', inquiry.email)
    .gte('created_at', since)
  if ((count ?? 0) >= 5) {
    return json({ error: 'Too many messages. Please try again later.' }, 429, origin!)
  }

  // 1. Save the inquiry
  const { data: saved, error: saveError } = await supabase
    .from('inquiries')
    .insert(inquiry)
    .select('id')
    .single()

  if (saveError) {
    console.error('Error saving inquiry:', saveError)
    return json({ error: 'Could not save inquiry' }, 500, origin!)
  }

  // 2. Email a copy (the inquiry is already saved, so a failure here is not fatal)
  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (resendKey) {
    try {
      const rows = [
        ['Name', inquiry.name],
        ['Email', inquiry.email],
        ['Project Type', inquiry.project_type || 'Not given'],
        ['Timeline', inquiry.timeline || 'Not given'],
        ['Message', inquiry.message || 'Not given'],
      ]
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'HCHC Website <notifications@hillcountryhomeconcepts.com>',
          to: NOTIFY_TO,
          reply_to: inquiry.email,
          subject: `New HCHC Inquiry from ${inquiry.name}`,
          html: `
            <h2>New Website Inquiry</h2>
            <table cellpadding="6">
              ${rows.map(([k, v]) => `<tr><td><strong>${k}</strong></td><td>${escapeHtml(v).replace(/\n/g, '<br>')}</td></tr>`).join('')}
            </table>
            <p>Reply to this email to answer ${escapeHtml(inquiry.name)} directly.</p>
          `,
        }),
      })

      if (emailRes.ok) {
        await supabase.from('inquiries').update({ email_sent: true }).eq('id', saved.id)
      } else {
        console.error('Resend error:', emailRes.status, await emailRes.text())
      }
    } catch (emailError) {
      console.error('Email send failed (inquiry is saved):', emailError)
    }
  } else {
    console.error('RESEND_API_KEY is not set; inquiry saved without email')
  }

  return json({ ok: true }, 200, origin!)
})
