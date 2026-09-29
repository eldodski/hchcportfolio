-- ============================================================
-- HCHC Client Portal tables
-- Run once in Supabase: SQL Editor > New query > paste > Run.
--
-- Row Level Security is ON with no policies, so the public site
-- cannot read or change these tables directly. Only the
-- client-portal edge function (using HCHC_SECRET_KEY) can.
-- ============================================================

-- One row per client project. Each has its own Google Drive folders.
create table if not exists public.client_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,                        -- e.g. "Smith Residence"
  drive_folder_id text,                      -- the client's main folder
  for_client_folder_id text,                 -- Ena puts documents here
  from_client_folder_id text,                -- client uploads land here
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- People who can see a project (a couple can share one project).
-- clerk_user_id stays empty until the person signs up.
create table if not exists public.client_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.client_projects(id) on delete cascade,
  email text not null,
  name text,
  clerk_user_id text,
  invited_at timestamptz,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  unique (project_id, email)
);
create index if not exists idx_client_members_email on public.client_members (lower(email));
create index if not exists idx_client_members_clerk on public.client_members (clerk_user_id);

-- Messages clients send from their dashboard.
create table if not exists public.client_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.client_projects(id) on delete cascade,
  sender_clerk_id text not null,
  sender_email text,
  sender_name text,
  body text,
  attachments jsonb not null default '[]'::jsonb,  -- [{ name, drive_file_id, link, size }]
  email_sent boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_client_messages_project on public.client_messages (project_id, created_at desc);

alter table public.client_projects enable row level security;
alter table public.client_members  enable row level security;
alter table public.client_messages enable row level security;
