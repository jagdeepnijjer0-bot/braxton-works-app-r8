"use client"

import { Home, Briefcase, MessageSquare, User } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { cn } from "@/lib/utils"

const navItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "jobs", label: "My Jobs", icon: Briefcase },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "profile", label: "Profile", icon: User },
]

export function BottomNav() {
  const { currentScreen, setCurrentScreen } = useApp()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0F172A] border-t border-white/10 safe-area-bottom z-50">
      <div className="flex items-center justify-around h-[72px] max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = currentScreen === item.id ||
            (item.id === "home" && ["home", "inquiry-type", "category", "description", "timing", "contact", "auth", "confirmation"].includes(currentScreen))

          return (
            <button
              key={item.id}
              onClick={() => setCurrentScreen(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 min-w-[64px] rounded-xl transition-all duration-200",
                isActive
                  ? "text-[#F59E0B]"
                  : "text-[#94A3B8] hover:text-white"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl transition-all duration-200",
                isActive && "bg-[#F59E0B]/15"
              )}>
                <item.icon 
                  className="h-5 w-5" 
                  strokeWidth={isActive ? 2.5 : 2} 
                />
              </div>
              <span className={cn(
                "text-[10px] font-medium tracking-wide",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
