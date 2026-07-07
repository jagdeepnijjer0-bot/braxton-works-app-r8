export type JobStatus =
  | "New"
  | "Quoted"
  | "Booked"
  | "In Progress"
  | "Complete"
  | "Cancelled"

export const STATUS_DISPLAY: Record<JobStatus, string> = {
  "New":         "Submitted",
  "Quoted":      "Under Review",
  "Booked":      "Contractor Assigned",
  "In Progress": "In Progress",
  "Complete":    "Completed",
  "Cancelled":   "Cancelled",
}

export type StatusTone = "active" | "complete" | "cancelled"

export function statusTone(status: JobStatus): StatusTone {
  if (status === "Complete")  return "complete"
  if (status === "Cancelled") return "cancelled"
  return "active"
}

export const STATUS_PILL_COLORS: Record<StatusTone, { bg: string; text: string }> = {
  active:    { bg: "#FEF3C7", text: "#92400E" },
  complete:  { bg: "#D1FAE5", text: "#065F46" },
  cancelled: { bg: "#FEE2E2", text: "#991B1B" },
}

export const ACTIVE_STATUSES:   JobStatus[] = ["New", "Quoted", "Booked", "In Progress"]
export const COMPLETE_STATUSES: JobStatus[] = ["Complete", "Cancelled"]
