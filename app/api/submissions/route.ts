import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendNewJobEmail } from "@/lib/email"
import { appendJobRow } from "@/lib/google-sheets"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()

    // ── Parse fields ────────────────────────────────────────
    const type              = formData.get("type") as string
    const category          = formData.get("category") as string
    const description       = formData.get("description") as string
    const address           = formData.get("address") as string
    const timing            = formData.get("timing") as string
    const chosenDate        = formData.get("chosenDate") as string | null
    const name              = formData.get("name") as string
    const phone             = formData.get("phone") as string
    const contactPreference = formData.get("contactPreference") as string
    const userId            = formData.get("userId") as string | null
    const photos            = formData.getAll("photos") as File[]

    if (!type || !category || !description || !address || !name || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // ── Insert job row ───────────────────────────────────────
    const jobRow: Record<string, unknown> = {
      type,
      category,
      description,
      address,
      timing: timing || null,
      chosen_date: chosenDate || null,
      status: "New",
      source: "app",
    }

    if (userId) {
      jobRow.user_id = userId
    } else {
      jobRow.guest_name               = name
      jobRow.guest_phone              = phone
      jobRow.guest_contact_preference = contactPreference
    }

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert(jobRow)
      .select("id")
      .single()

    if (jobError || !job) {
      console.error("Job insert error:", jobError)
      return NextResponse.json({ error: "Failed to save job" }, { status: 500 })
    }

    const jobId = job.id

    // ── Insert first job_update ──────────────────────────────
    await supabase.from("job_updates").insert({
      job_id: jobId,
      type: "status_change",
      message: "Enquiry received",
    })

    // ── Upload photos to Supabase Storage ───────────────────
    let photoCount = 0
    for (const photo of photos) {
      if (!(photo instanceof File) || photo.size === 0) continue

      const ext  = photo.name.split(".").pop() ?? "jpg"
      const path = `${jobId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from("job-photos")
        .upload(path, photo, { contentType: photo.type, upsert: false })

      if (uploadError) {
        console.error("Photo upload error:", uploadError)
        continue
      }

      const { data: publicUrlData } = supabase.storage
        .from("job-photos")
        .getPublicUrl(path)

      await supabase.from("job_photos").insert({
        job_id: jobId,
        storage_path: path,
        url: publicUrlData.publicUrl,
      })

      photoCount++
    }

    // ── Google Sheets ────────────────────────────────────────
    let sheetsRowIndex = 0
    try {
      sheetsRowIndex = await appendJobRow({
        jobId,
        name,
        phone,
        contactPreference: contactPreference ?? "",
        address,
        type,
        category,
        description,
        timing: timing ?? "",
        chosenDate: chosenDate ?? "",
        status: "New",
        source: "app",
        assignedTo: "",
        estimatedValue: "",
        actualValue: "",
      })

      if (sheetsRowIndex > 0) {
        await supabase
          .from("jobs")
          .update({ sheets_row_index: sheetsRowIndex })
          .eq("id", jobId)
      }
    } catch (sheetsErr) {
      // Sheets failure must not block the response
      console.error("Google Sheets error:", sheetsErr)
    }

    // ── Email notification ───────────────────────────────────
    try {
      await sendNewJobEmail({
        jobId,
        name,
        phone,
        contactPreference: contactPreference ?? "",
        address,
        type,
        category,
        description,
        timing: timing ?? "",
        chosenDate: chosenDate ?? null,
        photoCount,
      })
    } catch (emailErr) {
      // Email failure must not block the response
      console.error("Email error:", emailErr)
    }

    return NextResponse.json({ jobId }, { status: 201 })
  } catch (err) {
    console.error("Submission route error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
