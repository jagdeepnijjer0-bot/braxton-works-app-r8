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

// Store the full job object locally so we can restore without a Supabase round-trip.
// This avoids RLS issues where anon users can't SELECT their own guest jobs.
export async function persistGuestJob(job: Record<string, unknown>): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(GUEST_JOBS_KEY);
    const jobs: Record<string, unknown>[] = raw ? JSON.parse(raw) : [];
    const idx = jobs.findIndex((j) => j.id === job.id);
    if (idx >= 0) {
      jobs[idx] = job;
    } else {
      jobs.unshift(job);
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
