import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Supabase Database Webhook payload for INSERT (messages) or UPDATE (jobs).
interface WebhookPayload {
  type:       "INSERT" | "UPDATE" | "DELETE";
  table:      string;
  schema:     string;
  record:     Record<string, unknown>;
  old_record: Record<string, unknown> | null;
}

interface ExpoPushMessage {
  to:    string | string[];
  title: string;
  body:  string;
  data?: Record<string, string>;
  sound?: "default";
  badge?: number;
}

async function sendExpoPush(messages: ExpoPushMessage[]) {
  if (messages.length === 0) return;
  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method:  "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body:    JSON.stringify(messages),
  });
  if (!res.ok) {
    console.error("Expo push error:", res.status, await res.text().catch(() => ""));
  }
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase    = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let jobId:   string | null = null;
  let title:   string | null = null;
  let body:    string | null = null;

  if (payload.table === "messages" && payload.type === "INSERT") {
    const msg = payload.record;
    // Only notify on contractor messages (i.e. admin → user).
    if (msg.sender !== "contractor") return new Response("Skipped", { status: 200 });
    jobId = msg.job_id as string;
    title = "New message from Braxton Works";
    body  = (msg.body as string).slice(0, 120);
  } else if (payload.table === "jobs" && payload.type === "UPDATE") {
    const job    = payload.record;
    const oldJob = payload.old_record;
    // Only notify on status changes.
    if (!oldJob || job.status === oldJob.status) return new Response("Skipped", { status: 200 });
    jobId = job.id as string;
    title = "Job update from Braxton Works";
    body  = `Your job status is now: ${job.status}`;
  } else {
    return new Response("Ignored", { status: 200 });
  }

  if (!jobId || !title || !body) return new Response("No-op", { status: 200 });

  // Look up push tokens for this job.
  const { data: tokenRows, error } = await supabase
    .from("push_tokens")
    .select("token")
    .eq("job_id", jobId);

  if (error) {
    console.error("push_tokens lookup error:", error.message);
    return new Response("DB error", { status: 500 });
  }

  const tokens = (tokenRows ?? []).map((r) => r.token as string).filter(Boolean);
  if (tokens.length === 0) {
    console.log("No push tokens for job:", jobId);
    return new Response("No tokens", { status: 200 });
  }

  // Expo push API accepts up to 100 tokens per request.
  const BATCH = 100;
  for (let i = 0; i < tokens.length; i += BATCH) {
    await sendExpoPush([{
      to:    tokens.slice(i, i + BATCH),
      title,
      body,
      sound: "default",
      data:  { jobId },
    }]);
  }

  console.log(`Sent push to ${tokens.length} token(s) for job ${jobId}`);
  return new Response("OK", { status: 200 });
});
