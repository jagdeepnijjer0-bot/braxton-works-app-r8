"use client"

import { useApp } from "@/lib/app-context"
import { Wrench, Settings, HardHat, Sparkles, ChevronRight, ShieldCheck, Zap, Star } from "lucide-react"
import Image from "next/image"

const services = [
  { icon: Wrench, label: "Repairs" },
  { icon: Settings, label: "Maintenance" },
  { icon: HardHat, label: "Builds & Renovations" },
  { icon: Sparkles, label: "Everything else" },
]

const trustSignals = [
  { icon: ShieldCheck, label: "Verified Contractors" },
  { icon: Zap, label: "Fast Response" },
  { icon: Star, label: "Rated & Reviewed" },
]

export function HomeScreen() {
  const { setCurrentScreen } = useApp()

  return (
    <div className="min-h-screen pb-32">
      {/* Header with Logo */}
      <div className="px-6 pt-14 pb-8">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl overflow-hidden">
            <Image
              src="/images/braxton-logo.jpg"
              alt="Braxton Works"
              width={56}
              height={56}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">Braxton Works</h1>
            <p className="text-sm text-white/60">Property Services</p>
          </div>
        </div>
      </div>

      {/* Tagline */}
      <div className="px-6 mb-6">
        <p className="text-white/70 text-lg leading-relaxed max-w-sm">
          Anything that needs doing, we sort it.
        </p>
      </div>

      {/* Social proof */}
      <div className="px-6 mb-10">
        <p className="text-sm text-white/50 mb-4">
          Trusted by homeowners across Coventry &amp; Warwickshire.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {trustSignals.map((signal, i) => (
            <div key={i} className="card-surface rounded-2xl p-4 flex flex-col items-center text-center gap-2">
              <signal.icon className="h-5 w-5 text-[#F59E0B]" />
              <span className="text-[#0F172A] text-xs font-medium leading-tight">{signal.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Services List */}
      <div className="px-6 mb-10">
        <div className="card-surface rounded-3xl p-7">
          <p className="text-xs font-semibold text-[#64748B] mb-6 uppercase tracking-widest">We cover</p>
          <div className="space-y-5">
            {services.map((service, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-[#F59E0B]/15 flex items-center justify-center">
                  <service.icon className="h-5 w-5 text-[#F59E0B]" />
                </div>
                <span className="text-[#0F172A] font-medium text-[15px]">{service.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main CTA */}
      <div className="px-6 mb-12">
        <button
          onClick={() => setCurrentScreen("inquiry-type")}
          className="w-full h-16 text-[17px] rounded-2xl btn-primary flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          Start your inquiry
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* About Section */}
      <div className="px-6 pb-8">
        <div className="card-surface rounded-3xl p-7">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-4">About Us</h2>
          <p className="text-[#64748B] leading-relaxed text-[15px]">
            Braxton Works is your single point of contact for all property maintenance and improvement needs.
            We handle everything from emergency repairs to full renovations, connecting you with trusted,
            vetted professionals while managing the entire process.
          </p>
          <p className="text-[#64748B] leading-relaxed text-[15px] mt-4">
            Whether you&apos;re a homeowner, landlord, tenant, or business - simply tell us what you need
            and we&apos;ll take care of the rest.
          </p>
        </div>
      </div>
    </div>
  )
}
