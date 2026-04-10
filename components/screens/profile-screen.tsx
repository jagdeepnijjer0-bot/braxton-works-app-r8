"use client"

import { useApp, ContactPreference } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { User, Phone, MessageSquare, Mail, LogOut, Settings } from "lucide-react"
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
      <div className="min-h-screen pb-24 flex flex-col items-center justify-center px-6">
        <div className="h-20 w-20 rounded-full bg-[#F1F5F8] flex items-center justify-center mb-6">
          <User className="h-10 w-10 text-[#64748B]" />
        </div>
        <h2 className="text-xl font-bold text-[#1E1E1E] mb-2">Not signed in</h2>
        <p className="text-[#64748B] text-center mb-6">
          Sign in to view your profile and track your jobs
        </p>
        <Button
          onClick={() => setCurrentScreen("home")}
          className="w-full max-w-xs h-12 rounded-xl bg-[#6EC6FF] hover:bg-[#5BB8F5] text-white shadow-sm transition-colors"
        >
          Go to Home
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-2xl font-bold text-[#1E1E1E]">Profile</h1>
      </div>

      {/* Profile Card */}
      <div className="px-6 mb-6">
        <div className="bg-white rounded-2xl border border-[#E8ECF0] p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-full bg-[#E3F3FF] flex items-center justify-center">
              <User className="h-8 w-8 text-[#6EC6FF]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#1E1E1E]">{user.name}</h2>
              <p className="text-[#64748B] text-sm">{user.phone}</p>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[#64748B] mb-2 block">Name</label>
              <input
                type="text"
                value={user.name}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
                className="w-full p-3 rounded-xl border border-[#E8ECF0] bg-white text-[#1E1E1E] focus:border-[#6EC6FF] focus:ring-1 focus:ring-[#6EC6FF]/20 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#64748B] mb-2 block">Phone</label>
              <input
                type="tel"
                value={user.phone}
                onChange={(e) => setUser({ ...user, phone: e.target.value })}
                className="w-full p-3 rounded-xl border border-[#E8ECF0] bg-white text-[#1E1E1E] focus:border-[#6EC6FF] focus:ring-1 focus:ring-[#6EC6FF]/20 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contact Preference */}
      <div className="px-6 mb-6">
        <div className="bg-white rounded-2xl border border-[#E8ECF0] p-6 shadow-sm">
          <h3 className="text-sm font-medium text-[#64748B] mb-4">Contact Preference</h3>
          <div className="grid grid-cols-3 gap-3">
            {contactOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setUser({ ...user, contactPreference: option.id })}
                className={cn(
                  "p-3 rounded-xl border bg-white flex flex-col items-center gap-2 transition-all",
                  user.contactPreference === option.id
                    ? "border-[#6EC6FF] bg-[#E3F3FF]"
                    : "border-[#E8ECF0] hover:border-[#6EC6FF]"
                )}
              >
                <option.icon
                  className={cn(
                    "h-5 w-5",
                    user.contactPreference === option.id ? "text-[#6EC6FF]" : "text-[#64748B]"
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-medium",
                    user.contactPreference === option.id ? "text-[#6EC6FF]" : "text-[#64748B]"
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
        <div className="bg-white rounded-2xl border border-[#E8ECF0] overflow-hidden shadow-sm">
          <button className="w-full p-4 flex items-center gap-4 text-left hover:bg-[#F1F5F8] transition-colors">
            <Settings className="h-5 w-5 text-[#64748B]" />
            <span className="text-[#1E1E1E] font-medium">Settings</span>
          </button>
        </div>
      </div>

      {/* Logout */}
      <div className="px-6">
        <button
          onClick={handleLogout}
          className="w-full h-12 rounded-xl border border-red-200 bg-white text-red-500 font-medium hover:bg-red-50 flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
