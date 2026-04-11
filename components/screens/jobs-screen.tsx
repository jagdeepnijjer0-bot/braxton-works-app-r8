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
  "in-progress": "text-[#6EC6FF] bg-[#E3F3FF]",
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
                activeTab === tab
                  ? "bg-white text-[#1E1E1E] shadow-sm"
                  : "text-[#64748B]"
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
          <div className="text-center py-16">
            <p className="text-[#64748B]">No {activeTab} jobs</p>
          </div>
        ) : (
          filteredJobs.map((job) => {
            const StatusIcon = statusIcons[job.status]
            return (
              <button
                key={job.id}
                onClick={() => setCurrentScreen(`job-${job.id}`)}
                className="w-full glass-card rounded-2xl p-5 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
              >
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", statusColors[job.status])}>
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
                    <span className={cn("text-xs font-medium", statusColors[job.status].split(" ")[0])}>
                      {statusLabels[job.status]}
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
