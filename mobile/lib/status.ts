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

export function stepIndex(status: JobStatus): number {
  return JOURNEY_STEPS.indexOf(status)
}

export type StatusTone = "active" | "complete" | "cancelled"

export function statusTone(status: JobStatus): StatusTone {
  if (status === "Job Completed") return "complete"
  if (status === "Cancelled")     return "cancelled"
  return "active"
}

export const STATUS_PILL_COLORS: Record<StatusTone, { bg: string; text: string }> = {
  active:    { bg: "#FEF3C7", text: "#92400E" },
  complete:  { bg: "#D1FAE5", text: "#065F46" },
  cancelled: { bg: "#FEE2E2", text: "#991B1B" },
}

export const ACTIVE_STATUSES:   JobStatus[] = [
  "Enquiry Received", "Assigning Contractor", "Contractor Assigned",
  "Quote Ready", "Job Underway",
]
export const COMPLETE_STATUSES: JobStatus[] = ["Job Completed", "Cancelled"]
