-- Push token storage for Expo push notifications.
-- Tokens are linked to a job so the server can notify the right device
-- when their job status changes or a contractor messages them.
-- A device can have multiple jobs; a job can have multiple devices.

CREATE TABLE IF NOT EXISTS public.push_tokens (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  token      text    NOT NULL,
  job_id     uuid    REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(token, job_id)
);

-- Anon (guest) and authenticated users can insert their own token for their job.
CREATE POLICY "push_tokens: insert own"
  ON public.push_tokens
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Service role reads all tokens (for sending notifications server-side).
-- No SELECT policy for anon/authenticated — tokens are write-only from the client.

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
