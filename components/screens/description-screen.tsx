"use client"

import { useApp } from "@/lib/app-context"
import { ArrowLeft, Camera, X } from "lucide-react"
import { useRef } from "react"

export function DescriptionScreen() {
  const { setCurrentScreen, inquiryData, setInquiryData } = useApp()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles    = Array.from(files)
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file))

    setInquiryData({
      ...inquiryData,
      photoFiles:       [...inquiryData.photoFiles, ...newFiles],
      photoPreviewUrls: [...inquiryData.photoPreviewUrls, ...newPreviews],
    })
  }

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(inquiryData.photoPreviewUrls[index])
    setInquiryData({
      ...inquiryData,
      photoFiles:       inquiryData.photoFiles.filter((_, i) => i !== index),
      photoPreviewUrls: inquiryData.photoPreviewUrls.filter((_, i) => i !== index),
    })
  }

  const canContinue = inquiryData.description.trim().length > 0

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <button
          onClick={() => setCurrentScreen("category")}
          className="flex items-center gap-2 text-[#64748B] hover:text-[#1E1E1E] mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <h1 className="text-2xl font-semibold text-[#1E1E1E] tracking-tight">
          Describe the {inquiryData.type === "issue" ? "issue" : "project"}
        </h1>
        <p className="text-[#64748B] mt-3 text-base">The more detail, the better</p>
      </div>

      {/* Form */}
      <div className="px-6 space-y-8">
        {/* Description */}
        <div>
          <label className="text-xs font-semibold text-[#64748B] mb-3 block uppercase tracking-wide">
            Description
          </label>
          <textarea
            value={inquiryData.description}
            onChange={(e) => setInquiryData({ ...inquiryData, description: e.target.value })}
            placeholder={
              inquiryData.type === "issue"
                ? "E.g., The kitchen tap has been dripping for a few days..."
                : "E.g., Looking to renovate the kitchen with new cabinets and countertops..."
            }
            className="w-full h-36 p-4 rounded-2xl glass-input text-[#1E1E1E] placeholder:text-[#94A3B8] resize-none text-[15px] focus:outline-none"
          />
        </div>

        {/* Photo Upload */}
        <div>
          <label className="text-xs font-semibold text-[#64748B] mb-3 block uppercase tracking-wide">
            Photos (optional)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
          />

          {/* Photo Grid */}
          <div className="grid grid-cols-3 gap-3">
            {inquiryData.photoPreviewUrls.map((preview, index) => (
              <div key={index} className="relative aspect-square rounded-xl overflow-hidden">
                <img src={preview} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 h-6 w-6 rounded-full bg-[#1E1E1E]/80 flex items-center justify-center"
                >
                  <X className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
            ))}

            {/* Add Photo Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-xl glass-button flex flex-col items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <div className="h-10 w-10 rounded-xl bg-[#E3F3FF] flex items-center justify-center">
                <Camera className="h-5 w-5 text-[#4BA3D9]" />
              </div>
              <span className="text-xs text-[#64748B] font-medium">Add photo</span>
            </button>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={() => setCurrentScreen("timing")}
          disabled={!canContinue}
          className="w-full h-14 text-[17px] font-semibold rounded-2xl glass-button-primary flex items-center justify-center active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
