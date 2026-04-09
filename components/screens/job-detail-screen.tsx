"use client"

import { useApp } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin, Clock, CheckCircle, AlertCircle, MessageSquare, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

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

export function JobDetailScreen({ jobId }: { jobId: string }) {
  const { jobs, setCurrentScreen, messages } = useApp()
  
  const job = jobs.find((j) => j.id === jobId)
  const jobMessages = messages.filter((m) => m.jobId === jobId)
  
  if (!job) {
    return (
      <div className="min-h-screen pb-24 flex items-center justify-center">
        <p className="text-muted-foreground">Job not found</p>
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
          className="flex items-center gap-2 text-muted-foreground mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        
        {/* Status Badge */}
        <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4", statusColors[job.status])}>
          <StatusIcon className="h-4 w-4" />
          <span className="text-sm font-medium">{statusLabels[job.status]}</span>
        </div>
        
        <h1 className="text-xl font-bold text-foreground">{job.category}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {job.type === "issue" ? "Issue" : "Inquiry"} • {job.date}
        </p>
      </div>

      {/* Content */}
      <div className="px-6 space-y-6">
        {/* Description */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
          <p className="text-foreground">{job.description}</p>
        </div>

        {/* Photos */}
        {job.photos.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Photos</h3>
            <div className="grid grid-cols-3 gap-2">
              {job.photos.map((photo, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-muted">
                  <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Address */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Address</h3>
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-foreground">{job.address}</p>
          </div>
        </div>

        {/* Updates */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Updates</h3>
          <div className="space-y-3">
            {job.updates.map((update, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div>
                  <p className="text-foreground text-sm">{update.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{update.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message Preview */}
        {jobMessages.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">Messages</h3>
              <span className="text-xs text-primary font-medium">{jobMessages.length} messages</span>
            </div>
            <div className="bg-muted rounded-xl p-3">
              <p className="text-sm text-foreground truncate">
                {jobMessages[jobMessages.length - 1].text}
              </p>
            </div>
          </div>
        )}

        {/* Message Button */}
        <Button
          onClick={() => setCurrentScreen("messages")}
          variant="outline"
          className="w-full h-12 rounded-xl border-2"
        >
          <MessageSquare className="h-5 w-5 mr-2" />
          Message Braxton
        </Button>
      </div>
    </div>
  )
}
