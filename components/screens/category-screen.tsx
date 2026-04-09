"use client"

import { useApp } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Droplets, Zap, Flame, CloudRain, DoorOpen, Microwave, Wrench, MoreHorizontal, Home, Paintbrush, ChefHat, Bath, Grid, Scissors, Shovel, Trash2, Building2 } from "lucide-react"

const issueCategories = [
  { id: "plumbing", label: "Plumbing", icon: Droplets },
  { id: "electrical", label: "Electrical", icon: Zap },
  { id: "heating", label: "Heating / Boiler", icon: Flame },
  { id: "damp", label: "Damp", icon: CloudRain },
  { id: "locks-doors", label: "Locks / Doors", icon: DoorOpen },
  { id: "appliances", label: "Appliances", icon: Microwave },
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

  const categories = inquiryData.type === "issue" ? issueCategories : inquiryCategories
  const title = inquiryData.type === "issue" ? "What type of issue?" : "What are you looking for?"

  const handleSelect = (category: string) => {
    setInquiryData({ ...inquiryData, category })
    setCurrentScreen("description")
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <button
          onClick={() => setCurrentScreen("inquiry-type")}
          className="flex items-center gap-2 text-muted-foreground mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground mt-2">Select a category</p>
      </div>

      {/* Categories Grid */}
      <div className="px-6 grid grid-cols-2 gap-3">
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant="outline"
            onClick={() => handleSelect(cat.label)}
            className="h-auto p-4 flex flex-col items-center gap-3 rounded-2xl border-2 hover:border-primary hover:bg-muted/50 transition-all"
          >
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <cat.icon className="h-6 w-6 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground text-center">{cat.label}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}
