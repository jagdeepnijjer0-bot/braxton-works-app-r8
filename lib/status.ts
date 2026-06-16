import type { JobStatus } from "@/lib/app-context"

// Maps internal DB status values (unchanged — used by Supabase/Sheets/API)
// to the customer-facing Uber-style labels from the UX brief.
export const STATUS_DISPLAY: Record<JobStatus, string> = {
  "New": "Submitted",
  "Quoted": "Under Review",
  "Booked": "Contractor Assigned",
  "In Progress": "In Progress",
  "Complete": "Completed",
  "Cancelled": "Cancelled",
}

export type StatusTone = "active" | "complete" | "cancelled"

export function statusTone(status: JobStatus): StatusTone {
  if (status === "Complete") return "complete"
  if (status === "Cancelled") return "cancelled"
  return "active"
}

// Pill colour classes per tone — amber for active, emerald for completed, slate/red for cancelled
export const STATUS_PILL_CLASSES: Record<StatusTone, string> = {
  active: "bg-amber-50 text-amber-700",
  complete: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-600",
}

export const ACTIVE_STATUSES: JobStatus[] = ["New", "Quoted", "Booked", "In Progress"]
export const COMPLETE_STATUSES: JobStatus[] = ["Complete", "Cancelled"]
