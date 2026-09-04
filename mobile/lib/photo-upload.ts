import { supabase } from "@/lib/supabase";
import type { InquiryPhoto } from "@/lib/context";

const FUNCTION_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/upload-job-photo`;

export async function uploadJobPhotos(
  jobId: string,
  photos: InquiryPhoto[],
  prefix: string,
): Promise<void> {
  if (photos.length === 0) return;

  // Get the current session token (may be null for guest — that's fine,
  // the Edge Function accepts anon JWT via the apikey header as fallback).
  const { data: { session } } = await supabase.auth.getSession();
  const authHeader = session?.access_token
    ? `Bearer ${session.access_token}`
    : `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`;

  await Promise.allSettled(
    photos.map(async (photo, i) => {
      if (!photo.base64) return;

      try {
        const res = await fetch(FUNCTION_URL, {
          method:  "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": authHeader,
            "apikey":        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
          },
          body: JSON.stringify({ jobId, index: i, base64: photo.base64, prefix }),
        });

        if (!res.ok) {
          const err = await res.text().catch(() => res.statusText);
          console.error(`[photo-upload] photo ${i} upload failed (${res.status}):`, err);
        }
      } catch (e) {
        console.error(`[photo-upload] photo ${i} fetch error:`, e);
      }
    })
  );
}
