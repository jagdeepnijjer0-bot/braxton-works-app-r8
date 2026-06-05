-- ============================================================
-- Braxton Works — Phase 1 Schema
-- Run this in the Supabase SQL Editor (once, on a fresh project)
-- ============================================================

-- ─── EXTENSIONS ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── USERS / PROFILES ───────────────────────────────────────
-- Public profile table linked to Supabase Auth (auth.users)
create table if not exists public.users (
  id                  uuid primary key references auth.users(id) on delete cascade,
  name                text,
  phone               text,
  contact_preference  text check (contact_preference in ('phone', 'text', 'in-app')),
  role                text not null default 'user' check (role in ('user', 'admin')),
  created_at          timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── JOBS ───────────────────────────────────────────────────
create table if not exists public.jobs (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid references public.users(id) on delete set null,

  -- Guest fields (used when user_id is null)
  guest_name                text,
  guest_phone               text,
  guest_contact_preference  text check (guest_contact_preference in ('phone', 'text', 'in-app')),

  -- Inquiry details
  type                      text not null check (type in ('issue', 'inquiry')),
  category                  text not null,
  description               text not null,
  address                   text not null,
  timing                    text check (timing in ('asap', 'this-week', 'choose-date')),
  chosen_date               date,

  -- Status — 6-value set agreed in plan
  status                    text not null default 'New'
                              check (status in ('New', 'Quoted', 'Booked', 'In Progress', 'Complete', 'Cancelled')),

  -- Admin / operational fields
  estimated_value           numeric(10,2),
  actual_value              numeric(10,2),
  source                    text default 'app',
  assigned_to               text,
  sheets_row_index          integer,

  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- Auto-update updated_at on any row change
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();

-- ─── JOB PHOTOS ─────────────────────────────────────────────
create table if not exists public.job_photos (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid not null references public.jobs(id) on delete cascade,
  storage_path  text not null,
  url           text not null,
  created_at    timestamptz not null default now()
);

-- ─── JOB UPDATES (notes + status changes) ───────────────────
create table if not exists public.job_updates (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid not null references public.jobs(id) on delete cascade,
  type        text not null check (type in ('status_change', 'note')),
  message     text not null,
  created_at  timestamptz not null default now()
);

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────

alter table public.users     enable row level security;
alter table public.jobs      enable row level security;
alter table public.job_photos enable row level security;
alter table public.job_updates enable row level security;

-- users: each user can read and update only their own row
create policy "users: self read"
  on public.users for select
  using (auth.uid() = id);

create policy "users: self update"
  on public.users for update
  using (auth.uid() = id);

-- jobs: authenticated users see only their own jobs
create policy "jobs: owner read"
  on public.jobs for select
  using (auth.uid() = user_id);

-- job_photos: owner can read photos belonging to their jobs
create policy "job_photos: owner read"
  on public.job_photos for select
  using (
    exists (
      select 1 from public.jobs
      where jobs.id = job_photos.job_id
        and jobs.user_id = auth.uid()
    )
  );

-- job_updates: owner can read updates on their jobs
create policy "job_updates: owner read"
  on public.job_updates for select
  using (
    exists (
      select 1 from public.jobs
      where jobs.id = job_updates.job_id
        and jobs.user_id = auth.uid()
    )
  );

-- ─── STORAGE BUCKET ─────────────────────────────────────────
-- Run this separately if the bucket doesn't already exist:
--
-- insert into storage.buckets (id, name, public)
-- values ('job-photos', 'job-photos', true)
-- on conflict do nothing;
--
-- Storage policies (in Supabase dashboard → Storage → Policies):
--   Allow authenticated uploads:
--     (bucket_id = 'job-photos' AND auth.role() = 'authenticated')
--   Allow public read (since bucket is public):
--     (bucket_id = 'job-photos')
