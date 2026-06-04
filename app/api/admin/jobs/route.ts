import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

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

    // Resolve customer name / phone for display
    const jobsWithCustomer = (jobs ?? []).map((job) => {
      let customerName  = job.guest_name  ?? "Guest"
      let customerPhone = job.guest_phone ?? ""
      let contactPref   = job.guest_contact_preference ?? ""

      return {
        ...job,
        customer_name:  customerName,
        customer_phone: customerPhone,
        customer_contact_preference: contactPref,
      }
    })

    // If user_id is set, fetch profile details in a separate query
    // (kept simple for Phase 1 — guest submissions are the initial use case)

    return NextResponse.json({ jobs: jobsWithCustomer })
  } catch (err) {
    console.error("Admin jobs route error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
