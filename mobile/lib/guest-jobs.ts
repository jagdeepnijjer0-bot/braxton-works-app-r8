import AsyncStorage from "@react-native-async-storage/async-storage";

export const GUEST_JOB_IDS_KEY = "guest_job_ids";
const GUEST_JOBS_KEY = "guest_jobs_v2";

export async function persistGuestJobId(jobId: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(GUEST_JOB_IDS_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    if (!ids.includes(jobId)) {
      await AsyncStorage.setItem(GUEST_JOB_IDS_KEY, JSON.stringify([...ids, jobId]));
    }
  } catch { /* non-fatal */ }
}

export async function loadGuestJobIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(GUEST_JOB_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const GUEST_JOB_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Store the full job object locally so we can restore without a Supabase round-trip.
// This avoids RLS issues where anon users can't SELECT their own guest jobs.
export async function persistGuestJob(job: Record<string, unknown>): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(GUEST_JOBS_KEY);
    const jobs: Record<string, unknown>[] = raw ? JSON.parse(raw) : [];
    const entry = { ...job, _savedAt: Date.now() };
    const idx = jobs.findIndex((j) => j.id === job.id);
    if (idx >= 0) {
      jobs[idx] = entry;
    } else {
      jobs.unshift(entry);
    }
    await AsyncStorage.setItem(GUEST_JOBS_KEY, JSON.stringify(jobs));
    // Keep legacy ID list in sync
    await persistGuestJobId(job.id as string);
  } catch { /* non-fatal */ }
}

export async function loadGuestJobs(): Promise<Record<string, unknown>[]> {
  try {
    const raw = await AsyncStorage.getItem(GUEST_JOBS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Load only guest jobs saved within the last 24 hours (for display on My Jobs).
export async function loadRecentGuestJobs(): Promise<Record<string, unknown>[]> {
  try {
    const raw = await AsyncStorage.getItem(GUEST_JOBS_KEY);
    const jobs: Record<string, unknown>[] = raw ? JSON.parse(raw) : [];
    const cutoff = Date.now() - GUEST_JOB_TTL_MS;
    return jobs.filter((j) => typeof j._savedAt === "number" && j._savedAt >= cutoff);
  } catch {
    return [];
  }
}

// Stores the full job payload for jobs created during an email-confirmation
// signup flow. The job is NOT inserted into Supabase until the email is
// confirmed (to avoid RLS issues with user_id = null). handleAuthCallback
// reads this, inserts with the confirmed user_id, then clears the entry.
const PENDING_JOB_DATA_KEY = "pending_job_insert_data";

export async function savePendingJobData(job: Record<string, unknown>): Promise<void> {
  try {
    await AsyncStorage.setItem(PENDING_JOB_DATA_KEY, JSON.stringify(job));
  } catch { /* non-fatal */ }
}

export async function loadAndClearPendingJobData(): Promise<Record<string, unknown> | null> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_JOB_DATA_KEY);
    await AsyncStorage.removeItem(PENDING_JOB_DATA_KEY).catch(() => {});
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const PENDING_CLAIM_KEY = "pending_claim_job_ids";

export async function addPendingClaimId(jobId: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_CLAIM_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    if (!ids.includes(jobId)) {
      await AsyncStorage.setItem(PENDING_CLAIM_KEY, JSON.stringify([...ids, jobId]));
    }
  } catch { /* non-fatal */ }
}

export async function loadAndClearPendingClaimIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_CLAIM_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    await AsyncStorage.removeItem(PENDING_CLAIM_KEY).catch(() => {});
    return ids;
  } catch {
    return [];
  }
}
