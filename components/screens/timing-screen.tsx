"use client"

import { useApp, TimingOption } from "@/lib/app-context"
import { ArrowLeft, Zap, Clock, Calendar } from "lucide-react"
import { useState } from "react"
import { StepProgress } from "@/components/step-progress"

const timingOptions: { id: TimingOption; label: string; description: string; icon: typeof Zap }[] = [
  { id: "asap", label: "ASAP / Urgent", description: "As soon as possible", icon: Zap },
  { id: "this-week", label: "This week", description: "Within the coming days", icon: Clock },
  { id: "choose-date", label: "Choose a date", description: "Schedule for later", icon: Calendar },
]

export function TimingScreen() {
  const { setCurrentScreen, inquiryData, setInquiryData } = useApp()
  const [showDatePicker, setShowDatePicker] = useState(false)

  const handleSelect = (timing: TimingOption) => {
    if (timing === "choose-date") {
      setShowDatePicker(true)
      setInquiryData({ ...inquiryData, timing })
    } else {
      setInquiryData({ ...inquiryData, timing, chosenDate: null })
      setCurrentScreen("contact")
    }
  }

  const handleDateSelect = (date: string) => {
    setInquiryData({ ...inquiryData, chosenDate: date })
    setShowDatePicker(false)
    setCurrentScreen("contact")
  }

  return (
    <div className="min-h-screen pb-28">
      <StepProgress step={3} />

      {/* Header */}
      <div className="px-6 pt-6 pb-6">
        <button
          onClick={() => setCurrentScreen("description")}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <h1 className="text-2xl font-semibold text-white tracking-tight">When do you need this?</h1>
        <p className="text-white/60 mt-3 text-base">Select your preferred timing</p>
      </div>

      {/* Options */}
      <div className="px-6 space-y-4">
        {timingOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => handleSelect(option.id)}
            className={`w-full p-5 flex items-center gap-5 rounded-2xl option-card transition-all duration-200 active:scale-[0.98] text-left ${
              inquiryData.timing === option.id ? "ring-2 ring-[#F59E0B]" : ""
            }`}
          >
            <div className="h-14 w-14 rounded-xl bg-[#F59E0B]/15 flex items-center justify-center flex-shrink-0">
              <option.icon className="h-6 w-6 text-[#F59E0B]" />
            </div>
            <div>
              <p className="text-[17px] font-semibold text-[#0F172A]">{option.label}</p>
              <p className="text-[#64748B] text-sm mt-0.5">{option.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="card-surface w-full max-w-lg rounded-t-3xl p-6 animate-in slide-in-from-bottom">
            <h2 className="text-lg font-semibold text-[#0F172A] mb-5">Select a date</h2>
            <input
              type="date"
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => handleDateSelect(e.target.value)}
              className="w-full p-4 rounded-xl input-field focus:outline-none"
            />
            <button
              onClick={() => setShowDatePicker(false)}
              className="w-full mt-4 h-12 rounded-xl btn-secondary font-medium text-[#64748B]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
