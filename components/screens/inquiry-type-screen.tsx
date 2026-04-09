"use client"

import { useApp, InquiryType } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
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
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <button
          onClick={() => setCurrentScreen("home")}
          className="flex items-center gap-2 text-muted-foreground mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-foreground">
          What do you need help with?
        </h1>
        <p className="text-muted-foreground mt-2">
          Select the type of inquiry
        </p>
      </div>

      {/* Options */}
      <div className="px-6 space-y-4">
        {options.map((option) => (
          <Button
            key={option.type}
            variant="outline"
            onClick={() => handleSelect(option.type)}
            className="w-full h-auto p-6 flex items-start gap-4 rounded-2xl border-2 hover:border-primary hover:bg-muted/50 transition-all"
          >
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <option.icon className="h-6 w-6 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-lg font-semibold text-foreground">{option.label}</p>
              <p className="text-muted-foreground text-sm mt-1">{option.description}</p>
            </div>
          </Button>
        ))}
      </div>
    </div>
  )
}
