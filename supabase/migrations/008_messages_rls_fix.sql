-- Re-assert table-level GRANTs (idempotent).
-- "permission denied for table messages" means these were missing or rolled back.
GRANT SELECT, INSERT ON public.messages TO anon, authenticated;

-- Allow authenticated users to INSERT messages on jobs they submitted before
-- their account was fully confirmed (user_id IS NULL at insert time).
-- Without this policy the message send fails for any job created during sign-up
-- that was not yet claimed with a user_id.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'messages'
      AND policyname = 'messages: authenticated insert on unclaimed job'
  ) THEN
    CREATE POLICY "messages: authenticated insert on unclaimed job"
      ON public.messages
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.jobs
          WHERE jobs.id = messages.job_id
            AND jobs.user_id IS NULL
        )
      );
  END IF;
END $$;

-- Allow authenticated users to SELECT messages on those same unclaimed jobs.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'messages'
      AND policyname = 'messages: authenticated read on unclaimed job'
  ) THEN
    CREATE POLICY "messages: authenticated read on unclaimed job"
      ON public.messages
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.jobs
          WHERE jobs.id = messages.job_id
            AND jobs.user_id IS NULL
        )
      );
  END IF;
END $$;
