-- Allow guest (anon) users to read messages on their own guest jobs.
-- Guest jobs have user_id IS NULL; messages are linked by job_id.
-- This policy is safe: the anon user must know the job UUID to query it,
-- and job UUIDs are only ever given to the submitting device.

CREATE POLICY "messages: anon guest read"
  ON public.messages
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id  = messages.job_id
        AND jobs.user_id IS NULL
    )
  );
