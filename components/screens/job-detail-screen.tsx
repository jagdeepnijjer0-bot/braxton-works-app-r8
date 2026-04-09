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
  "in-progress": "text-[#6CB4EE] bg-[#E8F4FD]",
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
      <div className="min-h-screen pb-24 flex items-center justify-center">
        <p className="text-[#5A6A7A]">Job not found</p>
      </div>
    )
  }

  const StatusIcon = statusIcons[job.status]

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <button
          onClick={() => setCurrentScreen("jobs")}
          className="flex items-center gap-2 text-[#5A6A7A] mb-6 hover:text-[#1E1E1E] transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        
        {/* Status Badge */}
        <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4", statusColors[job.status])}>
          <StatusIcon className="h-4 w-4" />
          <span className="text-sm font-medium">{statusLabels[job.status]}</span>
        </div>
        
        <h1 className="text-xl font-bold text-[#1E1E1E]">{job.category}</h1>
        <p className="text-sm text-[#5A6A7A] mt-1">
          {job.type === "issue" ? "Issue" : "Inquiry"} - {job.date}
        </p>
      </div>

      {/* Content */}
      <div className="px-6 space-y-6">
        {/* Description */}
        <div className="bg-white rounded-2xl border border-[#E8ECF0] p-4 shadow-sm">
          <h3 className="text-sm font-medium text-[#5A6A7A] mb-2">Description</h3>
          <p className="text-[#1E1E1E]">{job.description}</p>
        </div>

        {/* Photos */}
        {job.photos.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E8ECF0] p-4 shadow-sm">
            <h3 className="text-sm font-medium text-[#5A6A7A] mb-3">Photos</h3>
            <div className="grid grid-cols-3 gap-2">
              {job.photos.map((photo, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-[#F5F7FA]">
                  <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Address */}
        <div className="bg-white rounded-2xl border border-[#E8ECF0] p-4 shadow-sm">
          <h3 className="text-sm font-medium text-[#5A6A7A] mb-2">Address</h3>
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-[#5A6A7A] flex-shrink-0 mt-0.5" />
            <p className="text-[#1E1E1E]">{job.address}</p>
          </div>
        </div>

        {/* Updates */}
        <div className="bg-white rounded-2xl border border-[#E8ECF0] p-4 shadow-sm">
          <h3 className="text-sm font-medium text-[#5A6A7A] mb-3">Updates</h3>
          <div className="space-y-3">
            {job.updates.map((update, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-[#6CB4EE] mt-2 flex-shrink-0" />
                <div>
                  <p className="text-[#1E1E1E] text-sm">{update.message}</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">{update.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message Preview */}
        {jobMessages.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E8ECF0] p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-[#5A6A7A]">Messages</h3>
              <span className="text-xs text-[#6CB4EE] font-medium">{jobMessages.length} messages</span>
            </div>
            <div className="bg-[#F5F7FA] rounded-xl p-3">
              <p className="text-sm text-[#1E1E1E] truncate">
                {jobMessages[jobMessages.length - 1].text}
              </p>
            </div>
          </div>
        )}

        {/* Message Button */}
        <button
          onClick={() => setCurrentScreen("messages")}
          className="w-full h-12 rounded-xl border border-[#E8ECF0] bg-white text-[#1E1E1E] font-medium hover:bg-[#F5F7FA] flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <MessageSquare className="h-5 w-5 text-[#6CB4EE]" />
          Message Braxton
        </button>
      </div>
    </div>
  )
}
