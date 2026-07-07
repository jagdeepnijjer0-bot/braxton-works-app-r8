import React, { createContext, useContext, useState } from "react";
import type { JobStatus } from "./status";

export type InquiryType        = "issue" | "inquiry";
export type TimingOption       = "asap" | "this-week" | "choose-date";
export type ContactPreference  = "phone" | "text" | "in-app";

export interface InquiryData {
  type:              InquiryType | null;
  category:          string;
  description:       string;
  photos:            string[];   // local URIs
  timing:            TimingOption | null;
  chosenDate:        string | null;
  name:              string;
  address:           string;
  phone:             string;
  contactPreference: ContactPreference | null;
}

export interface Job {
  id:          string;
  type:        InquiryType;
  category:    string;
  description: string;
  address:     string;
  status:      JobStatus;
  date:        string;
  photos:      string[];
  updates:     { message: string; created_at: string; type: "status_change" | "note" }[];
}

interface AppContextValue {
  inquiry:       InquiryData;
  setInquiry:    (d: InquiryData) => void;
  resetInquiry:  () => void;
  jobs:          Job[];
  addJob:        (j: Job) => void;
  setJobs:       (j: Job[]) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (v: boolean) => void;
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
  const [inquiry, setInquiry]             = useState<InquiryData>(blank);
  const [jobs, setJobs]                   = useState<Job[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const resetInquiry = () => setInquiry(blank);
  const addJob       = (j: Job) => setJobs((prev) => [j, ...prev]);

  return (
    <AppContext.Provider
      value={{ inquiry, setInquiry, resetInquiry, jobs, addJob, setJobs, isAuthenticated, setIsAuthenticated }}
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
