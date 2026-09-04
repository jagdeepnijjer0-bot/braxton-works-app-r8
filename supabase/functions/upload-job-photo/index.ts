import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BUCKET = "job-photos";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  // ── Parse and validate body ────────────────────────────────────────────────
  let body: { jobId?: string; index?: number; base64?: string; prefix?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const { jobId, index, base64, prefix } = body;

  if (!jobId || index === undefined || !base64 || !prefix) {
    return new Response(JSON.stringify({ error: "Missing required fields: jobId, index, base64, prefix" }), {
      status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // ── Build service-role Supabase client ────────────────────────────────────
  const supabaseUrl     = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // ── Decode base64 → bytes ─────────────────────────────────────────────────
  let bytes: Uint8Array;
  try {
    bytes = base64ToUint8Array(base64);
  } catch (e) {
    console.error("base64 decode failed:", e);
    return new Response(JSON.stringify({ error: "base64 decode failed" }), {
      status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if (bytes.byteLength === 0) {
    return new Response(JSON.stringify({ error: "Decoded to 0 bytes" }), {
      status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // ── Upload to Storage (service role — bypasses all RLS) ───────────────────
  const path = `${prefix}/${index}.jpg`;

  const { error: uploadErr } = await admin.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: "image/jpeg", upsert: true });

  if (uploadErr) {
    console.error("Storage upload failed:", uploadErr.message);
    return new Response(JSON.stringify({ error: uploadErr.message }), {
      status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // ── Get public URL and insert job_photos row ──────────────────────────────
  const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(path);
  const url = urlData?.publicUrl ?? "";

  const { error: rowErr } = await admin
    .from("job_photos")
    .insert({ job_id: jobId, storage_path: path, url });

  if (rowErr) {
    console.error("job_photos insert failed:", rowErr.message);
    // Upload succeeded — still return success but log the row failure.
    // The file is in Storage; admin can recover the row manually if needed.
    return new Response(JSON.stringify({ storage_path: path, url, row_error: rowErr.message }), {
      status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ storage_path: path, url }), {
    status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
});
