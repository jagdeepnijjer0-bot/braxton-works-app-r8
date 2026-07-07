"use client"

import { useState } from "react"
import { useApp, Job } from "@/lib/app-context"
import { UserPlus, UserX, Loader2 } from "lucide-react"

export function AuthScreen() {
  const { setCurrentScreen, inquiryData, addJob, resetInquiry, setUser, setIsAuthenticated } = useApp()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const submitInquiry = async (authenticated: boolean) => {
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("type",              inquiryData.type ?? "inquiry")
      formData.append("category",          inquiryData.category ?? "General")
      formData.append("description",       inquiryData.description)
      formData.append("address",           inquiryData.address)
      formData.append("timing",            inquiryData.timing ?? "")
      formData.append("chosenDate",        inquiryData.chosenDate ?? "")
      formData.append("name",              inquiryData.name)
      formData.append("phone",             inquiryData.phone)
      formData.append("contactPreference", inquiryData.contactPreference ?? "")

      // Attach photo files
      for (const file of inquiryData.photoFiles) {
        formData.append("photos", file)
      }

      const res = await fetch("/api/submissions", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "Submission failed. Please try again.")
      }

      const { jobId } = await res.json()

      // Add a local job so the jobs list updates immediately
      const localJob: Job = {
        id: jobId,
        type: inquiryData.type,
        category: inquiryData.category ?? "General",
        description: inquiryData.description,
        photos: inquiryData.photoPreviewUrls,
        address: inquiryData.address,
        status: "New",
        date: new Date().toISOString().split("T")[0],
        updates: [{ message: "Enquiry received", created_at: new Date().toISOString(), type: "status_change" }],
      }
      addJob(localJob)

      if (authenticated) {
        setUser({
          name:              inquiryData.name,
          phone:             inquiryData.phone,
          contactPreference: inquiryData.contactPreference,
        })
        setIsAuthenticated(true)
      }

      resetInquiry()
      setCurrentScreen("confirmation")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pb-28 flex flex-col">
      <div className="px-6 pt-16 pb-6 flex-1 flex flex-col justify-center">
        <div className="text-center mb-10">
          <div className="h-20 w-20 rounded-2xl card-surface flex items-center justify-center mx-auto mb-6">
            <UserPlus className="h-10 w-10 text-[#F59E0B]" />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Almost there!</h1>
          <p className="text-white/60 mt-3 max-w-xs mx-auto leading-relaxed text-[15px]">
            Create an account to track your inquiry and receive updates
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 text-center">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => submitInquiry(true)}
            disabled={loading}
            className="w-full h-14 text-[17px] rounded-2xl btn-primary flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:active:scale-100"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign in / Create account"}
          </button>

          <button
            onClick={() => submitInquiry(false)}
            disabled={loading}
            className="w-full h-14 text-base font-medium rounded-2xl btn-secondary flex items-center justify-center gap-2 text-white active:scale-[0.98] transition-transform disabled:opacity-60 disabled:active:scale-100"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <UserX className="h-5 w-5" />
                Continue as guest
              </>
            )}
          </button>
        </div>

        <p className="text-center text-sm text-white/40 mt-8">
          You can create an account later to view your jobs
        </p>
      </div>
    </div>
  )
}
