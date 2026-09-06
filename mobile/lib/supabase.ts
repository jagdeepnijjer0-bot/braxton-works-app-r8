import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = process.env.EXPO_PUBLIC_SUPABASE_URL  ?? "";
const supabaseAnon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Surface misconfiguration visibly instead of letting every call hang silently.
if (!supabaseUrl || !supabaseAnon) {
  console.error(
    "[supabase] EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY is not set. " +
    "All network calls will fail. Check your EAS environment variables."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    storage:            AsyncStorage,
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: false,
  },
});

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnon);

/** Races a promise against a timeout. Rejects with Error("timeout") if ms elapses first. */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}
