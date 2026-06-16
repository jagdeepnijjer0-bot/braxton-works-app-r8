"use client"

import { useApp } from "@/lib/app-context"
import { CheckCircle } from "lucide-react"

export function ConfirmationScreen() {
  const { setCurrentScreen } = useApp()

  return (
    <div className="min-h-screen pb-32 flex flex-col items-center justify-center px-6">
      <div className="text-center w-full">
        <div className="h-24 w-24 rounded-full bg-[#F59E0B]/15 flex items-center justify-center mx-auto mb-8">
          <CheckCircle className="h-14 w-14 text-[#F59E0B]" />
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight mb-3">
          Inquiry Submitted
        </h1>

        <p className="text-white/60 text-lg mb-12 leading-relaxed">
          We&apos;ll be in touch shortly — usually within 2 hours.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => setCurrentScreen("home")}
            className="w-full h-14 text-[17px] rounded-2xl btn-secondary text-white flex items-center justify-center active:scale-[0.98] transition-transform"
          >
            Return Home
          </button>

          <button
            onClick={() => setCurrentScreen("jobs")}
            className="w-full h-14 text-[17px] rounded-2xl btn-primary flex items-center justify-center active:scale-[0.98] transition-transform"
          >
            View My Jobs
          </button>
        </div>
      </div>
    </div>
  )
}
