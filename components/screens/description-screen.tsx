"use client"

import { useApp } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Camera, X, ImageIcon } from "lucide-react"
import { useRef } from "react"

export function DescriptionScreen() {
  const { setCurrentScreen, inquiryData, setInquiryData } = useApp()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newPhotos = Array.from(files).map((file) => URL.createObjectURL(file))
      setInquiryData({ ...inquiryData, photos: [...inquiryData.photos, ...newPhotos] })
    }
  }

  const removePhoto = (index: number) => {
    const newPhotos = inquiryData.photos.filter((_, i) => i !== index)
    setInquiryData({ ...inquiryData, photos: newPhotos })
  }

  const canContinue = inquiryData.description.trim().length > 0

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <button
          onClick={() => setCurrentScreen("category")}
          className="flex items-center gap-2 text-muted-foreground mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-foreground">Describe the {inquiryData.type === "issue" ? "issue" : "project"}</h1>
        <p className="text-muted-foreground mt-2">The more detail, the better</p>
      </div>

      {/* Form */}
      <div className="px-6 space-y-6">
        {/* Description */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Description
          </label>
          <textarea
            value={inquiryData.description}
            onChange={(e) => setInquiryData({ ...inquiryData, description: e.target.value })}
            placeholder={inquiryData.type === "issue" ? "E.g., The kitchen tap has been dripping for a few days..." : "E.g., Looking to renovate the kitchen with new cabinets and countertops..."}
            className="w-full h-32 p-4 rounded-2xl border-2 border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
          />
        </div>

        {/* Photo Upload */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
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
            {inquiryData.photos.map((photo, index) => (
              <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                <img src={photo} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 h-6 w-6 rounded-full bg-foreground/80 flex items-center justify-center"
                >
                  <X className="h-4 w-4 text-background" />
                </button>
              </div>
            ))}
            
            {/* Add Photo Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-muted/50 transition-colors"
            >
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                <Camera className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="text-xs text-muted-foreground">Add photo</span>
            </button>
          </div>
        </div>

        {/* Continue Button */}
        <Button
          onClick={() => setCurrentScreen("timing")}
          disabled={!canContinue}
          className="w-full h-14 text-base font-semibold rounded-2xl mt-4"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
