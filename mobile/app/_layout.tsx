import "@/lib/polyfills"; // crypto polyfill — must be first
import * as SplashScreen from "expo-splash-screen";
import * as Linking from "expo-linking";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppProvider, useApp, type Job } from "@/lib/context";
import { colors } from "@/lib/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useCallback, Component } from "react";
import { View, Text, ScrollView } from "react-native";
import { registerPushToken, addNotificationResponseListener } from "@/lib/notifications";
import { supabase } from "@/lib/supabase";
import { loadAndClearPendingJobData, loadRecentGuestJobs } from "@/lib/guest-jobs";
import { uploadJobPhotos } from "@/lib/photo-upload";
import type { ReactNode } from "react";

// Keep the native splash screen visible until we explicitly hide it.
// Expo Router calls this automatically, but we call it here too as a belt-and-braces
// guard so it is definitely set before any component renders.
SplashScreen.preventAutoHideAsync();

// ─── Error boundary ──────────────────────────────────────────────────────────
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null; componentStack: string }
> {
  state = { error: null, componentStack: "" };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary] caught:", error.message);
    console.error("[ErrorBoundary] stack:", error.stack);
    console.error("[ErrorBoundary] componentStack:", info.componentStack);
    this.setState({ componentStack: info.componentStack ?? "" });
  }
  render() {
    if (this.state.error) {
      const err  = this.state.error as Error;
      const body = [
        "── MESSAGE ──",
        err.message ?? "(none)",
        "",
        "── JS STACK ──",
        err.stack    ?? "(none)",
        "",
        "── COMPONENT STACK ──",
        this.state.componentStack || "(none)",
      ].join("\n");
      return (
        <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
          {/* Fixed header */}
          <View style={{ paddingTop: 60, paddingHorizontal: 16, paddingBottom: 10, backgroundColor: "#0f172a" }}>
            <Text style={{ color: "#F59E0B", fontSize: 15, fontWeight: "800", marginBottom: 4 }}>
              App crash — screenshot this screen
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
              Scroll down to read the full stack trace
            </Text>
          </View>
          {/* Scrollable stack dump */}
          <ScrollView
            style={{ flex: 1, backgroundColor: "#020617" }}
            contentContainerStyle={{ padding: 12 }}
            showsVerticalScrollIndicator
          >
            <Text
              selectable
              style={{ color: "#e2e8f0", fontSize: 10.5, lineHeight: 15, fontFamily: "monospace" }}
            >
              {body}
            </Text>
          </ScrollView>
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
  const { setPushToken, setJobs, setIsAuthenticated, setGuestMode, setEmailPendingConfirmation } = useApp();

  const fetchUserJobs = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, type, category, description, address, status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (!error && data) {
        setJobs(data.map((row) => ({
          id:          row.id,
          type:        row.type,
          category:    row.category,
          description: row.description,
          address:     row.address,
          status:      row.status,
          date:        row.created_at,
          photos:      [],
          updates:     [],
        })) as Job[]);
      }
    } catch { /* non-fatal */ }
  };

  // Handle tradenest://auth/callback deep links from Supabase confirmation emails.
  // Supabase sends tokens in the URL fragment (implicit flow): #access_token=...
  // or as a query param (PKCE flow): ?code=...
  // We handle both so the behaviour is correct regardless of Supabase project settings.
  const handleAuthCallback = useCallback(async (url: string) => {
    if (!url.includes("auth/callback")) return;

    // Detect the flow type before exchanging tokens.
    // For implicit flow Supabase puts type=recovery in the hash fragment;
    // for PKCE it appears as a query param.
    const fragment   = url.split("#")[1] ?? "";
    const hashParams = new URLSearchParams(fragment);
    const queryPart  = url.split("?")[1]?.split("#")[0] ?? "";
    const queryParams = new URLSearchParams(queryPart);
    const flowType   = hashParams.get("type") ?? queryParams.get("type") ?? "";
    const isRecovery = flowType === "recovery";

    let session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"] = null;

    try {
      if (url.includes("code=")) {
        // PKCE flow — authorization code in query string
        const { data, error } = await supabase.auth.exchangeCodeForSession(url);
        if (!error && data.session) session = data.session;
      } else {
        // Implicit flow — tokens in hash fragment
        const accessToken  = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          if (!error && data.session) session = data.session;
        }
      }
    } catch (e) {
      console.error("[auth-callback] failed to exchange session:", e);
      return;
    }

    if (!session) return;

    setIsAuthenticated(true);
    setEmailPendingConfirmation(false);

    if (isRecovery) {
      // Password recovery — send the user to set a new password.
      // Do not claim guest jobs on this path.
      router.replace("/auth/reset-password");
      return;
    }

    // Email confirmation — insert the pending job (saved locally during signup)
    // with the now-confirmed user_id. Inserting with the correct user_id avoids
    // the RLS issue where UPDATE on user_id=null rows is blocked.
    try {
      const pendingJob = await loadAndClearPendingJobData();
      if (pendingJob) {
        // Strip the local-only _photo_uris field before inserting into Supabase.
        const photoUris: string[] = Array.isArray(pendingJob._photo_uris)
          ? (pendingJob._photo_uris as string[])
          : [];
        const { _photo_uris: _ignored, ...jobPayload } = pendingJob;

        const { error: insertErr } = await supabase.from("jobs").insert({
          ...jobPayload,
          user_id: session.user.id,
        });
        if (insertErr) {
          console.warn("[auth-callback] pending job insert failed:", insertErr.message);
        } else {
          // Upload photos and send welcome message (both fire-and-forget).
          if (photoUris.length > 0) {
            uploadJobPhotos(
              pendingJob.id as string,
              photoUris,
              `${session.user.id}/${pendingJob.id}`
            ).catch(() => {});
          }
          supabase.from("messages")
            .insert({
              job_id: pendingJob.id,
              body:   "Thanks for your enquiry — we've received it and we're on it. Your job is now being assigned to one of our verified contractors. You can track every step by tapping My Jobs at the bottom of your screen. We'll message you here as soon as there's an update.",
              sender: "contractor",
            })
            .catch(() => {});
        }
      }
    } catch (e) {
      console.warn("[auth-callback] pending job insert failed:", e);
    }

    await fetchUserJobs(session.user.id);

    router.replace("/(tabs)/profile");
  }, []);

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

        // Check if the app was cold-launched via a confirmation deep link.
        // This handles the case where the app wasn't running when the user
        // tapped the email link.
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) await handleAuthCallback(initialUrl);

        // Restore auth session (best-effort — non-fatal if it fails/hangs).
        // If getSession returns an error (e.g. stale/invalid refresh token left
        // by a partial sign-out), clear the local session so subsequent auth
        // calls start clean rather than hitting "Invalid Refresh Token".
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            // Only sign out on auth-specific errors that indicate an unrecoverable
            // session (e.g. invalid refresh token stored locally). Do NOT sign out
            // on network/timeout errors — that would clear a valid session just
            // because the device had no connectivity at launch.
            const msg = error.message?.toLowerCase() ?? "";
            const isAuthError = msg.includes("refresh token") || msg.includes("invalid") || msg.includes("expired");
            if (isAuthError) {
              console.warn("[boot] unrecoverable session, clearing:", error.message);
              await supabase.auth.signOut({ scope: "local" }).catch(() => {});
            } else {
              console.warn("[boot] session check error (keeping session):", error.message);
            }
          } else if (session) {
            setIsAuthenticated(true);
            // Fetch authenticated user's jobs from Supabase on boot.
            await fetchUserJobs(session.user.id);
          } else {
            // Guest: restore only recent (under-24h) enquiries from this device.
            try {
              const recent = await loadRecentGuestJobs();
              if (recent.length > 0) setJobs(recent as Job[]);
            } catch { /* non-fatal */ }
          }
        } catch { /* session restore is non-fatal */ }

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

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user?.id) {
        // Clear guest mode — signed-in users are not guests.
        setGuestMode(false);
        // Replace jobs with this user's own Supabase jobs — never merge with guest/stale jobs.
        fetchUserJobs(session.user.id);
      } else if (event === "SIGNED_OUT") {
        // Clear authenticated jobs immediately, then restore any recent guest jobs.
        // A signed-in account's jobs must not appear after sign-out.
        loadRecentGuestJobs()
          .then((recent) => setJobs(recent.length > 0 ? (recent as Job[]) : []))
          .catch(() => setJobs([]));
      }
    });

    // Listen for deep links while the app is already open (foreground / background).
    const linkingSub = Linking.addEventListener("url", ({ url }) => {
      handleAuthCallback(url);
    });

    const notifSub = addNotificationResponseListener((jobId) => {
      if (jobId) router.push("/(tabs)/jobs");
      else        router.push("/(tabs)/messages");
    });

    return () => {
      clearTimeout(timeout);
      authSub.unsubscribe();
      linkingSub.remove();
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
            <Stack.Screen name="auth"       options={{ animation: "slide_from_bottom" }} />
            <Stack.Screen name="job"        options={{ animation: "slide_from_right" }} />
          </Stack>
        </AppBootstrap>
      </AppProvider>
    </ErrorBoundary>
  );
}
