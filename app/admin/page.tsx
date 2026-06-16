"use client"

import { useState, useEffect, useCallback } from "react"
import {
  LayoutDashboard,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Send,
  X,
  Loader2,
  RefreshCw,
  FileText,
  CalendarCheck,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

type JobStatus = "New" | "Quoted" | "Booked" | "In Progress" | "Complete" | "Cancelled"
type FilterStatus = "all" | JobStatus

interface JobUpdate {
  id: string
  message: string
  type: "status_change" | "note"
  created_at: string
}

interface JobPhoto {
  url: string
}

interface AdminJob {
  id: string
  customer_name: string
  customer_phone: string
  customer_contact_preference: string
  address: string
  type: "issue" | "inquiry"
  category: string
  description: string
  status: JobStatus
  created_at: string
  estimated_value: number | null
  actual_value: number | null
  assigned_to: string | null
  source: string | null
  sheets_row_index: number | null
  job_photos: JobPhoto[]
  job_updates: JobUpdate[]
}

const STATUS_OPTIONS: JobStatus[] = ["New", "Quoted", "Booked", "In Progress", "Complete", "Cancelled"]

const statusConfig: Record<JobStatus, { label: string; icon: typeof AlertCircle; color: string }> = {
  "New":         { label: "New",         icon: AlertCircle,   color: "text-amber-600 bg-amber-50"      },
  "Quoted":      { label: "Quoted",      icon: FileText,      color: "text-amber-600 bg-amber-50"      },
  "Booked":      { label: "Booked",      icon: CalendarCheck, color: "text-amber-600 bg-amber-50"      },
  "In Progress": { label: "In Progress", icon: Clock,         color: "text-amber-600 bg-amber-50"      },
  "Complete":    { label: "Complete",    icon: CheckCircle,   color: "text-emerald-600 bg-emerald-50"  },
  "Cancelled":   { label: "Cancelled",   icon: XCircle,       color: "text-red-500 bg-red-50"          },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

export default function AdminDashboard() {
  const [jobs, setJobs]             = useState<AdminJob[]>([])
  const [loading, setLoading]       = useState(true)
  const [selectedJob, setSelectedJob] = useState<AdminJob | null>(null)
  const [filter, setFilter]         = useState<FilterStatus>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [newNote, setNewNote]       = useState("")
  const [saving, setSaving]         = useState(false)

  // ── Fetch all jobs ─────────────────────────────────────────
  const loadJobs = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch("/api/admin/jobs")
      const data = await res.json()
      if (data.jobs) {
        setJobs(data.jobs)
        // Refresh selected job if it's open
        if (selectedJob) {
          const refreshed = data.jobs.find((j: AdminJob) => j.id === selectedJob.id)
          if (refreshed) setSelectedJob(refreshed)
        }
      }
    } catch (err) {
      console.error("Failed to load jobs:", err)
    } finally {
      setLoading(false)
    }
  }, [selectedJob])

  useEffect(() => {
    loadJobs()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── PATCH helper ──────────────────────────────────────────
  const patchJob = async (
    jobId: string,
    payload: {
      status?: string
      assigned_to?: string
      estimated_value?: number | null
      actual_value?: number | null
      note?: string
    }
  ) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Save failed")
      await loadJobs()
    } catch (err) {
      console.error("Patch error:", err)
      alert("Failed to save. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = (jobId: string, newStatus: JobStatus) => {
    patchJob(jobId, { status: newStatus })
  }

  const handleAddNote = () => {
    if (!newNote.trim() || !selectedJob) return
    patchJob(selectedJob.id, { note: newNote.trim() })
    setNewNote("")
  }

  const handleFieldBlur = (field: "assigned_to" | "estimated_value" | "actual_value", value: string) => {
    if (!selectedJob) return
    if (field === "assigned_to") {
      patchJob(selectedJob.id, { assigned_to: value })
    } else if (field === "estimated_value") {
      patchJob(selectedJob.id, { estimated_value: value ? parseFloat(value) : null })
    } else {
      patchJob(selectedJob.id, { actual_value: value ? parseFloat(value) : null })
    }
  }

  // ── Filtered jobs ─────────────────────────────────────────
  const filteredJobs = jobs.filter((job) => {
    const matchesFilter = filter === "all" || job.status === filter
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      job.customer_name.toLowerCase().includes(q) ||
      job.category.toLowerCase().includes(q) ||
      job.address.toLowerCase().includes(q) ||
      job.description.toLowerCase().includes(q)
    return matchesFilter && matchesSearch
  })

  const stats = {
    total:      jobs.length,
    new:        jobs.filter((j) => j.status === "New").length,
    active:     jobs.filter((j) => ["Quoted", "Booked", "In Progress"].includes(j.status)).length,
    complete:   jobs.filter((j) => j.status === "Complete").length,
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#F59E0B] flex items-center justify-center">
            <span className="text-[#0F172A] font-bold text-lg">B</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Braxton Works</h1>
            <p className="text-sm text-white/60">Admin Dashboard</p>
          </div>
        </div>
        <button
          onClick={loadJobs}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg btn-secondary text-sm text-white/70 hover:text-white"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </button>
      </header>

      <div className="flex">
        <main className="flex-1 p-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Jobs",  value: stats.total,    icon: LayoutDashboard, color: "text-[#64748B] bg-[#F1F5F9]"  },
              { label: "New",         value: stats.new,      icon: AlertCircle,     color: "text-amber-600 bg-amber-50"   },
              { label: "Active",      value: stats.active,   icon: Clock,           color: "text-amber-600 bg-amber-50"   },
              { label: "Complete",    value: stats.complete, icon: CheckCircle,     color: "text-emerald-600 bg-emerald-50" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card-surface rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#0F172A]">{value}</p>
                    <p className="text-sm text-[#64748B]">{label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, category, address..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg input-field placeholder:text-[#94A3B8] focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-white/60" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterStatus)}
                className="px-3 py-2.5 rounded-lg input-field focus:outline-none"
              >
                <option value="all">All Status</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Jobs Table */}
          <div className="card-surface rounded-xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-[#64748B]">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading jobs...
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-16 text-[#64748B]">No jobs found</div>
            ) : (
              <table className="w-full">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[#64748B]">Customer</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[#64748B]">Type</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[#64748B]">Category</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[#64748B]">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[#64748B]">Date</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[#64748B]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((job) => {
                    const cfg        = statusConfig[job.status]
                    const StatusIcon = cfg.icon
                    return (
                      <tr
                        key={job.id}
                        className={cn(
                          "border-t border-[#E2E8F0] hover:bg-[#F8FAFC] cursor-pointer transition-colors",
                          selectedJob?.id === job.id && "bg-[#F1F5F9]"
                        )}
                        onClick={() => setSelectedJob(job)}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-[#0F172A]">{job.customer_name}</p>
                          <p className="text-sm text-[#64748B] truncate max-w-xs">{job.address}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-[#64748B] capitalize">{job.type}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-[#0F172A]">{job.category}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", cfg.color)}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-[#64748B]">{formatDate(job.created_at)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedJob(job) }}
                            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-[#E2E8F0] hover:bg-[#F1F5F9] transition-all text-[#0F172A]"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </main>

        {/* Job Detail Panel */}
        {selectedJob && (
          <aside className="w-96 border-l border-white/10 card-surface rounded-none p-6 overflow-y-auto max-h-[calc(100vh-73px)] sticky top-[73px]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[#0F172A]">Job Details</h2>
              <button
                onClick={() => setSelectedJob(null)}
                className="h-8 w-8 rounded-lg border border-[#E2E8F0] hover:bg-[#F1F5F9] flex items-center justify-center transition-all"
              >
                <X className="h-4 w-4 text-[#64748B]" />
              </button>
            </div>

            {/* Status */}
            <div className="mb-5">
              <label className="text-sm font-medium text-[#64748B] mb-2 block">Status</label>
              <select
                value={selectedJob.status}
                onChange={(e) => handleStatusChange(selectedJob.id, e.target.value as JobStatus)}
                disabled={saving}
                className="w-full px-3 py-2.5 rounded-lg input-field focus:outline-none"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Customer Info */}
            <div className="space-y-3 mb-5 pb-5 border-b border-[#E2E8F0]">
              <div>
                <p className="text-xs text-[#64748B] uppercase tracking-wide mb-1">Customer</p>
                <p className="font-medium text-[#0F172A]">{selectedJob.customer_name}</p>
              </div>
              <div>
                <p className="text-xs text-[#64748B] uppercase tracking-wide mb-1">Phone</p>
                <p className="font-medium text-[#0F172A]">{selectedJob.customer_phone || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[#64748B] uppercase tracking-wide mb-1">Contact preference</p>
                <p className="text-[#0F172A] capitalize">{selectedJob.customer_contact_preference || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[#64748B] uppercase tracking-wide mb-1">Address</p>
                <p className="text-[#0F172A]">{selectedJob.address}</p>
              </div>
              <div>
                <p className="text-xs text-[#64748B] uppercase tracking-wide mb-1">Description</p>
                <p className="text-[#0F172A] text-sm leading-relaxed">{selectedJob.description}</p>
              </div>
            </div>

            {/* Operational Fields */}
            <div className="space-y-3 mb-5 pb-5 border-b border-[#E2E8F0]">
              <div>
                <label className="text-xs text-[#64748B] uppercase tracking-wide mb-1 block">Assigned to</label>
                <input
                  type="text"
                  defaultValue={selectedJob.assigned_to ?? ""}
                  onBlur={(e) => handleFieldBlur("assigned_to", e.target.value)}
                  placeholder="Operative name"
                  className="w-full px-3 py-2 rounded-lg input-field placeholder:text-[#94A3B8] focus:outline-none text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#64748B] uppercase tracking-wide mb-1 block">Est. value (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={selectedJob.estimated_value ?? ""}
                    onBlur={(e) => handleFieldBlur("estimated_value", e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-lg input-field placeholder:text-[#94A3B8] focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#64748B] uppercase tracking-wide mb-1 block">Actual value (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={selectedJob.actual_value ?? ""}
                    onBlur={(e) => handleFieldBlur("actual_value", e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-lg input-field placeholder:text-[#94A3B8] focus:outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Photos */}
            {selectedJob.job_photos.length > 0 && (
              <div className="mb-5 pb-5 border-b border-[#E2E8F0]">
                <p className="text-xs text-[#64748B] uppercase tracking-wide mb-3">Photos</p>
                <div className="grid grid-cols-3 gap-2">
                  {selectedJob.job_photos.map((photo, i) => (
                    <a key={i} href={photo.url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={photo.url}
                        alt={`Photo ${i + 1}`}
                        className="aspect-square rounded-lg object-cover w-full hover:opacity-80 transition-opacity"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Notes & Updates */}
            <div>
              <h3 className="text-sm font-medium text-[#64748B] mb-3">Notes & Updates</h3>
              <div className="space-y-2 max-h-52 overflow-y-auto mb-3">
                {(selectedJob.job_updates ?? [])
                  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                  .map((update) => (
                    <div key={update.id} className="bg-[#F8FAFC] rounded-lg p-3 border border-[#E2E8F0]">
                      <p className="text-sm text-[#0F172A]">{update.message}</p>
                      <p className="text-xs text-[#64748B] mt-1">
                        {update.type === "note" ? "Note" : "System"} • {formatDate(update.created_at)}
                      </p>
                    </div>
                  ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                  placeholder="Add a note..."
                  className="flex-1 px-3 py-2 rounded-lg input-field placeholder:text-[#94A3B8] focus:outline-none text-sm"
                />
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || saving}
                  className="px-3 py-2 rounded-lg btn-primary disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
