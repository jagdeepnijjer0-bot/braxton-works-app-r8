import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
    }

    const { data: jobs, error } = await supabase
      .from("jobs")
      .select(`
        id, type, category, description, address, status,
        timing, chosen_date, created_at,
        job_photos ( url ),
        job_updates ( message, created_at, type )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Jobs fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 })
    }

    return NextResponse.json({ jobs })
  } catch (err) {
    console.error("Jobs route error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
