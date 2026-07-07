"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { ArrowLeft, Droplets, Zap, Flame, CloudRain, DoorOpen, Microwave, Wrench, MoreHorizontal, Home, Paintbrush, ChefHat, Bath, Grid, Shovel, Trash2, Building2, Hammer } from "lucide-react"
import { StepProgress } from "@/components/step-progress"

const issueCategories = [
  { id: "plumbing", label: "Plumbing", icon: Droplets },
  { id: "electrical", label: "Electrical", icon: Zap },
  { id: "heating", label: "Heating / Boiler", icon: Flame },
  { id: "damp", label: "Damp", icon: CloudRain },
  { id: "locks-doors", label: "Locks / Doors", icon: DoorOpen },
  { id: "appliances", label: "Appliances", icon: Microwave },
  { id: "roofing", label: "Roofing", icon: Hammer },
  { id: "general", label: "General Repairs", icon: Wrench },
  { id: "other", label: "Other", icon: MoreHorizontal },
]

const inquiryCategories = [
  { id: "extension", label: "Extension", icon: Home },
  { id: "refurb", label: "Refurb", icon: Paintbrush },
  { id: "plastering", label: "Plastering", icon: Paintbrush },
  { id: "kitchen", label: "Kitchen", icon: ChefHat },
  { id: "bathroom", label: "Bathroom", icon: Bath },
  { id: "flooring", label: "Flooring", icon: Grid },
  { id: "carpets", label: "Carpets", icon: Grid },
  { id: "painting", label: "Painting & Decorating", icon: Paintbrush },
  { id: "garden", label: "Garden Work", icon: Shovel },
  { id: "strip-out", label: "Strip Out", icon: Trash2 },
  { id: "commercial", label: "Commercial Works", icon: Building2 },
  { id: "other", label: "Other", icon: MoreHorizontal },
]

export function CategoryScreen() {
  const { setCurrentScreen, inquiryData, setInquiryData } = useApp()
  const [selected, setSelected] = useState<string | null>(null)

  const categories = inquiryData.type === "issue" ? issueCategories : inquiryCategories
  const title = inquiryData.type === "issue" ? "What type of issue?" : "What are you looking for?"

  const handleSelect = (category: string) => {
    setSelected(category)
    setInquiryData({ ...inquiryData, category })
    setTimeout(() => setCurrentScreen("description"), 150)
  }

  return (
    <div className="min-h-screen pb-28">
      <StepProgress step={1} />

      {/* Header */}
      <div className="px-6 pt-6 pb-6">
        <button
          onClick={() => setCurrentScreen("inquiry-type")}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <h1 className="text-2xl font-semibold text-white tracking-tight">{title}</h1>
        <p className="text-white/60 mt-3 text-base">Select a category</p>
      </div>

      {/* Categories Grid */}
      <div className="px-6 grid grid-cols-2 gap-3">
        {categories.map((cat) => {
          const isSelected = selected === cat.label
          return (
            <button
              key={cat.id}
              onClick={() => handleSelect(cat.label)}
              className={`p-5 flex flex-col items-center gap-3 rounded-2xl transition-all duration-200 active:scale-[0.98] ${
                isSelected ? "option-card-selected" : "option-card"
              }`}
            >
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                isSelected ? "bg-[#0F172A]/10" : "bg-[#F59E0B]/15"
              }`}>
                <cat.icon className={`h-5 w-5 ${isSelected ? "text-[#0F172A]" : "text-[#F59E0B]"}`} />
              </div>
              <span className={`text-sm font-medium text-center ${isSelected ? "text-[#0F172A]" : "text-[#0F172A]"}`}>
                {cat.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
