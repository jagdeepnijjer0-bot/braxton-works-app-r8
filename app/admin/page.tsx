"use client"

import { useState } from "react"
import { 
  LayoutDashboard, 
  Briefcase, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Search,
  Filter,
  ChevronDown,
  Send,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type JobStatus = "pending" | "in-progress" | "completed"
type FilterStatus = "all" | JobStatus

interface AdminJob {
  id: string
  customer: string
  phone: string
  address: string
  type: "issue" | "inquiry"
  category: string
  description: string
  status: JobStatus
  date: string
  notes: { date: string; text: string; author: string }[]
}

const mockJobs: AdminJob[] = [
  {
    id: "1",
    customer: "John Smith",
    phone: "07123 456789",
    address: "123 Main Street, London SW1A 1AA",
    type: "issue",
    category: "Plumbing",
    description: "Leaking tap in kitchen, water dripping constantly",
    status: "in-progress",
    date: "2026-04-07",
    notes: [
      { date: "2026-04-07 09:00", text: "Inquiry received via app", author: "System" },
      { date: "2026-04-07 10:30", text: "Assigned to Mike (Plumber)", author: "Admin" },
      { date: "2026-04-08 11:00", text: "Scheduled for tomorrow morning", author: "Mike" },
    ],
  },
  {
    id: "2",
    customer: "Sarah Johnson",
    phone: "07987 654321",
    address: "45 Oak Avenue, Manchester M1 2AB",
    type: "inquiry",
    category: "Kitchen",
    description: "Full kitchen renovation - new cabinets, countertops, and appliances",
    status: "pending",
    date: "2026-04-05",
    notes: [
      { date: "2026-04-05 14:00", text: "Inquiry received via app", author: "System" },
    ],
  },
  {
    id: "3",
    customer: "David Brown",
    phone: "07555 123456",
    address: "78 High Street, Birmingham B1 3CD",
    type: "issue",
    category: "Electrical",
    description: "Power outlet not working in living room",
    status: "completed",
    date: "2026-04-02",
    notes: [
      { date: "2026-04-02 08:00", text: "Inquiry received via app", author: "System" },
      { date: "2026-04-02 09:30", text: "Assigned to Tom (Electrician)", author: "Admin" },
      { date: "2026-04-03 15:00", text: "Fixed - faulty socket replaced", author: "Tom" },
    ],
  },
  {
    id: "4",
    customer: "Emma Wilson",
    phone: "07444 999888",
    address: "12 Park Lane, Leeds LS1 4EF",
    type: "inquiry",
    category: "Bathroom",
    description: "Bathroom refurbishment quote needed",
    status: "pending",
    date: "2026-04-08",
    notes: [
      { date: "2026-04-08 16:00", text: "Inquiry received via app", author: "System" },
    ],
  },
]

const statusConfig = {
  pending: { label: "Pending", icon: AlertCircle, color: "text-amber-500 bg-amber-50" },
  "in-progress": { label: "In Progress", icon: Clock, color: "text-primary bg-primary/10" },
  completed: { label: "Completed", icon: CheckCircle, color: "text-emerald-500 bg-emerald-50" },
}

export default function AdminDashboard() {
  const [jobs, setJobs] = useState(mockJobs)
  const [selectedJob, setSelectedJob] = useState<AdminJob | null>(null)
  const [filter, setFilter] = useState<FilterStatus>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [newNote, setNewNote] = useState("")

  const filteredJobs = jobs.filter((job) => {
    const matchesFilter = filter === "all" || job.status === filter
    const matchesSearch = 
      job.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.address.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const stats = {
    total: jobs.length,
    pending: jobs.filter((j) => j.status === "pending").length,
    inProgress: jobs.filter((j) => j.status === "in-progress").length,
    completed: jobs.filter((j) => j.status === "completed").length,
  }

  const updateJobStatus = (jobId: string, newStatus: JobStatus) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId ? { ...job, status: newStatus } : job
      )
    )
    if (selectedJob?.id === jobId) {
      setSelectedJob((prev) => prev ? { ...prev, status: newStatus } : null)
    }
  }

  const addNote = () => {
    if (!newNote.trim() || !selectedJob) return
    const note = {
      date: new Date().toISOString().slice(0, 16).replace("T", " "),
      text: newNote,
      author: "Admin",
    }
    setJobs((prev) =>
      prev.map((job) =>
        job.id === selectedJob.id
          ? { ...job, notes: [...job.notes, note] }
          : job
      )
    )
    setSelectedJob((prev) =>
      prev ? { ...prev, notes: [...prev.notes, note] } : null
    )
    setNewNote("")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">B</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Braxton Works</h1>
            <p className="text-sm text-muted-foreground">Admin Dashboard</p>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar / Main Content */}
        <main className="flex-1 p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Jobs</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.inProgress}</p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterStatus)}
                className="px-3 py-2.5 rounded-lg border border-input bg-background text-foreground focus:border-primary focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Jobs Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Customer</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Category</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => {
                  const StatusIcon = statusConfig[job.status].icon
                  return (
                    <tr
                      key={job.id}
                      className={cn(
                        "border-t border-border hover:bg-muted/30 cursor-pointer transition-colors",
                        selectedJob?.id === job.id && "bg-muted/50"
                      )}
                      onClick={() => setSelectedJob(job)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{job.customer}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-xs">{job.address}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground capitalize">{job.type}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-foreground">{job.category}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", statusConfig[job.status].color)}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {statusConfig[job.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">{job.date}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedJob(job)
                          }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </main>

        {/* Job Detail Panel */}
        {selectedJob && (
          <aside className="w-96 border-l border-border bg-card p-6 overflow-y-auto max-h-[calc(100vh-73px)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Job Details</h2>
              <button
                onClick={() => setSelectedJob(null)}
                className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Status Update */}
            <div className="mb-6">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Status</label>
              <select
                value={selectedJob.status}
                onChange={(e) => updateJobStatus(selectedJob.id, e.target.value as JobStatus)}
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground focus:border-primary focus:outline-none"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Customer Info */}
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium text-foreground">{selectedJob.customer}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium text-foreground">{selectedJob.phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium text-foreground">{selectedJob.address}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-foreground">{selectedJob.description}</p>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Notes & Updates</h3>
              <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
                {selectedJob.notes.map((note, i) => (
                  <div key={i} className="bg-muted rounded-lg p-3">
                    <p className="text-sm text-foreground">{note.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {note.author} • {note.date}
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Add Note */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addNote()}
                  placeholder="Add a note..."
                  className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none text-sm"
                />
                <Button size="sm" onClick={addNote} disabled={!newNote.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
