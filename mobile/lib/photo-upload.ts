import { supabase } from "@/lib/supabase";

const BUCKET = "job-photos";

/**
 * Read a local file:// URI as a Blob using XMLHttpRequest.
 *
 * React Native's fetch() does NOT reliably support file:// URIs on the New
 * Architecture (Hermes/JSI) — it silently returns an empty or error response.
 * XHR with responseType='blob' is the correct way to read local files in RN.
 */
function readUriAsBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.responseType = "blob";
    xhr.onload = () => {
      if (xhr.status === 0 || xhr.status === 200) {
        resolve(xhr.response as Blob);
      } else {
        reject(new Error(`XHR failed with status ${xhr.status} for URI: ${uri}`));
      }
    };
    xhr.onerror = () => reject(new Error(`XHR network error for URI: ${uri}`));
    xhr.open("GET", uri);
    xhr.send();
  });
}

/**
 * Upload an array of local device photo URIs to Supabase Storage and insert
 * corresponding rows into the job_photos table.
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
  uris: string[],
  prefix: string,
): Promise<void> {
  if (uris.length === 0) return;

  for (let i = 0; i < uris.length; i++) {
    const uri = uris[i];
    try {
      // Infer extension from URI (strip query params first). Default to jpg.
      const cleanUri = uri.split("?")[0];
      const ext = cleanUri.split(".").pop()?.toLowerCase() ?? "jpg";
      // Normalise HEIC/HEIF — iOS often gives these but uploads as jpeg in practice.
      const safeExt = (ext === "heic" || ext === "heif") ? "jpg" : ext;
      const path    = `${prefix}/${i}.${safeExt}`;

      console.log(`[photo-upload] reading uri ${i}:`, uri);

      // Read the local file as a Blob via XHR (works with file:// URIs in RN).
      let blob: Blob;
      try {
        blob = await readUriAsBlob(uri);
      } catch (readErr) {
        console.error(`[photo-upload] failed to read uri ${i}:`, readErr);
        continue;
      }

      if (!blob || blob.size === 0) {
        console.error(`[photo-upload] blob is empty for uri ${i}:`, uri);
        continue;
      }

      console.log(`[photo-upload] uploading ${path}, size=${blob.size}, type=${blob.type}`);

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, {
          contentType: blob.type || "image/jpeg",
          upsert:      true,
        });

      if (uploadError) {
        console.error(`[photo-upload] storage upload failed (${path}):`, uploadError.message, JSON.stringify(uploadError));
        continue;
      }

      console.log(`[photo-upload] uploaded successfully: ${path}`);

      // getPublicUrl returns a URL structure even for private buckets.
      // The admin API replaces this with a signed URL server-side.
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const url = urlData?.publicUrl ?? "";

      const { error: rowError } = await supabase
        .from("job_photos")
        .insert({ job_id: jobId, storage_path: path, url });

      if (rowError) {
        console.error(`[photo-upload] job_photos insert failed (${path}):`, rowError.message, JSON.stringify(rowError));
      } else {
        console.log(`[photo-upload] job_photos row inserted for ${path}`);
      }
    } catch (e) {
      console.error(`[photo-upload] unexpected error for uri ${i}:`, e);
    }
  }
}
