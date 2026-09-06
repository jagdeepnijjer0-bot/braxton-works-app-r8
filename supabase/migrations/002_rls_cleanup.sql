-- ============================================================
-- Migration 002 — RLS audit, cleanup, and CHECK constraint fixes
-- Run once in the Supabase SQL Editor.
-- Safe to re-run: all DROPs use IF EXISTS.
-- ============================================================

-- ─── PART A: FIX CHECK CONSTRAINTS ON jobs ──────────────────
--
-- schema.sql had constraints from an earlier design that don't match
-- the status values and type values the app actually sends.
--
-- STATUS mismatch:
--   schema.sql: ('New','Quoted','Booked','In Progress','Complete','Cancelled')
--   app sends:  ('Enquiry Received','Assigning Contractor','Contractor Assigned',
--                'Quote Ready','Job Underway','Job Completed','Cancelled')
--
-- TYPE mismatch:
--   schema.sql: ('issue','inquiry')
--   app sends:  ('issue','enquiry')  <-- British spelling, different string
--
-- If your production table already has the correct constraints (because you
-- fixed them via the dashboard), these ALTER TABLE statements are no-ops
-- (DROP CONSTRAINT IF EXISTS on a non-existent constraint does nothing).
-- If the old constraints are still there, this fixes them.

ALTER TABLE public.jobs
  DROP CONSTRAINT IF EXISTS jobs_status_check;

ALTER TABLE public.jobs
  DROP CONSTRAINT IF EXISTS jobs_type_check;

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_status_check
    CHECK (status IN (
      'Enquiry Received',
      'Assigning Contractor',
      'Contractor Assigned',
      'Quote Ready',
      'Job Underway',
      'Job Completed',
      'Cancelled'
    ));

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_type_check
    CHECK (type IN ('issue', 'enquiry'));


-- ─── PART B: ENSURE RLS IS ENABLED ON ALL TABLES ────────────
--
-- messages and push_tokens were not in schema.sql so RLS may never
-- have been enabled on them — meaning they're world-readable/writable.

ALTER TABLE public.users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_photos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_updates   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens   ENABLE ROW LEVEL SECURITY;


-- ─── PART C: DROP ALL EXISTING POLICIES (every table) ───────
--
-- We drop everything and recreate cleanly rather than patching
-- individual policies. This removes duplicates and any overly-
-- permissive "Enable read access for all users" policies that
-- Supabase sometimes creates by default via the dashboard.

DO $$
DECLARE
  pol  record;
  tbl  text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'users', 'jobs', 'job_photos', 'job_updates',
    'user_profiles', 'messages', 'push_tokens'
  ]
  LOOP
    FOR pol IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = tbl
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
    END LOOP;
  END LOOP;
END;
$$;


-- ─── PART D: RECREATE CORRECT POLICIES ──────────────────────


-- ── public.users ─────────────────────────────────────────────
-- INSERT: not needed — handle_new_user() trigger (SECURITY DEFINER) creates the row.
-- DELETE: not needed — delete_my_account() function (SECURITY DEFINER) handles it.
-- SELECT/UPDATE: own row only.

CREATE POLICY "users: self read"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users: self update"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ── public.jobs ──────────────────────────────────────────────
--
-- Three policies, two roles:
--
-- 1. anon INSERT — guest enquiry flow (auth-gate "Continue as Guest").
--    The app inserts a job with user_id = NULL before any auth session.
--    WITH CHECK (user_id IS NULL) prevents anon users from
--    inserting jobs that claim an existing user's user_id.
--
-- 2. authenticated INSERT — enquiry attached to a signed-in user.
--    Covers: (a) sign-in flow in signin.tsx, (b) email-confirmation
--    flow in handleAuthCallback (the deferred insert approach).
--    WITH CHECK (auth.uid() = user_id) ensures users can only create
--    jobs assigned to themselves.
--
-- 3. authenticated SELECT — fetchUserJobs reads only own jobs.
--    USING (auth.uid() = user_id) means user_id = NULL rows
--    (unclaimed guest jobs) are invisible to signed-in users.
--
-- No client-side UPDATE policy:
--    Status changes are written by the admin/contractor via service role.
--    The app's realtime listener reads UPDATE events and updates local
--    React state — it never writes back to Supabase from the client.
--
-- No client-side DELETE policy:
--    Jobs are never deleted by users (account deletion uses SECURITY DEFINER).

CREATE POLICY "jobs: anon guest insert"
  ON public.jobs
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "jobs: owner insert"
  ON public.jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "jobs: owner read"
  ON public.jobs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);


-- ── public.messages ──────────────────────────────────────────
--
-- The app inserts a welcome message immediately after each job insert.
-- That insert runs as the same role as the job insert:
--   - anon  → guest flow (auth-gate)
--   - authenticated → sign-in flow or handleAuthCallback
--
-- SELECT is limited to authenticated users who own the related job.
-- Contractor/admin messages are inserted via service role (bypasses RLS).

CREATE POLICY "messages: anon guest insert"
  ON public.messages
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = messages.job_id
        AND jobs.user_id IS NULL
    )
  );

CREATE POLICY "messages: owner insert"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = messages.job_id
        AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "messages: owner read"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = messages.job_id
        AND jobs.user_id = auth.uid()
    )
  );


-- ── public.push_tokens ───────────────────────────────────────
--
-- Device push tokens are registered immediately after job insert,
-- by the same role. No client SELECT needed (tokens are only read
-- server-side to send notifications).

CREATE POLICY "push_tokens: anon guest insert"
  ON public.push_tokens
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = push_tokens.job_id
        AND jobs.user_id IS NULL
    )
  );

CREATE POLICY "push_tokens: owner insert"
  ON public.push_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = push_tokens.job_id
        AND jobs.user_id = auth.uid()
    )
  );


-- ── public.job_photos ────────────────────────────────────────
--
-- Photos are uploaded to Supabase Storage; job_photos rows link
-- a job to a storage path. Same role split as messages.

CREATE POLICY "job_photos: owner read"
  ON public.job_photos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_photos.job_id
        AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "job_photos: anon guest insert"
  ON public.job_photos
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_photos.job_id
        AND jobs.user_id IS NULL
    )
  );

CREATE POLICY "job_photos: owner insert"
  ON public.job_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_photos.job_id
        AND jobs.user_id = auth.uid()
    )
  );


-- ── public.job_updates ───────────────────────────────────────
--
-- Status changes and notes are written by admin/contractor via
-- service role. Client only reads (via realtime and on page load).

CREATE POLICY "job_updates: owner read"
  ON public.job_updates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_updates.job_id
        AND jobs.user_id = auth.uid()
    )
  );


-- ── public.user_profiles ─────────────────────────────────────
--
-- Marketing consent and terms acceptance. Own row only.
-- INSERT: app uses UPSERT (insert + update), so both are needed.

CREATE POLICY "user_profiles: self read"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_profiles: self insert"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_profiles: self update"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ─── VERIFICATION QUERY (run after migration to confirm) ─────
--
-- SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('users','jobs','job_photos','job_updates',
--                     'user_profiles','messages','push_tokens')
-- ORDER BY tablename, cmd;
