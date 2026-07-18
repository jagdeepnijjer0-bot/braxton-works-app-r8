import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppProvider, useApp, type Job } from "@/lib/context";
import { colors } from "@/lib/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState, Component } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { registerPushToken, addNotificationResponseListener } from "@/lib/notifications";
import { supabase } from "@/lib/supabase";
import { loadGuestJobIds } from "@/lib/guest-jobs";
import type { ReactNode } from "react";

// ─── Error boundary ──────────────────────────────────────────────────────────
// Catches render-time throws that would otherwise produce a black screen.
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Text style={{ color: colors.amber, fontSize: 18, fontWeight: "800", marginBottom: 12 }}>Something went wrong</Text>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, textAlign: "center", lineHeight: 20 }}>
            {(this.state.error as Error).message}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// ─── Boot loading screen ──────────────────────────────────────────────────────
function BootScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={colors.amber} size="large" />
    </View>
  );
}

// ─── App bootstrap ────────────────────────────────────────────────────────────
function AppBootstrap({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { setPushToken, setJobs, setIsAuthenticated } = useApp();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Hard timeout — if anything in boot hangs, render the app after 8 s rather
    // than staying on a loading screen forever.
    const timeout = setTimeout(() => setChecked(true), 8_000);

    const boot = async () => {
      try {
        // In dev always re-show onboarding so the flow stays exercisable.
        if (__DEV__) await AsyncStorage.removeItem("onboarding_done");

        const done = await AsyncStorage.getItem("onboarding_done");
        if (!done) {
          // Navigate to onboarding immediately; rest of boot still runs in
          // the background (non-blocking for route decision).
          router.replace("/onboarding");
        }

        // Restore auth session (may trigger a token refresh — non-fatal if it fails).
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) setIsAuthenticated(true);
        } catch { /* session restore is best-effort */ }

        // Restore guest jobs from AsyncStorage → re-fetch from Supabase.
        try {
          const guestIds = await loadGuestJobIds();
          if (guestIds.length > 0) {
            const { data, error } = await supabase
              .from("jobs")
              .select("id, type, category, description, address, status, created_at")
              .in("id", guestIds);
            if (!error && data && data.length > 0) {
              const restored: Job[] = data.map((row: any) => ({
                id:          row.id,
                type:        row.type,
                category:    row.category,
                description: row.description,
                address:     row.address,
                status:      row.status,
                date:        row.created_at,
                photos:      [],
                updates:     [],
              }));
              setJobs(restored);
            }
          }
        } catch { /* guest job restore is non-fatal */ }

        // Register push token after the rest of boot (fire-and-forget).
        registerPushToken().then((t) => { if (t) setPushToken(t); });
      } catch (e) {
        // Log unexpected boot errors; the finally block still unblocks rendering.
        console.error("[boot] unexpected error:", e);
      } finally {
        clearTimeout(timeout);
        setChecked(true);
      }
    };

    boot();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    const notifSub = addNotificationResponseListener((jobId) => {
      if (jobId) router.push("/(tabs)/jobs");
      else        router.push("/(tabs)/messages");
    });

    return () => {
      clearTimeout(timeout);
      authSub.unsubscribe();
      notifSub.remove();
    };
  }, []);

  if (!checked) return <BootScreen />;
  return <>{children}</>;
}

// ─── Root layout ──────────────────────────────────────────────────────────────
export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <StatusBar style="light" />
        <AppBootstrap>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.navy } }}>
            <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
            <Stack.Screen name="(tabs)"     />
            <Stack.Screen name="inquiry"    options={{ animation: "slide_from_right" }} />
          </Stack>
        </AppBootstrap>
      </AppProvider>
    </ErrorBoundary>
  );
}
