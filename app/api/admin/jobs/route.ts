import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

const BUCKET         = "job-photos"
const SIGNED_URL_TTL = 60 * 60 // 1 hour

export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data: jobs, error } = await supabase
      .from("jobs")
      .select(`
        id, type, category, description, address, status,
        timing, chosen_date, created_at, updated_at,
        estimated_value, actual_value, source, assigned_to, sheets_row_index,
        user_id, guest_name, guest_phone, guest_contact_preference,
        job_photos ( url, storage_path ),
        job_updates ( id, message, type, created_at )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Admin jobs fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 })
    }

    // Generate signed URLs for all job photos so the admin dashboard can display
    // images from the private bucket without exposing long-lived public URLs.
    const allPaths = (jobs ?? []).flatMap((j) =>
      (j.job_photos ?? []).map((p: { storage_path: string }) => p.storage_path)
    ).filter(Boolean)

    // Batch createSignedUrls — one call for all paths across all jobs.
    const signedMap: Record<string, string> = {}
    if (allPaths.length > 0) {
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(allPaths, SIGNED_URL_TTL)
      if (signed) {
        for (const entry of signed) {
          if (entry.signedUrl) signedMap[entry.path] = entry.signedUrl
        }
      }
    }

    const jobsWithCustomer = (jobs ?? []).map((job) => {
      const customerName  = job.guest_name  ?? "Guest"
      const customerPhone = job.guest_phone ?? ""
      const contactPref   = job.guest_contact_preference ?? ""

      const photosWithSignedUrls = (job.job_photos ?? []).map(
        (p: { url: string; storage_path: string }) => ({
          storage_path: p.storage_path,
          url: signedMap[p.storage_path] ?? p.url,
        })
      )

      return {
        ...job,
        job_photos:                  photosWithSignedUrls,
        customer_name:               customerName,
        customer_phone:              customerPhone,
        customer_contact_preference: contactPref,
      }
    })

    return NextResponse.json({ jobs: jobsWithCustomer })
  } catch (err) {
    console.error("Admin jobs route error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
