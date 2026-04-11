"use client"

import { useApp } from "@/lib/app-context"
import { UserPlus, UserX } from "lucide-react"

export function AuthScreen() {
  const { setCurrentScreen, inquiryData, addJob, resetInquiry, setUser, setIsAuthenticated } = useApp()

  const submitInquiry = (authenticated: boolean) => {
    // Create the job
    const newJob = {
      id: Date.now().toString(),
      type: inquiryData.type,
      category: inquiryData.category || "General",
      description: inquiryData.description,
      photos: inquiryData.photos,
      address: inquiryData.address,
      status: "pending" as const,
      date: new Date().toISOString().split("T")[0],
      updates: [{ date: new Date().toISOString().split("T")[0], message: "Inquiry received" }],
    }
    addJob(newJob)

    if (authenticated) {
      setUser({
        name: inquiryData.name,
        phone: inquiryData.phone,
        contactPreference: inquiryData.contactPreference,
      })
      setIsAuthenticated(true)
    }

    resetInquiry()
    setCurrentScreen("confirmation")
  }

  return (
    <div className="min-h-screen pb-28 flex flex-col">
      {/* Header */}
      <div className="px-6 pt-16 pb-6 flex-1 flex flex-col justify-center">
        <div className="text-center mb-10">
          <div className="h-20 w-20 rounded-2xl glass-card flex items-center justify-center mx-auto mb-6">
            <UserPlus className="h-10 w-10 text-[#6EC6FF]" />
          </div>
          <h1 className="text-2xl font-semibold text-[#1E1E1E] tracking-tight">Almost there!</h1>
          <p className="text-[#64748B] mt-3 max-w-xs mx-auto leading-relaxed text-[15px]">
            Create an account to track your inquiry and receive updates
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <button
            onClick={() => submitInquiry(true)}
            className="w-full h-14 text-[17px] font-semibold rounded-2xl glass-button-primary flex items-center justify-center active:scale-[0.98] transition-transform"
          >
            Sign in / Create account
          </button>
          
          <button
            onClick={() => submitInquiry(false)}
            className="w-full h-14 text-base font-medium rounded-2xl glass-button flex items-center justify-center gap-2 text-[#64748B] active:scale-[0.98] transition-transform"
          >
            <UserX className="h-5 w-5" />
            Continue as guest
          </button>
        </div>

        <p className="text-center text-sm text-[#94A3B8] mt-8">
          You can create an account later to view your jobs
        </p>
      </div>
    </div>
  )
}
