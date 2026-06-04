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

    const supabase = createAdminClient()

    // ── Fetch current job (need sheets_row_index and existing status) ──
    const { data: current, error: fetchError } = await supabase
      .from("jobs")
      .select("status, sheets_row_index")
      .eq("id", id)
      .single()

    if (fetchError || !current) {
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
        console.error("Job update error:", updateError)
        return NextResponse.json({ error: "Failed to update job" }, { status: 500 })
      }
    }

    // ── Write job_update row if status changed or note added ─
    if (body.status && body.status !== current.status) {
      await supabase.from("job_updates").insert({
        job_id: id,
        type: "status_change",
        message: `Status changed to ${body.status}`,
      })
    }

    if (body.note?.trim()) {
      await supabase.from("job_updates").insert({
        job_id: id,
        type: "note",
        message: body.note.trim(),
      })
    }

    // ── Sync to Google Sheets ────────────────────────────────
    if (current.sheets_row_index && current.sheets_row_index > 0) {
      const sheetsUpdate: Parameters<typeof updateJobRow>[1] = {}
      if (body.status          !== undefined) sheetsUpdate.status         = body.status
      if (body.assigned_to     !== undefined) sheetsUpdate.assignedTo     = body.assigned_to
      if (body.estimated_value !== undefined) sheetsUpdate.estimatedValue = body.estimated_value?.toString() ?? ""
      if (body.actual_value    !== undefined) sheetsUpdate.actualValue    = body.actual_value?.toString() ?? ""

      try {
        await updateJobRow(current.sheets_row_index, sheetsUpdate)
      } catch (sheetsErr) {
        console.error("Sheets update error:", sheetsErr)
        // Non-fatal
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Admin PATCH route error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
