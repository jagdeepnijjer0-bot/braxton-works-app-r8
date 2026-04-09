"use client"

import { createContext, useContext, useState, ReactNode } from "react"

export type InquiryType = "issue" | "inquiry" | null
export type TimingOption = "asap" | "this-week" | "choose-date" | null
export type ContactPreference = "phone" | "text" | "in-app" | null

export interface InquiryData {
  type: InquiryType
  category: string | null
  description: string
  photos: string[]
  timing: TimingOption
  chosenDate: string | null
  name: string
  address: string
  phone: string
  contactPreference: ContactPreference
}

export interface Job {
  id: string
  type: InquiryType
  category: string
  description: string
  photos: string[]
  address: string
  status: "pending" | "in-progress" | "completed"
  date: string
  updates: { date: string; message: string }[]
}

export interface Message {
  id: string
  jobId: string
  sender: "user" | "braxton"
  text: string
  timestamp: string
}

interface AppContextType {
  currentScreen: string
  setCurrentScreen: (screen: string) => void
  inquiryData: InquiryData
  setInquiryData: (data: InquiryData) => void
  resetInquiry: () => void
  jobs: Job[]
  addJob: (job: Job) => void
  messages: Message[]
  addMessage: (message: Message) => void
  user: { name: string; phone: string; contactPreference: ContactPreference } | null
  setUser: (user: { name: string; phone: string; contactPreference: ContactPreference } | null) => void
  isAuthenticated: boolean
  setIsAuthenticated: (auth: boolean) => void
}

const defaultInquiry: InquiryData = {
  type: null,
  category: null,
  description: "",
  photos: [],
  timing: null,
  chosenDate: null,
  name: "",
  address: "",
  phone: "",
  contactPreference: null,
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState("home")
  const [inquiryData, setInquiryData] = useState<InquiryData>(defaultInquiry)
  const [jobs, setJobs] = useState<Job[]>([
    {
      id: "1",
      type: "issue",
      category: "Plumbing",
      description: "Leaking tap in kitchen",
      photos: [],
      address: "123 Main Street, London",
      status: "in-progress",
      date: "2026-04-07",
      updates: [
        { date: "2026-04-07", message: "Inquiry received" },
        { date: "2026-04-08", message: "Plumber assigned - arriving tomorrow" },
      ],
    },
    {
      id: "2",
      type: "inquiry",
      category: "Kitchen",
      description: "Full kitchen renovation quote needed",
      photos: [],
      address: "123 Main Street, London",
      status: "pending",
      date: "2026-04-05",
      updates: [{ date: "2026-04-05", message: "Inquiry received - awaiting assessment" }],
    },
  ])
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      jobId: "1",
      sender: "braxton",
      text: "Hi! Your plumber has been assigned and will arrive tomorrow between 9-11am.",
      timestamp: "2026-04-08T10:30:00",
    },
    {
      id: "2",
      jobId: "1",
      sender: "user",
      text: "Great, thank you!",
      timestamp: "2026-04-08T10:35:00",
    },
  ])
  const [user, setUser] = useState<{ name: string; phone: string; contactPreference: ContactPreference } | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const resetInquiry = () => setInquiryData(defaultInquiry)

  const addJob = (job: Job) => setJobs((prev) => [job, ...prev])

  const addMessage = (message: Message) => setMessages((prev) => [...prev, message])

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        inquiryData,
        setInquiryData,
        resetInquiry,
        jobs,
        addJob,
        messages,
        addMessage,
        user,
        setUser,
        isAuthenticated,
        setIsAuthenticated,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error("useApp must be used within AppProvider")
  return context
}
