import * as SplashScreen from "expo-splash-screen";
import * as Linking from "expo-linking";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppProvider, useApp, type Job } from "@/lib/context";
import { colors } from "@/lib/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useCallback, Component } from "react";
import { View, Text } from "react-native";
import { registerPushToken, addNotificationResponseListener } from "@/lib/notifications";
import { supabase } from "@/lib/supabase";
import { loadGuestJobs } from "@/lib/guest-jobs";
import type { ReactNode } from "react";

// Keep the native splash screen visible until we explicitly hide it.
// Expo Router calls this automatically, but we call it here too as a belt-and-braces
// guard so it is definitely set before any component renders.
SplashScreen.preventAutoHideAsync();

// ─── Error boundary ──────────────────────────────────────────────────────────
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Log full details so the EAS build log / Metro console shows exactly where
    // the crash originated — essential for tracking down "undefined is not a function".
    console.error("[ErrorBoundary] caught:", error.message);
    console.error("[ErrorBoundary] stack:", error.stack);
    console.error("[ErrorBoundary] componentStack:", info.componentStack);
  }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      return (
        <View style={{ flex: 1, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Text style={{ color: colors.amber, fontSize: 18, fontWeight: "800", marginBottom: 12 }}>
            Something went wrong
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 8 }}>
            {err.message}
          </Text>
          {__DEV__ && (
            <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, textAlign: "left", lineHeight: 14, fontFamily: "monospace" }}>
              {err.stack?.slice(0, 600)}
            </Text>
          )}
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

    if (isRecovery) {
      // Password recovery — send the user to set a new password.
      // Do not claim guest jobs on this path.
      router.replace("/auth/reset-password");
      return;
    }

    // Email confirmation — claim any guest jobs submitted during the
    // pending-confirmation window (only rows with user_id = NULL).
    try {
      const saved = await loadGuestJobs();
      if (saved.length > 0) {
        const ids = saved.map((j) => j.id as string);
        await supabase
          .from("jobs")
          .update({ user_id: session.user.id })
          .in("id", ids)
          .is("user_id", null);
      }
    } catch (e) {
      console.warn("[auth-callback] guest job claim failed:", e);
    }

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
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) setIsAuthenticated(true);
        } catch { /* session restore is non-fatal */ }

        // Restore guest jobs from local AsyncStorage (no Supabase round-trip needed,
        // and avoids RLS issues where anon users can't SELECT their own guest rows).
        try {
          const saved = await loadGuestJobs();
          if (saved.length > 0) setJobs(saved as Job[]);
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
