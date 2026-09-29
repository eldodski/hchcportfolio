-- Inquiries from the homepage contact form.
-- Saved by the submit-inquiry edge function using the secret key.
-- RLS is on with no policies, so the public (publishable) key cannot read or write this table.

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  project_type text,
  timeline text,
  message text,
  page text,
  email_sent boolean not null default false
);

alter table public.inquiries enable row level security;
