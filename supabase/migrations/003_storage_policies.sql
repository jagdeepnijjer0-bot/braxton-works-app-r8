-- ============================================================
-- Migration 003 — job-photos Storage bucket + policies
-- Run once in the Supabase SQL Editor.
-- Safe to re-run: INSERT uses ON CONFLICT DO NOTHING.
-- ============================================================

-- ─── 1. Create the bucket if it doesn't exist ───────────────
--
-- public = false: bucket is PRIVATE. Photos are served via
-- signed URLs generated server-side by the admin API route
-- (createSignedUrls with a 1-hour TTL). They are never
-- world-accessible via a guessable public URL.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'job-photos',
  'job-photos',
  false,
  10485760,  -- 10 MB per file
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/heic','image/heif']
)
ON CONFLICT (id) DO UPDATE
  SET public            = false,
      file_size_limit   = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;


-- ─── 2. Drop existing storage policies (clean slate) ────────

DROP POLICY IF EXISTS "job-photos: anon guest upload"      ON storage.objects;
DROP POLICY IF EXISTS "job-photos: owner upload"           ON storage.objects;
DROP POLICY IF EXISTS "job-photos: owner read"             ON storage.objects;
DROP POLICY IF EXISTS "job-photos: service role full"      ON storage.objects;


-- ─── 3. Storage object policies ─────────────────────────────
--
-- Path convention enforced by the mobile app:
--   guest/{jobId}/{n}.{ext}   — anon (guest as guest) submissions
--   {userId}/{jobId}/{n}.{ext} — authenticated submissions
--
-- IMPORTANT: Storage RLS policies are evaluated independently of
-- the job_photos table RLS. The job_photos INSERT RLS is a second
-- gate that checks the linked job row. Both must pass.

-- Anon can upload to the guest/ prefix only.
-- Matches auth-gate.tsx submitEnquiry (anon role, user_id IS NULL on the job).
CREATE POLICY "job-photos: anon guest upload"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (
    bucket_id = 'job-photos'
    AND (storage.foldername(name))[1] = 'guest'
  );

-- Authenticated users can upload to their own {userId}/ prefix only.
-- (storage.foldername returns the path segments as an array)
CREATE POLICY "job-photos: owner upload"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'job-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can read their own photos (SELECT = read).
-- Also covers the mobile app's "My Jobs" photo thumbnails when
-- reading from the stored URL.
CREATE POLICY "job-photos: owner read"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'job-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- The service role (used by the admin API via createAdminClient)
-- bypasses RLS entirely, so no explicit policy is needed for it.
-- createSignedUrls called with the service role key works without
-- any policy — this is documented Supabase behaviour.


-- ─── 4. Verification ────────────────────────────────────────
--
-- After running, confirm with:
--
-- SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'job-photos';
--
-- SELECT policyname, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'storage' AND tablename = 'objects'
--   AND policyname LIKE 'job-photos%'
-- ORDER BY cmd;
