import { supabase } from "@/lib/supabase";
import type { InquiryPhoto } from "@/lib/context";

const BUCKET = "job-photos";

/**
 * Decode a base64 string to a Uint8Array.
 * atob() is available in Hermes (global, same as browsers).
 */
function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Upload an array of InquiryPhotos to Supabase Storage and insert
 * corresponding rows into the job_photos table.
 *
 * Uses the base64 string captured at picker time — no file:// read needed.
 * base64 → Uint8Array → supabase.storage.upload() works reliably in Hermes.
 *
 * Must be called AFTER the job row exists in Supabase (RLS on job_photos INSERT
 * checks that the linked job has the right user_id / user_id IS NULL).
 *
 * prefix:
 *   "guest/{jobId}"    — for anon submissions (user_id IS NULL on the job)
 *   "{userId}/{jobId}" — for authenticated submissions
 */
export async function uploadJobPhotos(
  jobId: string,
  photos: InquiryPhoto[],
  prefix: string,
): Promise<void> {
  if (photos.length === 0) return;

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    try {
      if (!photo.base64 || photo.base64.length === 0) {
        console.error(`[photo-upload] photo ${i} has no base64 data — skipping`);
        continue;
      }

      // Always upload as JPEG — the picker returns JPEG base64 regardless of
      // source format (expo-image-picker encodes HEIC/HEIF as JPEG when base64:true).
      const path        = `${prefix}/${i}.jpg`;
      const bytes       = base64ToUint8Array(photo.base64);
      const contentType = "image/jpeg";

      console.log(`[photo-upload] uploading ${path}, bytes=${bytes.byteLength}`);

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, bytes, { contentType, upsert: true });

      if (uploadError) {
        console.error(
          `[photo-upload] storage upload FAILED (${path}):`,
          uploadError.message,
          JSON.stringify(uploadError),
        );
        continue;
      }

      console.log(`[photo-upload] storage upload OK: ${path}`);

      // getPublicUrl gives us a stable URL reference even for private buckets.
      // The admin API replaces this with a signed URL at read time.
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const url = urlData?.publicUrl ?? "";

      const { error: rowError } = await supabase
        .from("job_photos")
        .insert({ job_id: jobId, storage_path: path, url });

      if (rowError) {
        console.error(
          `[photo-upload] job_photos INSERT FAILED (${path}):`,
          rowError.message,
          JSON.stringify(rowError),
        );
      } else {
        console.log(`[photo-upload] job_photos row OK: ${path}`);
      }
    } catch (e) {
      console.error(`[photo-upload] unexpected error for photo ${i}:`, e);
    }
  }
}
