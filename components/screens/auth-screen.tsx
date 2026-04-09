"use client"

import { useApp } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
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
    <div className="min-h-screen pb-24 flex flex-col">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 flex-1 flex flex-col justify-center">
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <UserPlus className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Almost there!</h1>
          <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
            Create an account to track your inquiry and receive updates
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <Button
            onClick={() => submitInquiry(true)}
            className="w-full h-14 text-base font-semibold rounded-2xl"
          >
            Sign in / Create account
          </Button>
          
          <Button
            variant="outline"
            onClick={() => submitInquiry(false)}
            className="w-full h-14 text-base font-medium rounded-2xl border-2"
          >
            <UserX className="h-5 w-5 mr-2" />
            Continue as guest
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          You can create an account later to view your jobs
        </p>
      </div>
    </div>
  )
}
