"use client"

import { useApp } from "@/lib/app-context"
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
    <div className="min-h-screen pb-28">
      {/* Hero Section */}
      <div className="px-6 pt-14 pb-10">
        <div className="flex items-center gap-4 mb-3">
          <div className="h-12 w-12 rounded-2xl bg-[#6EC6FF] flex items-center justify-center premium-shadow">
            <span className="text-white font-bold text-xl">B</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1E1E1E] tracking-tight">Braxton Works</h1>
        </div>
        <p className="text-[#64748B] text-lg mt-5 leading-relaxed max-w-sm">
          Anything that needs doing, we sort it.
        </p>
      </div>

      {/* Main CTA */}
      <div className="px-6 mb-10">
        <button
          onClick={() => setCurrentScreen("inquiry-type")}
          className="w-full h-16 text-lg font-semibold rounded-2xl bg-[#6EC6FF] hover:bg-[#5BB8F5] text-white premium-shadow-lg transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          Start your inquiry
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Services List */}
      <div className="px-6 mb-10">
        <div className="glass-card rounded-3xl p-6">
          <p className="text-sm font-medium text-[#64748B] mb-5 uppercase tracking-wide">We cover</p>
          <div className="space-y-4">
            {services.map((service, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-xl bg-[#E3F3FF] flex items-center justify-center">
                  <service.icon className="h-5 w-5 text-[#4BA3D9]" />
                </div>
                <span className="text-[#1E1E1E] font-medium">{service.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Logo Section */}
      <div className="px-6 mb-10">
        <div className="bg-[#1E1E1E] rounded-3xl p-10 flex flex-col items-center justify-center">
          <div className="h-20 w-20 rounded-2xl bg-white flex items-center justify-center mb-5">
            <span className="text-[#1E1E1E] font-bold text-4xl">B</span>
          </div>
          <p className="text-white text-xl font-semibold">Braxton Works</p>
          <p className="text-white/50 text-sm mt-2">Property Services</p>
        </div>
      </div>

      {/* About Section */}
      <div className="px-6 pb-10">
        <div className="glass-card rounded-3xl p-7">
          <h2 className="text-lg font-semibold text-[#1E1E1E] mb-4">About Us</h2>
          <p className="text-[#64748B] leading-relaxed">
            Braxton Works is your single point of contact for all property maintenance and improvement needs. 
            We handle everything from emergency repairs to full renovations, connecting you with trusted, 
            vetted professionals while managing the entire process.
          </p>
          <p className="text-[#64748B] leading-relaxed mt-4">
            Whether you&apos;re a homeowner, landlord, tenant, or business - simply tell us what you need 
            and we&apos;ll take care of the rest.
          </p>
        </div>
      </div>
    </div>
  )
}
