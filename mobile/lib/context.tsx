import React, { createContext, useContext, useState } from "react";
import type { JobStatus } from "./status";

export type EnquiryType        = "issue" | "enquiry";
export type TimingOption       = "asap" | "this-week" | "choose-date";
export type ContactPreference  = "phone" | "text" | "in-app";

// Keep internal code alias for backwards compat
export type InquiryType = EnquiryType;

export interface InquiryData {
  type:              EnquiryType | null;
  category:          string;
  description:       string;
  photos:            string[];
  timing:            TimingOption | null;
  chosenDate:        string | null;
  name:              string;
  address:           string;
  phone:             string;
  contactPreference: ContactPreference | null;
}

export interface JobUpdate {
  id:         string;
  message:    string;
  type:       "status_change" | "note";
  created_at: string;
}

export interface Job {
  id:          string;
  type:        EnquiryType;
  category:    string;
  description: string;
  address:     string;
  status:      JobStatus;
  date:        string;
  photos:      string[];
  updates:     JobUpdate[];
}

interface AppContextValue {
  inquiry:            InquiryData;
  setInquiry:         (d: InquiryData) => void;
  resetInquiry:       () => void;
  jobs:               Job[];
  addJob:             (j: Job) => void;
  setJobs:            (j: Job[]) => void;
  updateJobStatus:    (jobId: string, status: JobStatus, update: JobUpdate) => void;
  isAuthenticated:    boolean;
  setIsAuthenticated: (v: boolean) => void;
  pushToken:          string | null;
  setPushToken:       (t: string | null) => void;
}

const blank: InquiryData = {
  type:              null,
  category:          "",
  description:       "",
  photos:            [],
  timing:            null,
  chosenDate:        null,
  name:              "",
  address:           "",
  phone:             "",
  contactPreference: null,
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [inquiry, setInquiry]                 = useState<InquiryData>(blank);
  const [jobs, setJobs]                       = useState<Job[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pushToken, setPushToken]             = useState<string | null>(null);

  const resetInquiry = () => setInquiry(blank);

  const addJob = (j: Job) => setJobs((prev) => [j, ...prev]);

  const updateJobStatus = (jobId: string, status: JobStatus, update: JobUpdate) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? { ...j, status, updates: [...j.updates, update] }
          : j
      )
    );
  };

  return (
    <AppContext.Provider
      value={{
        inquiry, setInquiry, resetInquiry,
        jobs, addJob, setJobs, updateJobStatus,
        isAuthenticated, setIsAuthenticated,
        pushToken, setPushToken,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
