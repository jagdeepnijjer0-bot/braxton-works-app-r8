"use client"

import { useApp, JobStatus } from "@/lib/app-context"
import { ArrowLeft, MapPin, Clock, CheckCircle, AlertCircle, XCircle, CalendarCheck, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { STATUS_DISPLAY, STATUS_PILL_CLASSES, statusTone } from "@/lib/status"

const statusIcons: Record<JobStatus, typeof AlertCircle> = {
  "New":         AlertCircle,
  "Quoted":      FileText,
  "Booked":      CalendarCheck,
  "In Progress": Clock,
  "Complete":    CheckCircle,
  "Cancelled":   XCircle,
}

export function JobDetailScreen({ jobId }: { jobId: string }) {
  const { jobs, setCurrentScreen } = useApp()

  const job = jobs.find((j) => j.id === jobId)

  if (!job) {
    return (
      <div className="min-h-screen pb-28 flex items-center justify-center">
        <p className="text-white/60">Job not found</p>
      </div>
    )
  }

  const tone       = statusTone(job.status)
  const StatusIcon = statusIcons[job.status] ?? AlertCircle
  const pillClass  = STATUS_PILL_CLASSES[tone]

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <button
          onClick={() => setCurrentScreen("jobs")}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4", pillClass)}>
          <StatusIcon className="h-4 w-4" />
          <span className="text-sm font-medium">{STATUS_DISPLAY[job.status]}</span>
        </div>

        <h1 className="text-xl font-semibold text-white tracking-tight">{job.category}</h1>
        <p className="text-sm text-white/60 mt-1">
          {job.type === "issue" ? "Issue" : "Inquiry"} — {job.date}
        </p>
      </div>

      {/* Content */}
      <div className="px-6 space-y-5">
        {/* Description */}
        <div className="card-surface rounded-2xl p-5">
          <h3 className="text-xs font-semibold text-[#64748B] mb-3 uppercase tracking-wide">Description</h3>
          <p className="text-[#0F172A] text-[15px] leading-relaxed">{job.description}</p>
        </div>

        {/* Photos */}
        {job.photos.length > 0 && (
          <div className="card-surface rounded-2xl p-5">
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
        <div className="card-surface rounded-2xl p-5">
          <h3 className="text-xs font-semibold text-[#64748B] mb-3 uppercase tracking-wide">Address</h3>
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-[#64748B] flex-shrink-0 mt-0.5" />
            <p className="text-[#0F172A] text-[15px]">{job.address}</p>
          </div>
        </div>

        {/* Updates */}
        {job.updates.length > 0 && (
          <div className="card-surface rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-[#64748B] mb-4 uppercase tracking-wide">Updates</h3>
            <div className="space-y-4">
              {job.updates.map((update, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#F59E0B] mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-[#0F172A] text-[15px]">{update.message}</p>
                    <p className="text-xs text-[#94A3B8] mt-1">
                      {new Date(update.created_at).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
