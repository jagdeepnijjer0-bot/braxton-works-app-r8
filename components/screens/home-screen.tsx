"use client"

import { useApp } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { Wrench, Settings, HardHat, Sparkles, ChevronRight } from "lucide-react"

const services = [
  { icon: Wrench, label: "Repairs" },
  { icon: Settings, label: "Maintenance" },
  { icon: HardHat, label: "Builds & Renovations" },
  { icon: Sparkles, label: "Everything else" },
]

export function HomeScreen() {
  const { setCurrentScreen } = useApp()

  return (
    <div className="min-h-screen pb-24">
      {/* Hero Section */}
      <div className="px-6 pt-12 pb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">B</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Braxton Works</h1>
        </div>
        <p className="text-muted-foreground text-lg mt-4 leading-relaxed">
          Anything that needs doing, we sort it.
        </p>
      </div>

      {/* Main CTA */}
      <div className="px-6 mb-8">
        <Button
          onClick={() => setCurrentScreen("inquiry-type")}
          className="w-full h-16 text-lg font-semibold rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
        >
          Start your inquiry
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>

      {/* Services List */}
      <div className="px-6 mb-10">
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-sm font-medium text-muted-foreground mb-4">We cover:</p>
          <div className="space-y-3">
            {services.map((service, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
                  <service.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-foreground font-medium">{service.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Logo Section */}
      <div className="px-6 mb-8">
        <div className="bg-foreground rounded-2xl p-8 flex flex-col items-center justify-center">
          <div className="h-16 w-16 rounded-2xl bg-background flex items-center justify-center mb-4">
            <span className="text-foreground font-bold text-3xl">B</span>
          </div>
          <p className="text-background text-lg font-semibold">Braxton Works</p>
          <p className="text-background/60 text-sm mt-1">Property Services</p>
        </div>
      </div>

      {/* About Section */}
      <div className="px-6 pb-8">
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-3">About Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            Braxton Works is your single point of contact for all property maintenance and improvement needs. 
            We handle everything from emergency repairs to full renovations, connecting you with trusted, 
            vetted professionals while managing the entire process.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-3">
            Whether you&apos;re a homeowner, landlord, tenant, or business - simply tell us what you need 
            and we&apos;ll take care of the rest.
          </p>
        </div>
      </div>
    </div>
  )
}
