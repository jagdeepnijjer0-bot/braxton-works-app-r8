"use client"

import { useApp } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

export function ConfirmationScreen() {
  const { setCurrentScreen } = useApp()

  return (
    <div className="min-h-screen pb-24 flex flex-col items-center justify-center px-6">
      <div className="text-center">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-primary" />
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Thanks, we&apos;ve received your inquiry.
        </h1>
        
        <p className="text-muted-foreground text-lg mb-8">
          We&apos;ll handle it from here.
        </p>

        <Button
          onClick={() => setCurrentScreen("jobs")}
          className="w-full h-14 text-base font-semibold rounded-2xl"
        >
          View My Jobs
        </Button>

        <button
          onClick={() => setCurrentScreen("home")}
          className="mt-4 text-muted-foreground text-sm font-medium"
        >
          Back to home
        </button>
      </div>
    </div>
  )
}
