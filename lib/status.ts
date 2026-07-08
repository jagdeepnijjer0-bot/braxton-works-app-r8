// New journey-based status system
// DB values changed from legacy (New/Quoted/Booked/In Progress/Complete/Cancelled)
// to the customer-facing journey names used in the mobile app.

export type JobStatus =
  | "Enquiry Received"
  | "Assigning Contractor"
  | "Contractor Assigned"
  | "Quote Ready"
  | "Job Underway"
  | "Job Completed"
  | "Cancelled"

export const JOURNEY_STEPS: JobStatus[] = [
  "Enquiry Received",
  "Assigning Contractor",
  "Contractor Assigned",
  "Quote Ready",
  "Job Underway",
  "Job Completed",
]

export function nextStatus(current: JobStatus): JobStatus | null {
  const idx = JOURNEY_STEPS.indexOf(current)
  if (idx === -1 || idx === JOURNEY_STEPS.length - 1) return null
  return JOURNEY_STEPS[idx + 1]
}

export type StatusTone = "active" | "complete" | "cancelled"

export function statusTone(status: JobStatus): StatusTone {
  if (status === "Job Completed") return "complete"
  if (status === "Cancelled")     return "cancelled"
  return "active"
}

export const STATUS_PILL_CLASSES: Record<StatusTone, string> = {
  active:    "bg-amber-50 text-amber-700",
  complete:  "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-600",
}

export const ACTIVE_STATUSES: JobStatus[] = [
  "Enquiry Received", "Assigning Contractor", "Contractor Assigned",
  "Quote Ready", "Job Underway",
]
export const COMPLETE_STATUSES: JobStatus[] = ["Job Completed", "Cancelled"]
