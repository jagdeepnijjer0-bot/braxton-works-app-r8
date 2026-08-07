-- ============================================================
-- Compliance migration — run once in Supabase SQL Editor
-- ============================================================

-- ─── 1. user_profiles table (referenced by app code) ────────
-- Stores marketing consent and terms acceptance separately from
-- the core public.users profile row.
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  marketing_consent    boolean     NOT NULL DEFAULT false,
  marketing_consent_at timestamptz,
  terms_accepted_at    timestamptz,
  terms_version        text,
  created_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'user_profiles: self read') THEN
    EXECUTE 'CREATE POLICY "user_profiles: self read" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'user_profiles: self insert') THEN
    EXECUTE 'CREATE POLICY "user_profiles: self insert" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'user_profiles: self update') THEN
    EXECUTE 'CREATE POLICY "user_profiles: self update" ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id)';
  END IF;
END;
$$;

-- ─── 4. Account deletion function ───────────────────────────
-- SECURITY DEFINER lets this run as the function owner (postgres),
-- which has permission to delete from auth.users.
-- auth.uid() ensures a user can only delete their own account.
CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Strip guest PII fields from jobs before user_id is set null by cascade.
  -- Financial fields (estimated_value, actual_value) are retained for HMRC records.
  UPDATE public.jobs
  SET
    guest_name               = NULL,
    guest_phone              = NULL,
    guest_contact_preference = NULL
  WHERE user_id = uid;

  -- Deleting from auth.users cascades to:
  --   public.users          (ON DELETE CASCADE  — profile row removed)
  --   public.jobs.user_id   (ON DELETE SET NULL — job record kept, user_id nulled)
  --   job_photos / job_updates survive via their job FK (no user FK)
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;
