"use client"

import { useApp, ContactPreference } from "@/lib/app-context"
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
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <button
          onClick={() => setCurrentScreen("timing")}
          className="flex items-center gap-2 text-[#64748B] hover:text-[#1E1E1E] mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-[#1E1E1E] tracking-tight">Your contact details</h1>
        <p className="text-[#64748B] mt-3 text-base">How can we reach you?</p>
      </div>

      {/* Form */}
      <div className="px-6 space-y-6">
        {/* Name */}
        <div>
          <label className="text-sm font-medium text-[#1E1E1E] mb-3 block">Name</label>
          <input
            type="text"
            value={inquiryData.name}
            onChange={(e) => setInquiryData({ ...inquiryData, name: e.target.value })}
            placeholder="Your full name"
            className="w-full p-4 rounded-xl glass-card border-0 text-[#1E1E1E] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#6EC6FF]/30 focus:outline-none transition-all"
          />
        </div>

        {/* Address */}
        <div>
          <label className="text-sm font-medium text-[#1E1E1E] mb-3 block">Address</label>
          <input
            type="text"
            value={inquiryData.address}
            onChange={(e) => setInquiryData({ ...inquiryData, address: e.target.value })}
            placeholder="Property address"
            className="w-full p-4 rounded-xl glass-card border-0 text-[#1E1E1E] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#6EC6FF]/30 focus:outline-none transition-all"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="text-sm font-medium text-[#1E1E1E] mb-3 block">Phone number</label>
          <input
            type="tel"
            value={inquiryData.phone}
            onChange={(e) => setInquiryData({ ...inquiryData, phone: e.target.value })}
            placeholder="Your phone number"
            className="w-full p-4 rounded-xl glass-card border-0 text-[#1E1E1E] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#6EC6FF]/30 focus:outline-none transition-all"
          />
        </div>

        {/* Contact Preference */}
        <div>
          <label className="text-sm font-medium text-[#1E1E1E] mb-4 block">
            Contact preference
          </label>
          <div className="grid grid-cols-3 gap-3">
            {contactOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setInquiryData({ ...inquiryData, contactPreference: option.id })}
                className={`p-4 rounded-xl glass-card flex flex-col items-center gap-3 transition-all duration-200 active:scale-[0.98] ${
                  inquiryData.contactPreference === option.id
                    ? "ring-2 ring-[#6EC6FF] bg-white"
                    : "hover:bg-white"
                }`}
              >
                <option.icon className={`h-6 w-6 ${inquiryData.contactPreference === option.id ? "text-[#6EC6FF]" : "text-[#64748B]"}`} />
                <span className={`text-xs font-medium ${inquiryData.contactPreference === option.id ? "text-[#4BA3D9]" : "text-[#64748B]"}`}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!canContinue}
          className="w-full h-14 text-base font-semibold rounded-2xl bg-[#6EC6FF] hover:bg-[#5BB8F5] text-white premium-shadow transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 mt-2"
        >
          Submit Inquiry
        </button>
      </div>
    </div>
  )
}
