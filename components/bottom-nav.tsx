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
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = currentScreen === item.id || 
            (item.id === "home" && ["home", "inquiry-type", "category", "description", "timing", "contact", "auth", "confirmation"].includes(currentScreen))
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentScreen(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 min-w-[64px] transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
