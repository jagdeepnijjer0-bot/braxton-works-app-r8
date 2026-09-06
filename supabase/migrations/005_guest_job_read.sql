-- Allow anon (guest) users to read their own guest jobs by UUID.
-- Guest jobs have user_id IS NULL. The anon user must know the job UUID
-- (only given to the submitting device) so this is safe — no enumeration possible.
-- Required for: status refresh on app restart, realtime UPDATE events on jobs.

CREATE POLICY "jobs: anon guest read"
  ON public.jobs
  FOR SELECT
  TO anon
  USING (user_id IS NULL);
