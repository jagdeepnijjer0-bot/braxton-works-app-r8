"use client"

import { useState, useEffect } from "react"
import { useApp, Job, JobStatus } from "@/lib/app-context"
import { ChevronRight, Clock, CheckCircle, AlertCircle, XCircle, CalendarCheck, FileText, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"
import { STATUS_DISPLAY, STATUS_PILL_CLASSES, statusTone, ACTIVE_STATUSES, COMPLETE_STATUSES } from "@/lib/status"

type TabType = "active" | "completed"

const statusIcons: Record<JobStatus, typeof AlertCircle> = {
  "New":         AlertCircle,
  "Quoted":      FileText,
  "Booked":      CalendarCheck,
  "In Progress": Clock,
  "Complete":    CheckCircle,
  "Cancelled":   XCircle,
}

function mapApiJobToJob(raw: Record<string, unknown>): Job {
  const photos = ((raw.job_photos as { url: string }[]) ?? []).map((p) => p.url)
  const updates = ((raw.job_updates as { message: string; created_at: string; type: string }[]) ?? [])
    .map((u) => ({ message: u.message, created_at: u.created_at, type: u.type as "status_change" | "note" }))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  return {
    id:          raw.id as string,
    type:        raw.type as "issue" | "inquiry",
    category:    raw.category as string,
    description: raw.description as string,
    address:     raw.address as string,
    status:      (raw.status as JobStatus) ?? "New",
    date:        (raw.created_at as string).split("T")[0],
    photos,
    updates,
  }
}

export function JobsScreen() {
  const { jobs, setJobs, setCurrentScreen, isAuthenticated } = useApp()
  const [activeTab, setActiveTab] = useState<TabType>("active")
  const [loading, setLoading]     = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return

    setLoading(true)
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((data) => {
        if (data.jobs) {
          setJobs(data.jobs.map(mapApiJobToJob))
        }
      })
      .catch((err) => console.error("Failed to load jobs:", err))
      .finally(() => setLoading(false))
  }, [isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredJobs = jobs.filter((job) =>
    activeTab === "active"
      ? ACTIVE_STATUSES.includes(job.status)
      : COMPLETE_STATUSES.includes(job.status)
  )

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="px-6 pt-14 pb-6">
        <h1 className="text-2xl font-semibold text-white tracking-tight">My Jobs</h1>
      </div>

      {/* Tabs */}
      <div className="px-6 mb-6">
        <div className="flex card-surface rounded-xl p-1">
          {(["active", "completed"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                activeTab === tab ? "bg-[#F59E0B] text-[#0F172A]" : "text-[#64748B]"
              )}
            >
              {tab === "active" ? "Active" : "Completed"}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs List */}
      <div className="px-6 space-y-3">
        {loading ? (
          <div className="text-center py-16">
            <p className="text-white/60">Loading jobs...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="card-surface rounded-3xl p-8 text-center">
            <div className="h-14 w-14 rounded-2xl bg-[#F59E0B]/15 flex items-center justify-center mx-auto mb-5">
              <Wrench className="h-6 w-6 text-[#F59E0B]" />
            </div>
            <p className="text-[#0F172A] font-medium mb-6">
              {activeTab === "active"
                ? "Nothing booked yet — got something that needs fixing?"
                : "No completed jobs yet."}
            </p>
            <button
              onClick={() => setCurrentScreen("inquiry-type")}
              className="w-full h-12 rounded-xl btn-primary"
            >
              Start an Inquiry
            </button>
          </div>
        ) : (
          filteredJobs.map((job) => {
            const tone       = statusTone(job.status)
            const StatusIcon = statusIcons[job.status] ?? AlertCircle
            const pillClass  = STATUS_PILL_CLASSES[tone]
            return (
              <button
                key={job.id}
                onClick={() => setCurrentScreen(`job-${job.id}`)}
                className="w-full card-surface rounded-2xl p-5 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
              >
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", pillClass)}>
                  <StatusIcon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-[#64748B] uppercase tracking-wide">
                      {job.type === "issue" ? "Issue" : "Inquiry"}
                    </span>
                    <span className="text-xs text-[#94A3B8]">•</span>
                    <span className="text-xs text-[#64748B]">{job.category}</span>
                  </div>
                  <p className="text-[#0F172A] font-medium truncate text-[15px]">{job.description}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", pillClass)}>
                      {STATUS_DISPLAY[job.status]}
                    </span>
                    <span className="text-xs text-[#94A3B8]">• {job.date}</span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-[#94A3B8] flex-shrink-0" />
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
