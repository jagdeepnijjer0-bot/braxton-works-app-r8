"use client"

import { useApp, ContactPreference } from "@/lib/app-context"
import { ArrowLeft, Phone, MessageSquare, Mail } from "lucide-react"
import { StepProgress } from "@/components/step-progress"

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
      <StepProgress step={4} />

      {/* Header */}
      <div className="px-6 pt-6 pb-6">
        <button
          onClick={() => setCurrentScreen("timing")}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Your contact details</h1>
        <p className="text-white/60 mt-3 text-base">How can we reach you?</p>
      </div>

      {/* Form */}
      <div className="px-6 space-y-6">
        {/* Name */}
        <div>
          <label className="text-xs font-semibold text-white/60 mb-3 block uppercase tracking-wide">Name</label>
          <input
            type="text"
            value={inquiryData.name}
            onChange={(e) => setInquiryData({ ...inquiryData, name: e.target.value })}
            placeholder="Your full name"
            className="w-full p-4 rounded-xl input-field placeholder:text-[#94A3B8] focus:outline-none text-[15px]"
          />
        </div>

        {/* Address */}
        <div>
          <label className="text-xs font-semibold text-white/60 mb-3 block uppercase tracking-wide">Address</label>
          <input
            type="text"
            value={inquiryData.address}
            onChange={(e) => setInquiryData({ ...inquiryData, address: e.target.value })}
            placeholder="Property address"
            className="w-full p-4 rounded-xl input-field placeholder:text-[#94A3B8] focus:outline-none text-[15px]"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="text-xs font-semibold text-white/60 mb-3 block uppercase tracking-wide">Phone number</label>
          <input
            type="tel"
            value={inquiryData.phone}
            onChange={(e) => setInquiryData({ ...inquiryData, phone: e.target.value })}
            placeholder="Your phone number"
            className="w-full p-4 rounded-xl input-field placeholder:text-[#94A3B8] focus:outline-none text-[15px]"
          />
        </div>

        {/* Contact Preference */}
        <div>
          <label className="text-xs font-semibold text-white/60 mb-4 block uppercase tracking-wide">
            Contact preference
          </label>
          <div className="grid grid-cols-3 gap-3">
            {contactOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setInquiryData({ ...inquiryData, contactPreference: option.id })}
                className={`p-4 rounded-xl flex flex-col items-center gap-3 transition-all duration-200 active:scale-[0.98] ${
                  inquiryData.contactPreference === option.id
                    ? "option-card-selected"
                    : "option-card"
                }`}
              >
                <option.icon className={`h-5 w-5 ${inquiryData.contactPreference === option.id ? "text-[#0F172A]" : "text-[#64748B]"}`} />
                <span className={`text-xs font-medium ${inquiryData.contactPreference === option.id ? "text-[#0F172A]" : "text-[#64748B]"}`}>
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
          className="w-full h-14 text-[17px] rounded-2xl btn-primary flex items-center justify-center active:scale-[0.98] transition-transform disabled:cursor-not-allowed disabled:active:scale-100 mt-2"
        >
          Submit Inquiry
        </button>
      </div>
    </div>
  )
}
