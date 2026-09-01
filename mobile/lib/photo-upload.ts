import { supabase } from "@/lib/supabase";

const BUCKET = "job-photos";

/**
 * Upload an array of local device photo URIs to Supabase Storage and insert
 * corresponding rows into the job_photos table.
 *
 * Must be called AFTER the job row exists in Supabase (RLS on job_photos INSERT
 * checks that the linked job has the right user_id / user_id IS NULL).
 *
 * prefix:
 *   "guest/{jobId}"   — for anon submissions (user_id IS NULL on the job)
 *   "{userId}/{jobId}" — for authenticated submissions
 *
 * Returns the array of public-accessible storage paths inserted (useful for
 * updating local Job state). Non-fatal: errors are logged and skipped so a
 * failed photo upload never blocks navigation to the confirmation screen.
 */
export async function uploadJobPhotos(
  jobId: string,
  uris: string[],
  prefix: string,
): Promise<void> {
  if (uris.length === 0) return;

  for (let i = 0; i < uris.length; i++) {
    const uri = uris[i];
    try {
      // Determine file extension from the URI (default jpeg).
      const ext  = uri.split("?")[0].split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${prefix}/${i}.${ext}`;

      // Fetch the local URI as a Blob. React Native's fetch supports file:// URIs.
      const res  = await fetch(uri);
      const blob = await res.blob();

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, {
          contentType: blob.type || "image/jpeg",
          upsert:      true,
        });

      if (uploadError) {
        console.warn(`[photo-upload] storage upload failed (${path}):`, uploadError.message);
        continue;
      }

      // Get the public URL — the bucket is private so this is just the path
      // reference; the admin API generates signed URLs server-side.
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const url = urlData?.publicUrl ?? "";

      const { error: rowError } = await supabase
        .from("job_photos")
        .insert({ job_id: jobId, storage_path: path, url });

      if (rowError) {
        console.warn(`[photo-upload] job_photos insert failed (${path}):`, rowError.message);
      }
    } catch (e) {
      console.warn(`[photo-upload] unexpected error for uri ${i}:`, e);
    }
  }
}
