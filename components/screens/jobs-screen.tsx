"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { ChevronRight, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type TabType = "active" | "completed"

const statusIcons = {
  pending: AlertCircle,
  "in-progress": Clock,
  completed: CheckCircle,
}

const statusColors = {
  pending: "text-amber-500 bg-amber-50",
  "in-progress": "text-primary bg-primary/10",
  completed: "text-emerald-500 bg-emerald-50",
}

const statusLabels = {
  pending: "Pending",
  "in-progress": "In Progress",
  completed: "Completed",
}

export function JobsScreen() {
  const { jobs, setCurrentScreen } = useApp()
  const [activeTab, setActiveTab] = useState<TabType>("active")

  const filteredJobs = jobs.filter((job) =>
    activeTab === "active" ? job.status !== "completed" : job.status === "completed"
  )

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-foreground">My Jobs</h1>
      </div>

      {/* Tabs */}
      <div className="px-6 mb-4">
        <div className="flex bg-muted rounded-xl p-1">
          {(["active", "completed"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-2.5 text-sm font-medium rounded-lg transition-all",
                activeTab === tab
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              {tab === "active" ? "Active" : "Completed"}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs List */}
      <div className="px-6 space-y-3">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No {activeTab} jobs</p>
          </div>
        ) : (
          filteredJobs.map((job) => {
            const StatusIcon = statusIcons[job.status]
            return (
              <button
                key={job.id}
                onClick={() => setCurrentScreen(`job-${job.id}`)}
                className="w-full bg-card rounded-2xl border border-border p-4 flex items-center gap-4 text-left hover:border-primary/50 transition-colors"
              >
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", statusColors[job.status])}>
                  <StatusIcon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      {job.type === "issue" ? "Issue" : "Inquiry"}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{job.category}</span>
                  </div>
                  <p className="text-foreground font-medium truncate">{job.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("text-xs font-medium", statusColors[job.status].split(" ")[0])}>
                      {statusLabels[job.status]}
                    </span>
                    <span className="text-xs text-muted-foreground">• {job.date}</span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
