import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

const PUSH_FN_URL = "https://axryceaxxihewqmazuve.supabase.co/functions/v1/send-push-notification"

async function notifyPush(payload: Record<string, unknown>) {
  try {
    await fetch(PUSH_FN_URL, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`,
      },
      body: JSON.stringify(payload),
    })
  } catch (e) {
    console.warn("[push] notify failed (non-fatal):", e)
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("messages")
      .select("id, body, sender, created_at")
      .eq("job_id", id)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Admin messages fetch error:", error.message)
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }

    return NextResponse.json({ messages: data ?? [] })
  } catch (err) {
    console.error("Admin messages GET error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log("[admin/messages POST] hit for job:", id)

    const { body } = await req.json() as { body?: string }
    console.log("[admin/messages POST] body length:", body?.length ?? 0)

    if (!body?.trim()) {
      return NextResponse.json({ error: "Message body is required" }, { status: 400 })
    }

    const supabase = createAdminClient()
    console.log("[admin/messages POST] supabase url:", process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30))
    console.log("[admin/messages POST] service key set:", !!process.env.SUPABASE_SERVICE_ROLE_KEY)

    const { data, error } = await supabase
      .from("messages")
      .insert({ job_id: id, body: body.trim(), sender: "contractor" })
      .select("id, body, sender, created_at")
      .single()

    if (error) {
      console.error("Admin message insert error:", error.message, error.code, error.details)
      return NextResponse.json({ error: `Failed to send message: ${error.message}` }, { status: 500 })
    }

    // Fire push notification — non-blocking, non-fatal
    notifyPush({
      type:   "INSERT",
      table:  "messages",
      schema: "public",
      record: data,
      old_record: null,
    })

    return NextResponse.json({ ok: true, message: data })
  } catch (err) {
    console.error("Admin messages route error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
