"use client"

import { useApp } from "@/lib/app-context"
import { ArrowLeft, MapPin, Clock, CheckCircle, AlertCircle, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

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

export function JobDetailScreen({ jobId }: { jobId: string }) {
  const { jobs, setCurrentScreen, messages } = useApp()
  
  const job = jobs.find((j) => j.id === jobId)
  const jobMessages = messages.filter((m) => m.jobId === jobId)
  
  if (!job) {
    return (
      <div className="min-h-screen pb-28 flex items-center justify-center">
        <p className="text-[#64748B]">Job not found</p>
      </div>
    )
  }

  const StatusIcon = statusIcons[job.status]

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <button
          onClick={() => setCurrentScreen("jobs")}
          className="flex items-center gap-2 text-[#64748B] hover:text-[#1E1E1E] mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        
        {/* Status Badge */}
        <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4", statusColors[job.status])}>
          <StatusIcon className="h-4 w-4" />
          <span className="text-sm font-medium">{statusLabels[job.status]}</span>
        </div>
        
        <h1 className="text-xl font-semibold text-[#1E1E1E] tracking-tight">{job.category}</h1>
        <p className="text-sm text-[#64748B] mt-1">
          {job.type === "issue" ? "Issue" : "Inquiry"} - {job.date}
        </p>
      </div>

      {/* Content */}
      <div className="px-6 space-y-5">
        {/* Description */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-xs font-semibold text-[#64748B] mb-3 uppercase tracking-wide">Description</h3>
          <p className="text-[#1E1E1E] text-[15px] leading-relaxed">{job.description}</p>
        </div>

        {/* Photos */}
        {job.photos.length > 0 && (
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-[#64748B] mb-3 uppercase tracking-wide">Photos</h3>
            <div className="grid grid-cols-3 gap-2">
              {job.photos.map((photo, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden">
                  <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Address */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-xs font-semibold text-[#64748B] mb-3 uppercase tracking-wide">Address</h3>
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-[#64748B] flex-shrink-0 mt-0.5" />
            <p className="text-[#1E1E1E] text-[15px]">{job.address}</p>
          </div>
        </div>

        {/* Updates */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-xs font-semibold text-[#64748B] mb-4 uppercase tracking-wide">Updates</h3>
          <div className="space-y-4">
            {job.updates.map((update, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-[#6EC6FF] mt-2 flex-shrink-0" />
                <div>
                  <p className="text-[#1E1E1E] text-[15px]">{update.message}</p>
                  <p className="text-xs text-[#94A3B8] mt-1">{update.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message Preview */}
        {jobMessages.length > 0 && (
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Messages</h3>
              <span className="text-xs text-[#6EC6FF] font-medium">{jobMessages.length} messages</span>
            </div>
            <div className="bg-[#F1F5F8] rounded-xl p-3">
              <p className="text-sm text-[#1E1E1E] truncate">
                {jobMessages[jobMessages.length - 1].text}
              </p>
            </div>
          </div>
        )}

        {/* Message Button */}
        <button
          onClick={() => setCurrentScreen("messages")}
          className="w-full h-14 rounded-2xl glass-button font-medium flex items-center justify-center gap-2 text-[#1E1E1E] active:scale-[0.98] transition-transform"
        >
          <MessageSquare className="h-5 w-5 text-[#6EC6FF]" />
          Message Braxton
        </button>
      </div>
    </div>
  )
}
