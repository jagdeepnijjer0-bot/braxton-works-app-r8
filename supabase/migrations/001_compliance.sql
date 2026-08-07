-- ============================================================
-- Compliance migration — run once in Supabase SQL Editor
-- ============================================================

-- ─── 1. Add compliance columns to public.users ──────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS marketing_consent     boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_consent_at  timestamptz,
  ADD COLUMN IF NOT EXISTS terms_accepted_at     timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version         text;

-- ─── 2. Allow users to insert their own profile row ─────────
-- (needed so the app can upsert after signUp without a service key)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'users' AND policyname = 'users: self insert'
  ) THEN
    EXECUTE 'CREATE POLICY "users: self insert"
      ON public.users FOR INSERT
      WITH CHECK (auth.uid() = id)';
  END IF;
END;
$$;

-- ─── 3. Update handle_new_user trigger to copy metadata ─────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    name,
    marketing_consent,
    marketing_consent_at,
    terms_accepted_at,
    terms_version
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'marketing_consent')::boolean, false),
    CASE
      WHEN (NEW.raw_user_meta_data->>'marketing_consent')::boolean = true
      THEN NOW()
      ELSE NULL
    END,
    (NEW.raw_user_meta_data->>'terms_accepted_at')::timestamptz,
    NEW.raw_user_meta_data->>'terms_version'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
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
