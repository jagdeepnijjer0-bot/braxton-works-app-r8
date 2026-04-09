"use client"

import { useApp, TimingOption } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Zap, Clock, Calendar } from "lucide-react"
import { useState } from "react"

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
    setCurrentScreen("contact")
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <button
          onClick={() => setCurrentScreen("description")}
          className="flex items-center gap-2 text-muted-foreground mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-foreground">When do you need this?</h1>
        <p className="text-muted-foreground mt-2">Select your preferred timing</p>
      </div>

      {/* Options */}
      <div className="px-6 space-y-4">
        {timingOptions.map((option) => (
          <Button
            key={option.id}
            variant="outline"
            onClick={() => handleSelect(option.id)}
            className={`w-full h-auto p-5 flex items-center gap-4 rounded-2xl border-2 hover:border-primary hover:bg-muted/50 transition-all ${
              inquiryData.timing === option.id ? "border-primary bg-muted/50" : ""
            }`}
          >
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <option.icon className="h-6 w-6 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-base font-semibold text-foreground">{option.label}</p>
              <p className="text-muted-foreground text-sm">{option.description}</p>
            </div>
          </Button>
        ))}
      </div>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <div className="fixed inset-0 bg-foreground/50 flex items-end justify-center z-50">
          <div className="bg-card w-full max-w-lg rounded-t-3xl p-6 animate-in slide-in-from-bottom">
            <h2 className="text-lg font-semibold text-foreground mb-4">Select a date</h2>
            <input
              type="date"
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => handleDateSelect(e.target.value)}
              className="w-full p-4 rounded-xl border-2 border-input bg-background text-foreground focus:border-primary focus:outline-none"
            />
            <Button
              variant="outline"
              onClick={() => setShowDatePicker(false)}
              className="w-full mt-4 h-12 rounded-xl"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
