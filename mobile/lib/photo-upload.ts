import { supabase } from "@/lib/supabase";
import type { InquiryPhoto } from "@/lib/context";

const BUCKET = "job-photos";

function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function uploadJobPhotos(
  jobId: string,
  photos: InquiryPhoto[],
  prefix: string,
): Promise<void> {
  if (photos.length === 0) return;

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    if (!photo.base64) continue;

    let bytes: Uint8Array;
    try {
      bytes = base64ToUint8Array(photo.base64);
    } catch (e) {
      console.error(`[photo-upload] base64 decode failed for photo ${i}:`, e);
      continue;
    }
    if (bytes.byteLength === 0) continue;

    const path = `${prefix}/${i}.jpg`;

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: "image/jpeg", upsert: true });

    if (uploadErr) {
      console.error(`[photo-upload] storage upload failed for photo ${i}:`, uploadErr.message);
      continue;
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const url = urlData?.publicUrl ?? "";

    const { error: rowErr } = await supabase
      .from("job_photos")
      .insert({ job_id: jobId, storage_path: path, url });

    if (rowErr) {
      console.error(`[photo-upload] job_photos insert failed for photo ${i}:`, rowErr.message);
    }
  }
}
