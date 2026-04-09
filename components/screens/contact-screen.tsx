"use client"

import { useApp, ContactPreference } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Phone, MessageSquare, Mail } from "lucide-react"

const contactOptions: { id: ContactPreference; label: string; icon: typeof Phone }[] = [
  { id: "phone", label: "Phone call", icon: Phone },
  { id: "text", label: "Text message", icon: MessageSquare },
  { id: "in-app", label: "In-app message", icon: Mail },
]

export function ContactScreen() {
  const { setCurrentScreen, inquiryData, setInquiryData } = useApp()

  const canContinue =
    inquiryData.name.trim() &&
    inquiryData.address.trim() &&
    inquiryData.phone.trim() &&
    inquiryData.contactPreference

  const handleSubmit = () => {
    setCurrentScreen("auth")
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <button
          onClick={() => setCurrentScreen("timing")}
          className="flex items-center gap-2 text-muted-foreground mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-foreground">Your contact details</h1>
        <p className="text-muted-foreground mt-2">How can we reach you?</p>
      </div>

      {/* Form */}
      <div className="px-6 space-y-5">
        {/* Name */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Name</label>
          <input
            type="text"
            value={inquiryData.name}
            onChange={(e) => setInquiryData({ ...inquiryData, name: e.target.value })}
            placeholder="Your full name"
            className="w-full p-4 rounded-xl border-2 border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>

        {/* Address */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Address</label>
          <input
            type="text"
            value={inquiryData.address}
            onChange={(e) => setInquiryData({ ...inquiryData, address: e.target.value })}
            placeholder="Property address"
            className="w-full p-4 rounded-xl border-2 border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Phone number</label>
          <input
            type="tel"
            value={inquiryData.phone}
            onChange={(e) => setInquiryData({ ...inquiryData, phone: e.target.value })}
            placeholder="Your phone number"
            className="w-full p-4 rounded-xl border-2 border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>

        {/* Contact Preference */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">
            Contact preference
          </label>
          <div className="grid grid-cols-3 gap-3">
            {contactOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setInquiryData({ ...inquiryData, contactPreference: option.id })}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                  inquiryData.contactPreference === option.id
                    ? "border-primary bg-primary/10"
                    : "border-input hover:border-primary/50"
                }`}
              >
                <option.icon className={`h-5 w-5 ${inquiryData.contactPreference === option.id ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-xs font-medium ${inquiryData.contactPreference === option.id ? "text-primary" : "text-muted-foreground"}`}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!canContinue}
          className="w-full h-14 text-base font-semibold rounded-2xl mt-4"
        >
          Submit Inquiry
        </Button>
      </div>
    </div>
  )
}
