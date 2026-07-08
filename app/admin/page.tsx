"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  LayoutDashboard, Clock, CheckCircle, AlertCircle, Search, Filter,
  Send, X, Loader2, RefreshCw, ChevronRight, MessageSquare, ArrowRight,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@supabase/supabase-js"
import { JOURNEY_STEPS, nextStatus, statusTone, STATUS_PILL_CLASSES, type JobStatus } from "@/lib/status"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type FilterStatus = "all" | JobStatus

interface JobUpdate { id: string; message: string; type: "status_change" | "note"; created_at: string }
interface JobPhoto  { url: string }
interface Message   { id: string; body: string; sender: "user" | "contractor"; created_at: string }

interface AdminJob {
  id: string
  customer_name: string
  customer_phone: string
  customer_contact_preference: string
  address: string
  type: "issue" | "enquiry" | "inquiry"
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
  unread?: boolean
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}
function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) +
    ", " + d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

export default function AdminDashboard() {
  const [jobs, setJobs]               = useState<AdminJob[]>([])
  const [loading, setLoading]         = useState(true)
  const [selectedJob, setSelectedJob] = useState<AdminJob | null>(null)
  const [filter, setFilter]           = useState<FilterStatus>("all")
  const [search, setSearch]           = useState("")
  const [saving, setSaving]           = useState(false)
  const [activePanel, setActivePanel] = useState<"details" | "messages">("details")

  // Messaging
  const [messages, setMessages] = useState<Message[]>([])
  const [msgLoading, setMsgLoading] = useState(false)
  const [draft, setDraft]           = useState("")
  const [unreadMap, setUnreadMap]   = useState<Record<string, boolean>>({})
  const msgEndRef = useRef<HTMLDivElement>(null)

  const loadJobs = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch("/api/admin/jobs")
      const data = await res.json()
      if (data.jobs) {
        setJobs(data.jobs)
        if (selectedJob) {
          const refreshed = data.jobs.find((j: AdminJob) => j.id === selectedJob.id)
          if (refreshed) setSelectedJob(refreshed)
        }
      }
    } catch { /* non-fatal */ }
    finally { setLoading(false) }
  }, [selectedJob])

  useEffect(() => { loadJobs() }, []) // eslint-disable-line

  // Load messages + subscribe to realtime when panel open
  useEffect(() => {
    if (!selectedJob || activePanel !== "messages") return
    let channel: ReturnType<typeof supabase.channel>

    const load = async () => {
      setMsgLoading(true)
      const { data } = await supabase
        .from("messages")
        .select("id, body, sender, created_at")
        .eq("job_id", selectedJob.id)
        .order("created_at", { ascending: true })
      setMessages((data ?? []) as Message[])
      setMsgLoading(false)
      // Mark read
      setUnreadMap((m) => ({ ...m, [selectedJob.id]: false }))
      setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    }

    load()

    channel = supabase
      .channel(`admin-messages:${selectedJob.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `job_id=eq.${selectedJob.id}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message])
        setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedJob?.id, activePanel])

  // Global realtime subscription to detect new customer messages
  useEffect(() => {
    const channel = supabase
      .channel("admin-unread")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
      }, (payload) => {
        const msg = payload.new as Message & { job_id: string }
        if (msg.sender === "user") {
          setUnreadMap((m) => ({ ...m, [msg.job_id]: true }))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const patchJob = async (jobId: string, payload: {
    status?: string; assigned_to?: string;
    estimated_value?: number | null; actual_value?: number | null; note?: string
  }) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      await loadJobs()
    } catch {
      alert("Failed to save. Please try again.")
    } finally { setSaving(false) }
  }

  const advanceStatus = () => {
    if (!selectedJob) return
    const next = nextStatus(selectedJob.status)
    if (next) patchJob(selectedJob.id, { status: next })
  }

  const sendMessage = async () => {
    const body = draft.trim()
    if (!body || !selectedJob) return
    setDraft("")
    const optimistic: Message = { id: `opt-${Date.now()}`, body, sender: "contractor", created_at: new Date().toISOString() }
    setMessages((prev) => [...prev, optimistic])
    await supabase.from("messages").insert({ job_id: selectedJob.id, body, sender: "contractor" })
    setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
  }

  const filteredJobs = jobs.filter((j) => {
    const ok = filter === "all" || j.status === filter
    const q  = search.toLowerCase()
    return ok && (
      j.customer_name.toLowerCase().includes(q) ||
      j.category.toLowerCase().includes(q) ||
      j.address.toLowerCase().includes(q) ||
      j.description.toLowerCase().includes(q)
    )
  })

  const stats = {
    total:    jobs.length,
    new:      jobs.filter((j) => j.status === "Enquiry Received").length,
    active:   jobs.filter((j) => ["Assigning Contractor","Contractor Assigned","Quote Ready","Job Underway"].includes(j.status)).length,
    complete: jobs.filter((j) => j.status === "Job Completed").length,
  }

  const tone    = selectedJob ? statusTone(selectedJob.status) : "active"
  const pillCls = selectedJob ? STATUS_PILL_CLASSES[tone] : ""
  const canAdvance = selectedJob && nextStatus(selectedJob.status) !== null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#F59E0B] flex items-center justify-center">
            <span className="text-[#0F172A] font-bold text-lg">B</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Build.me</h1>
            <p className="text-sm text-white/60">Admin Dashboard</p>
          </div>
        </div>
        <button onClick={loadJobs} disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg btn-secondary text-sm text-white/70 hover:text-white">
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </button>
      </header>

      <div className="flex">
        <main className="flex-1 p-6 min-w-0">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total", value: stats.total,    color: "text-[#64748B] bg-[#F1F5F9]",   icon: LayoutDashboard },
              { label: "New",   value: stats.new,      color: "text-amber-600 bg-amber-50",     icon: AlertCircle     },
              { label: "Active",value: stats.active,   color: "text-amber-600 bg-amber-50",     icon: Clock           },
              { label: "Done",  value: stats.complete, color: "text-emerald-600 bg-emerald-50", icon: CheckCircle     },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="card-surface rounded-xl p-4 flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#0F172A]">{value}</p>
                  <p className="text-sm text-[#64748B]">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Search + filter */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, category, address…"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg input-field placeholder:text-[#94A3B8] focus:outline-none" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-white/60" />
              <select value={filter} onChange={(e) => setFilter(e.target.value as FilterStatus)}
                className="px-3 py-2.5 rounded-lg input-field focus:outline-none">
                <option value="all">All statuses</option>
                {JOURNEY_STEPS.map((s) => <option key={s} value={s}>{s}</option>)}
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="card-surface rounded-xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-[#64748B]">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading…
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-16 text-[#64748B]">No jobs found</div>
            ) : (
              <table className="w-full">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    {["Customer","Type","Category","Status","Date",""].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-sm font-medium text-[#64748B]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((job) => {
                    const t    = statusTone(job.status)
                    const cls  = STATUS_PILL_CLASSES[t]
                    const hasUnread = unreadMap[job.id]
                    return (
                      <tr key={job.id}
                        className={cn("border-t border-[#E2E8F0] hover:bg-[#F8FAFC] cursor-pointer transition-colors",
                          selectedJob?.id === job.id && "bg-[#F1F5F9]")}
                        onClick={() => { setSelectedJob(job); setActivePanel("details") }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {hasUnread && <span className="h-2 w-2 rounded-full bg-[#F59E0B] flex-shrink-0" />}
                            <div>
                              <p className="font-medium text-[#0F172A]">{job.customer_name}</p>
                              <p className="text-sm text-[#64748B] truncate max-w-[160px]">{job.address}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#64748B] capitalize">{job.type}</td>
                        <td className="px-4 py-3 text-sm text-[#0F172A]">{job.category}</td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex px-2.5 py-1 rounded-full text-xs font-medium", cls)}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#64748B]">{formatDate(job.created_at)}</td>
                        <td className="px-4 py-3">
                          <button onClick={(e) => { e.stopPropagation(); setSelectedJob(job); setActivePanel("details") }}
                            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-[#E2E8F0] hover:bg-[#F1F5F9] transition-all text-[#0F172A]">
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

        {/* Detail panel */}
        {selectedJob && (
          <aside className="w-[400px] border-l border-white/10 card-surface rounded-none overflow-y-auto max-h-[calc(100vh-73px)] sticky top-[73px] flex flex-col">
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
              <div className="flex gap-1">
                {(["details", "messages"] as const).map((p) => (
                  <button key={p} onClick={() => setActivePanel(p)}
                    className={cn("px-3 py-1.5 rounded-lg text-sm font-medium relative transition-colors",
                      activePanel === p
                        ? "bg-[#0F172A] text-white"
                        : "text-[#64748B] hover:text-[#0F172A]")}>
                    {p === "messages" ? "Messages" : "Details"}
                    {p === "messages" && unreadMap[selectedJob.id] && (
                      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#F59E0B]" />
                    )}
                  </button>
                ))}
              </div>
              <button onClick={() => setSelectedJob(null)}
                className="h-8 w-8 rounded-lg border border-[#E2E8F0] hover:bg-[#F1F5F9] flex items-center justify-center">
                <X className="h-4 w-4 text-[#64748B]" />
              </button>
            </div>

            {activePanel === "details" ? (
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Status journey */}
                <div>
                  <p className="text-xs font-medium text-[#64748B] uppercase tracking-wide mb-3">Status Journey</p>
                  <div className="space-y-0">
                    {JOURNEY_STEPS.map((step, i) => {
                      const current = JOURNEY_STEPS.indexOf(selectedJob.status)
                      const isDone  = i < current
                      const isNow   = i === current
                      const isLast  = i === JOURNEY_STEPS.length - 1
                      return (
                        <div key={step} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={cn(
                              "h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs",
                              isDone ? "bg-[#F59E0B]" : isNow ? "bg-[#F59E0B] ring-4 ring-amber-100" : "bg-[#E2E8F0]"
                            )}>
                              {isDone
                                ? <Check className="h-3 w-3 text-[#0F172A]" />
                                : <span className={cn("text-xs font-bold", isNow ? "text-[#0F172A]" : "text-[#94A3B8]")}>{i+1}</span>
                              }
                            </div>
                            {!isLast && <div className={cn("w-0.5 h-5 mt-0.5", isDone ? "bg-[#F59E0B]" : "bg-[#E2E8F0]")} />}
                          </div>
                          <p className={cn("text-sm pb-4 pt-0.5",
                            isDone ? "text-[#0F172A] font-medium" : isNow ? "text-[#0F172A] font-bold" : "text-[#94A3B8]")}>
                            {step}
                          </p>
                        </div>
                      )
                    })}
                  </div>

                  {/* Advance button */}
                  {canAdvance && (
                    <button onClick={advanceStatus} disabled={saving}
                      className="w-full mt-2 py-2.5 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-[#0F172A] font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                      Advance to: {nextStatus(selectedJob.status)}
                    </button>
                  )}
                  {!canAdvance && selectedJob.status !== "Cancelled" && (
                    <div className="mt-2 py-2.5 px-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium text-center">
                      ✓ Job Completed
                    </div>
                  )}
                </div>

                <div className="border-t border-[#E2E8F0]" />

                {/* Customer info */}
                <div className="space-y-3">
                  {[
                    { label: "Customer",  value: selectedJob.customer_name },
                    { label: "Phone",     value: selectedJob.customer_phone || "—" },
                    { label: "Contact",   value: selectedJob.customer_contact_preference || "—" },
                    { label: "Address",   value: selectedJob.address },
                    { label: "Category",  value: selectedJob.category },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-[#64748B] uppercase tracking-wide mb-0.5">{label}</p>
                      <p className="text-sm font-medium text-[#0F172A]">{value}</p>
                    </div>
                  ))}
                  <div>
                    <p className="text-xs text-[#64748B] uppercase tracking-wide mb-0.5">Description</p>
                    <p className="text-sm text-[#0F172A] leading-relaxed">{selectedJob.description}</p>
                  </div>
                </div>

                <div className="border-t border-[#E2E8F0]" />

                {/* Ops fields */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-[#64748B] uppercase tracking-wide mb-1 block">Assigned to</label>
                    <input type="text" defaultValue={selectedJob.assigned_to ?? ""}
                      onBlur={(e) => patchJob(selectedJob.id, { assigned_to: e.target.value })}
                      placeholder="Operative name"
                      className="w-full px-3 py-2 rounded-lg input-field placeholder:text-[#94A3B8] focus:outline-none text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[#64748B] uppercase tracking-wide mb-1 block">Est. (£)</label>
                      <input type="number" step="0.01" defaultValue={selectedJob.estimated_value ?? ""}
                        onBlur={(e) => patchJob(selectedJob.id, { estimated_value: e.target.value ? parseFloat(e.target.value) : null })}
                        placeholder="0.00"
                        className="w-full px-3 py-2 rounded-lg input-field placeholder:text-[#94A3B8] focus:outline-none text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-[#64748B] uppercase tracking-wide mb-1 block">Actual (£)</label>
                      <input type="number" step="0.01" defaultValue={selectedJob.actual_value ?? ""}
                        onBlur={(e) => patchJob(selectedJob.id, { actual_value: e.target.value ? parseFloat(e.target.value) : null })}
                        placeholder="0.00"
                        className="w-full px-3 py-2 rounded-lg input-field placeholder:text-[#94A3B8] focus:outline-none text-sm" />
                    </div>
                  </div>
                </div>

                {/* Photos */}
                {selectedJob.job_photos.length > 0 && (
                  <>
                    <div className="border-t border-[#E2E8F0]" />
                    <div>
                      <p className="text-xs text-[#64748B] uppercase tracking-wide mb-3">Photos</p>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedJob.job_photos.map((photo, i) => (
                          <a key={i} href={photo.url} target="_blank" rel="noopener noreferrer">
                            <img src={photo.url} alt="" className="aspect-square rounded-lg object-cover w-full hover:opacity-80 transition-opacity" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Notes */}
                <div className="border-t border-[#E2E8F0]" />
                <div>
                  <p className="text-xs text-[#64748B] uppercase tracking-wide mb-3">Internal Notes</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                    {(selectedJob.job_updates ?? [])
                      .filter((u) => u.type === "note")
                      .sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                      .map((u) => (
                        <div key={u.id} className="bg-[#F8FAFC] rounded-lg p-3 border border-[#E2E8F0]">
                          <p className="text-sm text-[#0F172A]">{u.message}</p>
                          <p className="text-xs text-[#64748B] mt-1">{formatDate(u.created_at)}</p>
                        </div>
                      ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" id="note-input" placeholder="Add a note…"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const v = (e.target as HTMLInputElement).value.trim()
                          if (v) { patchJob(selectedJob.id, { note: v }); (e.target as HTMLInputElement).value = "" }
                        }
                      }}
                      className="flex-1 px-3 py-2 rounded-lg input-field placeholder:text-[#94A3B8] focus:outline-none text-sm" />
                    <button
                      onClick={() => {
                        const el = document.getElementById("note-input") as HTMLInputElement
                        if (el?.value.trim()) { patchJob(selectedJob.id, { note: el.value.trim() }); el.value = "" }
                      }}
                      disabled={saving}
                      className="px-3 py-2 rounded-lg btn-primary disabled:cursor-not-allowed">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Messages panel */
              <div className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {msgLoading
                    ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-[#64748B]" /></div>
                    : messages.length === 0
                      ? <p className="text-center text-sm text-[#64748B] py-8">No messages yet.</p>
                      : messages.map((msg) => {
                          const isUs = msg.sender === "contractor"
                          return (
                            <div key={msg.id} className={cn("flex", isUs ? "justify-end" : "justify-start")}>
                              <div className={cn("max-w-[78%] rounded-2xl px-4 py-2.5",
                                isUs ? "bg-[#F59E0B] rounded-br-sm" : "bg-[#F1F5F9] rounded-bl-sm")}>
                                <p className={cn("text-sm", isUs ? "text-[#0F172A] font-medium" : "text-[#0F172A]")}>
                                  {msg.body}
                                </p>
                                <p className={cn("text-xs mt-1", isUs ? "text-[#0F172A]/60 text-right" : "text-[#64748B]")}>
                                  {formatTime(msg.created_at)}
                                </p>
                              </div>
                            </div>
                          )
                        })
                  }
                  <div ref={msgEndRef} />
                </div>
                <div className="border-t border-[#E2E8F0] p-3 flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder="Reply to customer…"
                    className="flex-1 px-3 py-2 rounded-lg input-field placeholder:text-[#94A3B8] focus:outline-none text-sm" />
                  <button onClick={sendMessage} disabled={!draft.trim() || saving}
                    className="px-3 py-2 rounded-lg btn-primary disabled:cursor-not-allowed disabled:opacity-50">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}
