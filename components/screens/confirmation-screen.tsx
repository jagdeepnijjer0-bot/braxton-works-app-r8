"use client"

import { useApp } from "@/lib/app-context"
import { CheckCircle } from "lucide-react"

export function ConfirmationScreen() {
  const { setCurrentScreen } = useApp()

  return (
    <div className="min-h-screen pb-28 flex flex-col items-center justify-center px-6">
      <div className="text-center">
        <div className="h-24 w-24 rounded-full bg-[#E3F3FF] flex items-center justify-center mx-auto mb-8 premium-shadow">
          <CheckCircle className="h-12 w-12 text-[#6EC6FF]" />
        </div>
        
        <h1 className="text-2xl font-bold text-[#1E1E1E] tracking-tight mb-3">
          Thanks, we&apos;ve received your inquiry.
        </h1>
        
        <p className="text-[#64748B] text-lg mb-10 leading-relaxed">
          We&apos;ll handle it from here.
        </p>

        <button
          onClick={() => setCurrentScreen("jobs")}
          className="w-full h-14 text-base font-semibold rounded-2xl bg-[#6EC6FF] hover:bg-[#5BB8F5] text-white premium-shadow-lg transition-all duration-200 active:scale-[0.98]"
        >
          View My Jobs
        </button>

        <button
          onClick={() => setCurrentScreen("home")}
          className="mt-5 text-[#64748B] hover:text-[#1E1E1E] text-sm font-medium transition-colors"
        >
          Back to home
        </button>
      </div>
    </div>
  )
}
