import { Alert } from "react-native";
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
  // ── STEP 0: confirm photos array reached this function ───────────────────
  const step0 = `uploadJobPhotos called\nphotos.length=${photos.length}\nprefix=${prefix}\njobId=${jobId}`;
  Alert.alert("📸 Upload Step 0", step0);

  if (photos.length === 0) return;

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];

    // ── STEP 1: check base64 presence ────────────────────────────────────
    const b64Len = photo.base64?.length ?? 0;
    const uriSnip = photo.uri?.slice(0, 60) ?? "(none)";
    Alert.alert(
      `📸 Step 1 — Photo ${i}`,
      `uri: ${uriSnip}\nbase64 length: ${b64Len}\nbase64 truthy: ${!!photo.base64}`,
    );

    if (!photo.base64 || b64Len === 0) {
      Alert.alert(`📸 Step 1 FAIL — Photo ${i}`, "base64 is empty/null — cannot upload");
      continue;
    }

    // ── STEP 2: decode base64 → bytes ────────────────────────────────────
    let bytes: Uint8Array;
    try {
      bytes = base64ToUint8Array(photo.base64);
    } catch (decodeErr: any) {
      Alert.alert(`📸 Step 2 FAIL — Photo ${i}`, `base64 decode threw:\n${decodeErr?.message ?? String(decodeErr)}`);
      continue;
    }
    Alert.alert(`📸 Step 2 OK — Photo ${i}`, `Decoded bytes: ${bytes.byteLength}`);

    if (bytes.byteLength === 0) {
      Alert.alert(`📸 Step 2 FAIL — Photo ${i}`, "Decoded to 0 bytes — skipping");
      continue;
    }

    const path        = `${prefix}/${i}.jpg`;
    const contentType = "image/jpeg";

    // ── STEP 3: storage upload ────────────────────────────────────────────
    let uploadErr: any = null;
    try {
      const result = await supabase.storage
        .from(BUCKET)
        .upload(path, bytes, { contentType, upsert: true });
      uploadErr = result.error;
    } catch (e: any) {
      Alert.alert(`📸 Step 3 THREW — Photo ${i}`, `storage.upload threw:\n${e?.message ?? String(e)}`);
      continue;
    }

    if (uploadErr) {
      Alert.alert(
        `📸 Step 3 FAIL — Photo ${i}`,
        `storage.upload error:\n${uploadErr.message}\n\nFull: ${JSON.stringify(uploadErr)}`,
      );
      continue;
    }
    Alert.alert(`📸 Step 3 OK — Photo ${i}`, `Uploaded to: ${path}`);

    // ── STEP 4: job_photos row insert ─────────────────────────────────────
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const url = urlData?.publicUrl ?? "";

    let rowErr: any = null;
    try {
      const result = await supabase.from("job_photos").insert({ job_id: jobId, storage_path: path, url });
      rowErr = result.error;
    } catch (e: any) {
      Alert.alert(`📸 Step 4 THREW — Photo ${i}`, `job_photos insert threw:\n${e?.message ?? String(e)}`);
      continue;
    }

    if (rowErr) {
      Alert.alert(
        `📸 Step 4 FAIL — Photo ${i}`,
        `job_photos insert error:\n${rowErr.message}\n\nFull: ${JSON.stringify(rowErr)}`,
      );
    } else {
      Alert.alert(`📸 Step 4 OK — Photo ${i}`, `job_photos row inserted.\nAll done for photo ${i}!`);
    }
  }
}
