-- Grant table-level permissions to service_role and authenticated/anon roles.
-- "permission denied for table messages" with the service role key means the
-- Postgres service_role role lacks a GRANT on the table — RLS bypass only
-- applies after the role clears table-level privilege checks.
-- These grants are idempotent and safe to re-run.

GRANT ALL ON public.messages      TO service_role;
GRANT ALL ON public.jobs          TO service_role;
GRANT ALL ON public.push_tokens   TO service_role;
GRANT ALL ON public.job_updates   TO service_role;
GRANT ALL ON public.job_photos    TO service_role;

-- anon and authenticated need SELECT/INSERT on messages for the mobile app
GRANT SELECT, INSERT ON public.messages    TO anon, authenticated;
GRANT SELECT, INSERT ON public.jobs        TO anon, authenticated;
GRANT INSERT          ON public.push_tokens TO anon, authenticated;
