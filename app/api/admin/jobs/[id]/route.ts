import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { updateJobRow } from "@/lib/google-sheets"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json() as {
      status?: string
      assigned_to?: string
      estimated_value?: number | null
      actual_value?: number | null
      note?: string
    }

    // Guard: fail fast with a clear message if service role key is missing
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not set")
      return NextResponse.json({ error: "Server misconfiguration: missing service role key" }, { status: 500 })
    }

    const supabase = createAdminClient()

    // ── Fetch current job (need sheets_row_index and existing status) ──
    const { data: current, error: fetchError } = await supabase
      .from("jobs")
      .select("status, sheets_row_index")
      .eq("id", id)
      .single()

    if (fetchError || !current) {
      console.error("Job fetch error:", fetchError)
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // ── Build DB update payload ──────────────────────────────
    const dbUpdate: Record<string, unknown> = {}
    if (body.status      !== undefined) dbUpdate.status         = body.status
    if (body.assigned_to !== undefined) dbUpdate.assigned_to    = body.assigned_to
    if (body.estimated_value !== undefined) dbUpdate.estimated_value = body.estimated_value
    if (body.actual_value    !== undefined) dbUpdate.actual_value    = body.actual_value

    if (Object.keys(dbUpdate).length > 0) {
      const { error: updateError } = await supabase
        .from("jobs")
        .update(dbUpdate)
        .eq("id", id)

      if (updateError) {
        console.error("Job update error:", JSON.stringify(updateError))
        return NextResponse.json({ error: "Failed to update job", detail: updateError.message }, { status: 500 })
      }
    }

    // ── Write job_update row if status changed or note added ─
    // Non-fatal: table may not exist yet or insert may fail — don't block the response
    if (body.status && body.status !== current.status) {
      const { error: updateRowErr } = await supabase.from("job_updates").insert({
        job_id: id,
        type: "status_change",
        message: `Status changed to ${body.status}`,
      })
      if (updateRowErr) console.warn("job_updates insert warning:", updateRowErr.message)
    }

    if (body.note?.trim()) {
      const { error: noteErr } = await supabase.from("job_updates").insert({
        job_id: id,
        type: "note",
        message: body.note.trim(),
      })
      if (noteErr) console.warn("job_updates note insert warning:", noteErr.message)
    }

    // ── Sync to Google Sheets (non-fatal) ────────────────────
    if (current.sheets_row_index && current.sheets_row_index > 0) {
      const sheetsUpdate: Parameters<typeof updateJobRow>[1] = {}
      if (body.status          !== undefined) sheetsUpdate.status         = body.status
      if (body.assigned_to     !== undefined) sheetsUpdate.assignedTo     = body.assigned_to
      if (body.estimated_value !== undefined) sheetsUpdate.estimatedValue = body.estimated_value?.toString() ?? ""
      if (body.actual_value    !== undefined) sheetsUpdate.actualValue    = body.actual_value?.toString() ?? ""

      try {
        await updateJobRow(current.sheets_row_index, sheetsUpdate)
      } catch (sheetsErr) {
        console.error("Sheets update error (non-fatal):", sheetsErr)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Admin PATCH route error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
