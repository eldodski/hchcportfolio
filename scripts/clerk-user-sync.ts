// Supabase Edge Function: clerk-user-sync
// Triggered by Clerk webhook on user.created event
// Creates user_profiles row and signup_requests entry

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CLERK_WEBHOOK_SECRET = Deno.env.get('CLERK_WEBHOOK_SECRET')

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const body = await req.json()

  // Verify this is a user.created event
  if (body.type !== 'user.created') {
    return new Response('Event type not handled', { status: 200 })
  }

  const userData = body.data
  const clerkUserId = userData.id
  const email = userData.email_addresses?.[0]?.email_address || ''
  const firstName = userData.first_name || ''
  const lastName = userData.last_name || ''

  // Get role from unsafe_metadata (set during signup)
  // This is the initial role selection — admin approval still required
  const roleRequested = userData.unsafe_metadata?.role || 'homeowner'

  // SECURITY: Never allow admin role through signup
  const safeRole = roleRequested === 'admin' ? 'homeowner' : roleRequested
  const validRoles = ['interior_designer', 'builder', 'homeowner']
  const finalRole = validRoles.includes(safeRole) ? safeRole : 'homeowner'

  const companyName = userData.unsafe_metadata?.company_name || null

  // Use service role client to bypass RLS
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // 1. Create user profile with status = pending
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      clerk_user_id: clerkUserId,
      email,
      first_name: firstName,
      last_name: lastName,
      company_name: companyName,
      role: finalRole,
      status: 'pending',
    })
    .select()
    .single()

  if (profileError) {
    console.error('Error creating user profile:', profileError)
    return new Response(JSON.stringify({ error: profileError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 2. Create signup request for admin approval
  const { error: requestError } = await supabase
    .from('signup_requests')
    .insert({
      user_id: profile.id,
      clerk_user_id: clerkUserId,
      role_requested: finalRole,
      email,
      name: `${firstName} ${lastName}`.trim(),
      company_name: companyName,
      status: 'pending',
    })

  if (requestError) {
    console.error('Error creating signup request:', requestError)
  }

  // 3. Log notification (email sent separately if Resend is configured)
  await supabase.from('notification_log').insert({
    type: 'new_signup',
    recipient: 'ena.dodski@hillcountryhomeconcepts.com',
    subject: `New ${finalRole} signup: ${firstName} ${lastName}`,
    body: `Email: ${email}\nRole: ${finalRole}\nCompany: ${companyName || 'N/A'}`,
    sent: false,
  })

  // 4. Try sending email via Resend if configured
  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (resendKey) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'HCHC Platform <notifications@hillcountryhomeconcepts.com>',
          to: 'ena.dodski@hillcountryhomeconcepts.com',
          subject: `New ${finalRole} signup: ${firstName} ${lastName}`,
          html: `
            <h2>New Account Signup</h2>
            <p><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Role:</strong> ${finalRole}</p>
            <p><strong>Company:</strong> ${companyName || 'N/A'}</p>
            <p><a href="https://hillcountryhomeconcepts.com/admin/user-approvals.html">Review in Admin Panel</a></p>
          `,
        }),
      })

      // Mark notification as sent
      await supabase
        .from('notification_log')
        .update({ sent: true })
        .eq('type', 'new_signup')
        .eq('recipient', 'ena.dodski@hillcountryhomeconcepts.com')
        .order('created_at', { ascending: false })
        .limit(1)
    } catch (emailError) {
      console.error('Email send failed (non-blocking):', emailError)
    }
  }

  return new Response(JSON.stringify({ success: true, profileId: profile.id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
