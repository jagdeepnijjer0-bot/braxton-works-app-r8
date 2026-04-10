"use client"

import { AppProvider, useApp } from "@/lib/app-context"
import { BottomNav } from "@/components/bottom-nav"
import { HomeScreen } from "@/components/screens/home-screen"
import { InquiryTypeScreen } from "@/components/screens/inquiry-type-screen"
import { CategoryScreen } from "@/components/screens/category-screen"
import { DescriptionScreen } from "@/components/screens/description-screen"
import { TimingScreen } from "@/components/screens/timing-screen"
import { ContactScreen } from "@/components/screens/contact-screen"
import { AuthScreen } from "@/components/screens/auth-screen"
import { ConfirmationScreen } from "@/components/screens/confirmation-screen"
import { JobsScreen } from "@/components/screens/jobs-screen"
import { JobDetailScreen } from "@/components/screens/job-detail-screen"
import { MessagesScreen } from "@/components/screens/messages-screen"
import { ProfileScreen } from "@/components/screens/profile-screen"

function AppContent() {
  const { currentScreen } = useApp()

  const renderScreen = () => {
    if (currentScreen.startsWith("job-")) {
      const jobId = currentScreen.replace("job-", "")
      return <JobDetailScreen jobId={jobId} />
    }

    switch (currentScreen) {
      case "home":
        return <HomeScreen />
      case "inquiry-type":
        return <InquiryTypeScreen />
      case "category":
        return <CategoryScreen />
      case "description":
        return <DescriptionScreen />
      case "timing":
        return <TimingScreen />
      case "contact":
        return <ContactScreen />
      case "auth":
        return <AuthScreen />
      case "confirmation":
        return <ConfirmationScreen />
      case "jobs":
        return <JobsScreen />
      case "messages":
        return <MessagesScreen />
      case "profile":
        return <ProfileScreen />
      default:
        return <HomeScreen />
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFB] max-w-lg mx-auto relative">
      {renderScreen()}
      <BottomNav />
    </div>
  )
}

export default function Home() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
