"use client"

import { useState, useEffect } from "react"
import { useApp, Job, JobStatus } from "@/lib/app-context"
import { ChevronRight, Clock, CheckCircle, AlertCircle, XCircle, CalendarCheck, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

type TabType = "active" | "completed"

const ACTIVE_STATUSES:   JobStatus[] = ["New", "Quoted", "Booked", "In Progress"]
const COMPLETE_STATUSES: JobStatus[] = ["Complete", "Cancelled"]

const statusConfig: Record<JobStatus, { icon: typeof AlertCircle; color: string; label: string }> = {
  "New":         { icon: AlertCircle,   color: "text-amber-500 bg-amber-50",        label: "New"         },
  "Quoted":      { icon: FileText,      color: "text-purple-500 bg-purple-50",      label: "Quoted"      },
  "Booked":      { icon: CalendarCheck, color: "text-blue-500 bg-blue-50",          label: "Booked"      },
  "In Progress": { icon: Clock,         color: "text-[#6EC6FF] bg-[#E3F3FF]",       label: "In Progress" },
  "Complete":    { icon: CheckCircle,   color: "text-emerald-500 bg-emerald-50",    label: "Complete"    },
  "Cancelled":   { icon: XCircle,       color: "text-slate-400 bg-slate-100",       label: "Cancelled"   },
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
        <h1 className="text-2xl font-semibold text-[#1E1E1E] tracking-tight">My Jobs</h1>
      </div>

      {/* Tabs */}
      <div className="px-6 mb-6">
        <div className="flex glass-card rounded-xl p-1">
          {(["active", "completed"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                activeTab === tab ? "bg-white text-[#1E1E1E] shadow-sm" : "text-[#64748B]"
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
            <p className="text-[#64748B]">Loading jobs...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#64748B]">No {activeTab} jobs</p>
          </div>
        ) : (
          filteredJobs.map((job) => {
            const cfg        = statusConfig[job.status] ?? statusConfig["New"]
            const StatusIcon = cfg.icon
            return (
              <button
                key={job.id}
                onClick={() => setCurrentScreen(`job-${job.id}`)}
                className="w-full glass-card rounded-2xl p-5 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
              >
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", cfg.color)}>
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
                  <p className="text-[#1E1E1E] font-medium truncate text-[15px]">{job.description}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={cn("text-xs font-medium", cfg.color.split(" ")[0])}>
                      {cfg.label}
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
