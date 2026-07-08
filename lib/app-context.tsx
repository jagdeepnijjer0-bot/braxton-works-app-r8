"use client"

import { createContext, useContext, useState, ReactNode } from "react"

export type InquiryType = "issue" | "inquiry" | null
export type TimingOption = "asap" | "this-week" | "choose-date" | null
export type ContactPreference = "phone" | "text" | "in-app" | null

export type JobStatus =
  | "Enquiry Received"
  | "Assigning Contractor"
  | "Contractor Assigned"
  | "Quote Ready"
  | "Job Underway"
  | "Job Completed"
  | "Cancelled"

export interface InquiryData {
  type: InquiryType
  category: string | null
  description: string
  // photoFiles holds the actual File objects for upload
  photoFiles: File[]
  // photoPreviewUrls holds object URLs for display during the flow
  photoPreviewUrls: string[]
  timing: TimingOption
  chosenDate: string | null
  name: string
  address: string
  phone: string
  contactPreference: ContactPreference
}

export interface JobUpdate {
  message: string
  created_at: string
  type: "status_change" | "note"
}

export interface Job {
  id: string
  type: InquiryType
  category: string
  description: string
  photos: string[]   // public URLs from Supabase Storage
  address: string
  status: JobStatus
  date: string
  updates: JobUpdate[]
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
  setJobs: (jobs: Job[]) => void
  addJob: (job: Job) => void
  messages: Message[]
  addMessage: (message: Message) => void
  user: { id?: string; name: string; phone: string; contactPreference: ContactPreference } | null
  setUser: (user: { id?: string; name: string; phone: string; contactPreference: ContactPreference } | null) => void
  isAuthenticated: boolean
  setIsAuthenticated: (auth: boolean) => void
}

const defaultInquiry: InquiryData = {
  type: null,
  category: null,
  description: "",
  photoFiles: [],
  photoPreviewUrls: [],
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
  // Start with empty jobs — real data loaded by JobsScreen
  const [jobs, setJobsState] = useState<Job[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [user, setUser] = useState<{ id?: string; name: string; phone: string; contactPreference: ContactPreference } | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const resetInquiry = () => {
    // Revoke any created object URLs to free memory
    inquiryData.photoPreviewUrls.forEach((url) => URL.revokeObjectURL(url))
    setInquiryData(defaultInquiry)
  }

  const setJobs = (jobs: Job[]) => setJobsState(jobs)
  const addJob  = (job: Job)   => setJobsState((prev) => [job, ...prev])

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
        setJobs,
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
