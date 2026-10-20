-- ============================================================
-- Migration 009: web enquiries (website form -> jobs table)
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- Additive only: adds two nullable columns and an index.
-- Existing rows and the mobile app are not affected.
-- ============================================================

-- Optional email supplied on the website form (for updates and, later,
-- matching the enquiry to an app account when the customer signs up).
alter table public.jobs add column if not exists guest_email text;

-- Campaign and page tracking captured when the form is opened
-- (utm_source, utm_medium, utm_campaign, utm_content, utm_term,
-- referrer, landing_path, device and similar). Used to work out
-- cost per enquiry by ad, audience and flyer.
alter table public.jobs add column if not exists tracking jsonb;

-- Fast filtering by source in the admin dashboard ('app' or 'web').
create index if not exists jobs_source_idx on public.jobs (source);

-- Make sure the service role (used by the web enquiry API route) can write.
grant select, insert, update on public.jobs to service_role;
grant insert on public.job_updates to service_role;
