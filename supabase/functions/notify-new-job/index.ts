import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Supabase Database Webhook payload shape for an INSERT event.
interface WebhookPayload {
  type:   "INSERT" | "UPDATE" | "DELETE";
  table:  string;
  schema: string;
  record: JobRecord;
  old_record: null | JobRecord;
}

interface JobRecord {
  id:                       string;
  user_id:                  string | null;
  type:                     string;
  category:                 string;
  description:              string;
  address:                  string;
  status:                   string;
  timing:                   string | null;
  chosen_date:              string | null;
  guest_name:               string | null;
  guest_phone:              string | null;
  guest_contact_preference: string | null;
  source:                   string | null;
  created_at:               string;
}

// We do a quick follow-up query to check whether any job_photos rows exist
// for this job, since photos are uploaded asynchronously after the job insert.
// Rather than waiting (which would require a delay), we note in the message
// that photos may be incoming if the enquiry had them — this is fire-and-forget.
// Instead we just flag whether it's a guest or authenticated submission.

function formatTiming(timing: string | null, chosenDate: string | null): string {
  if (!timing) return "Not specified";
  if (timing === "asap")        return "ASAP";
  if (timing === "this-week")   return "This week";
  if (timing === "choose-date" && chosenDate) {
    return `Specific date: ${new Date(chosenDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
  }
  return timing;
}

function formatType(type: string): string {
  if (type === "issue")   return "🔧 Repair / Issue";
  if (type === "enquiry") return "💬 General Enquiry";
  return type;
}

function formatContact(pref: string | null): string {
  if (!pref) return "Not specified";
  if (pref === "phone")  return "📞 Phone call";
  if (pref === "text")   return "💬 Text message";
  if (pref === "in-app") return "📱 In-app message";
  return pref;
}

serve(async (req) => {
  // Supabase Database Webhooks send a POST with a JSON body.
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId   = Deno.env.get("TELEGRAM_CHAT_ID");

  if (!botToken || !chatId) {
    console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID secrets");
    // Return 200 so Supabase doesn't keep retrying — this is a config error.
    return new Response("Config error", { status: 200 });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  // Only act on INSERT events to the jobs table.
  if (payload.type !== "INSERT" || payload.table !== "jobs") {
    return new Response("Ignored", { status: 200 });
  }

  const job = payload.record;

  const customerName  = job.guest_name  ?? "Signed-in user";
  const customerPhone = job.guest_phone ?? "—";
  const isGuest       = job.user_id === null;
  const accountType   = isGuest ? "👤 Guest (no account)" : "✅ Registered user";

  // Truncate description to 200 chars so the notification stays readable.
  const desc = job.description.length > 200
    ? job.description.slice(0, 197) + "…"
    : job.description;

  const lines = [
    `🔔 *New Enquiry Received*`,
    ``,
    `*${formatType(job.type)}*`,
    `📂 Category: ${job.category}`,
    ``,
    `👤 *Customer*`,
    `Name: ${customerName}`,
    `Phone: ${customerPhone}`,
    `Contact pref: ${formatContact(job.guest_contact_preference)}`,
    `Account: ${accountType}`,
    ``,
    `📍 *Address*`,
    job.address,
    ``,
    `⏱ *Urgency*`,
    formatTiming(job.timing, job.chosen_date),
    ``,
    `📝 *Description*`,
    desc,
    ``,
    `🆔 Job ID: \`${job.id}\``,
    `📅 ${new Date(job.created_at).toLocaleString("en-GB", { timeZone: "Europe/London", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`,
  ];

  const text = lines.join("\n");

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          chat_id:    chatId,
          text,
          parse_mode: "Markdown",
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Telegram API error:", res.status, err);
      return new Response("Telegram error", { status: 500 });
    }

    console.log("Telegram notification sent for job:", job.id);
    return new Response("OK", { status: 200 });
  } catch (e) {
    console.error("Failed to send Telegram notification:", e);
    return new Response("Error", { status: 500 });
  }
});
