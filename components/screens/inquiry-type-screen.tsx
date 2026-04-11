"use client"

import { useApp, InquiryType } from "@/lib/app-context"
import { ArrowLeft, AlertCircle, HelpCircle } from "lucide-react"

const options: { type: InquiryType; label: string; description: string; icon: typeof AlertCircle }[] = [
  {
    type: "issue",
    label: "Issue",
    description: "Something needs fixing or repairing",
    icon: AlertCircle,
  },
  {
    type: "inquiry",
    label: "Inquiry",
    description: "Looking for a quote or project work",
    icon: HelpCircle,
  },
]

export function InquiryTypeScreen() {
  const { setCurrentScreen, inquiryData, setInquiryData } = useApp()

  const handleSelect = (type: InquiryType) => {
    setInquiryData({ ...inquiryData, type })
    setCurrentScreen("category")
  }

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <button
          onClick={() => setCurrentScreen("home")}
          className="flex items-center gap-2 text-[#64748B] hover:text-[#1E1E1E] mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <h1 className="text-2xl font-semibold text-[#1E1E1E] tracking-tight">
          What do you need help with?
        </h1>
        <p className="text-[#64748B] mt-3 text-base">
          Select the type of inquiry
        </p>
      </div>

      {/* Options */}
      <div className="px-6 space-y-4">
        {options.map((option) => (
          <button
            key={option.type}
            onClick={() => handleSelect(option.type)}
            className="w-full p-6 flex items-start gap-5 rounded-2xl glass-card transition-all duration-200 active:scale-[0.98] text-left"
          >
            <div className="h-14 w-14 rounded-xl bg-[#E3F3FF] flex items-center justify-center flex-shrink-0">
              <option.icon className="h-6 w-6 text-[#4BA3D9]" />
            </div>
            <div className="pt-1">
              <p className="text-lg font-semibold text-[#1E1E1E]">{option.label}</p>
              <p className="text-[#64748B] text-[15px] mt-1">{option.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
