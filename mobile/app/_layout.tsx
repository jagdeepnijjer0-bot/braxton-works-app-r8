import * as SplashScreen from "expo-splash-screen";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppProvider, useApp, type Job } from "@/lib/context";
import { colors } from "@/lib/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, Component } from "react";
import { View, Text } from "react-native";
import { registerPushToken, addNotificationResponseListener } from "@/lib/notifications";
import { supabase } from "@/lib/supabase";
import { loadGuestJobIds } from "@/lib/guest-jobs";
import type { ReactNode } from "react";

// Keep the native splash screen visible until we explicitly hide it.
// Expo Router calls this automatically, but we call it here too as a belt-and-braces
// guard so it is definitely set before any component renders.
SplashScreen.preventAutoHideAsync();

// ─── Error boundary ──────────────────────────────────────────────────────────
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Text style={{ color: colors.amber, fontSize: 18, fontWeight: "800", marginBottom: 12 }}>
            Something went wrong
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, textAlign: "center", lineHeight: 20 }}>
            {(this.state.error as Error).message}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// ─── App bootstrap ────────────────────────────────────────────────────────────
// IMPORTANT: always renders {children} — the <Stack> must be mounted from the
// very first render so Expo Router can resolve routes and handle navigation.
// We extend the native splash screen instead of showing a JS loading screen,
// so the user sees the proper branded splash (not a frozen spinner) during boot.
function AppBootstrap({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { setPushToken, setJobs, setIsAuthenticated } = useApp();

  useEffect(() => {
    // Hard timeout: if anything in boot hangs, hide the splash after 8 s so
    // the user can at least interact with the app.
    const timeout = setTimeout(async () => {
      await SplashScreen.hideAsync().catch(() => {});
    }, 8_000);

    const boot = async () => {
      try {
        // In dev always re-show onboarding so the flow stays exercisable.
        if (__DEV__) await AsyncStorage.removeItem("onboarding_done");

        const done = await AsyncStorage.getItem("onboarding_done");
        if (!done) {
          // Navigate before hiding splash so there's no flash of the tab bar.
          router.replace("/onboarding");
        }

        // Restore auth session (best-effort — non-fatal if it fails/hangs).
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) setIsAuthenticated(true);
        } catch { /* session restore is non-fatal */ }

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

        // Push token registration is fire-and-forget (non-blocking).
        registerPushToken().then((t) => { if (t) setPushToken(t); });
      } catch (e) {
        console.error("[boot] unexpected error:", e);
      } finally {
        clearTimeout(timeout);
        // Dismiss the splash now that we know where to route the user.
        await SplashScreen.hideAsync().catch(() => {});
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

  // Always render children — never return null or replace with a spinner here.
  // The Stack must be mounted from the first render for Expo Router to work.
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
