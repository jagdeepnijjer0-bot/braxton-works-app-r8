"use client"

import { useApp, ContactPreference } from "@/lib/app-context"
import { User, Phone, MessageSquare, Mail, LogOut, Settings, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const contactOptions: { id: ContactPreference; label: string; icon: typeof Phone }[] = [
  { id: "phone", label: "Phone", icon: Phone },
  { id: "text", label: "Text", icon: MessageSquare },
  { id: "in-app", label: "In-app", icon: Mail },
]

export function ProfileScreen() {
  const { user, setUser, isAuthenticated, setIsAuthenticated, setCurrentScreen } = useApp()

  const handleLogout = () => {
    setUser(null)
    setIsAuthenticated(false)
    setCurrentScreen("home")
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen pb-32 flex flex-col">
        {/* Header */}
        <div className="px-6 pt-14 pb-6">
          <h1 className="text-2xl font-semibold text-white tracking-tight">Profile</h1>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-16">
          <div className="h-24 w-24 rounded-full bg-white/10 flex items-center justify-center mb-6">
            <User className="h-12 w-12 text-white/60" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Not signed in</h2>
          <p className="text-white/60 text-center text-[15px] leading-relaxed max-w-xs">
            Sign in to view your profile and track your jobs
          </p>
        </div>

        {/* Sign In Button - Above bottom nav */}
        <div className="px-6 pb-8">
          <button
            onClick={() => setCurrentScreen("auth")}
            className="w-full h-14 text-[17px] rounded-2xl btn-primary flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            Sign In
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="px-6 pt-14 pb-6">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Profile</h1>
      </div>

      {/* Profile Card */}
      <div className="px-6 mb-6">
        <div className="card-surface rounded-3xl p-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-16 w-16 rounded-full bg-[#F59E0B]/15 flex items-center justify-center">
              <User className="h-8 w-8 text-[#F59E0B]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#0F172A]">{user.name}</h2>
              <p className="text-[#64748B] text-sm">{user.phone}</p>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-[#64748B] mb-2 block uppercase tracking-wide">Name</label>
              <input
                type="text"
                value={user.name}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
                className="w-full p-4 rounded-xl input-field focus:outline-none text-[15px]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#64748B] mb-2 block uppercase tracking-wide">Phone</label>
              <input
                type="tel"
                value={user.phone}
                onChange={(e) => setUser({ ...user, phone: e.target.value })}
                className="w-full p-4 rounded-xl input-field focus:outline-none text-[15px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contact Preference */}
      <div className="px-6 mb-6">
        <div className="card-surface rounded-3xl p-6">
          <h3 className="text-xs font-semibold text-[#64748B] mb-5 uppercase tracking-wide">Contact Preference</h3>
          <div className="grid grid-cols-3 gap-3">
            {contactOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setUser({ ...user, contactPreference: option.id })}
                className={cn(
                  "p-4 rounded-xl flex flex-col items-center gap-2 transition-all duration-200 active:scale-[0.98]",
                  user.contactPreference === option.id
                    ? "option-card-selected"
                    : "option-card"
                )}
              >
                <option.icon
                  className={cn(
                    "h-5 w-5",
                    user.contactPreference === option.id ? "text-[#0F172A]" : "text-[#64748B]"
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-medium",
                    user.contactPreference === option.id ? "text-[#0F172A]" : "text-[#64748B]"
                  )}
                >
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="px-6 mb-6">
        <div className="card-surface rounded-3xl overflow-hidden">
          <button className="w-full p-5 flex items-center gap-4 text-left hover:bg-black/5 transition-colors">
            <Settings className="h-5 w-5 text-[#64748B]" />
            <span className="text-[#0F172A] font-medium text-[15px]">Settings</span>
          </button>
        </div>
      </div>

      {/* Logout */}
      <div className="px-6">
        <button
          onClick={handleLogout}
          className="w-full h-14 rounded-2xl btn-secondary border-red-400/40 text-red-400 font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
