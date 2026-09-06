import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

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

    const { error } = await supabase
      .from("messages")
      .insert({ job_id: id, body: body.trim(), sender: "contractor" })

    if (error) {
      console.error("Admin message insert error:", error.message)
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Admin messages route error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
