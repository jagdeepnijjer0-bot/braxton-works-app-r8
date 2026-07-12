import AsyncStorage from "@react-native-async-storage/async-storage";

export const GUEST_JOB_IDS_KEY = "guest_job_ids";

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
