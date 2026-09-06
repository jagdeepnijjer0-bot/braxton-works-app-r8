import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

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
    const { body } = await req.json() as { body?: string }

    if (!body?.trim()) {
      return NextResponse.json({ error: "Message body is required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("messages")
      .insert({ job_id: id, body: body.trim(), sender: "contractor" })
      .select("id, body, sender, created_at")
      .single()

    if (error) {
      console.error("Admin message insert error:", error.message)
      return NextResponse.json({ error: `Failed to send message: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ ok: true, message: data })
  } catch (err) {
    console.error("Admin messages route error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
