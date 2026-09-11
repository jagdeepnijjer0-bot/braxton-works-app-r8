import "@/lib/polyfills"; // crypto polyfill - must be first
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
import { loadAndClearPendingJobData, loadRecentGuestJobs, persistGuestJob } from "@/lib/guest-jobs";
import { uploadJobPhotos } from "@/lib/photo-upload";
import type { ReactNode } from "react";

SplashScreen.preventAutoHideAsync();

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
  componentStack: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, componentStack: "" };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary] caught:", error.message);
    console.error("[ErrorBoundary] stack:", error.stack);
    console.error("[ErrorBoundary] componentStack:", info.componentStack);
    this.setState({ componentStack: info.componentStack ?? "" });
  }

  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      const body = [
        "-- MESSAGE --",
        err.message ?? "(none)",
        "",
        "-- JS STACK --",
        err.stack ?? "(none)",
        "",
        "-- COMPONENT STACK --",
        this.state.componentStack || "(none)",
      ].join("\n");
      return (
        <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
          <View style={{ paddingTop: 60, paddingHorizontal: 16, paddingBottom: 10, backgroundColor: "#0f172a" }}>
            <Text style={{ color: "#F59E0B", fontSize: 15, fontWeight: "800", marginBottom: 4 }}>
              App crash - screenshot this screen
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
              Scroll down to read the full stack trace
            </Text>
          </View>
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

function AppBootstrap({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { setPushToken, setJobs, setIsAuthenticated, setGuestMode, setEmailPendingConfirmation } = useApp();

  const fetchUserJobs = async (userId: string): Promise<string[]> => {
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
        return data.map((row) => row.id as string);
      }
    } catch { /* non-fatal */ }
    return [];
  };

  const handleAuthCallback = useCallback(async (url: string) => {
    if (!url.includes("auth/callback")) return;

    const fragment   = url.split("#")[1] ?? "";
    const hashParams = new URLSearchParams(fragment);
    const queryPart  = url.split("?")[1]?.split("#")[0] ?? "";
    const queryParams = new URLSearchParams(queryPart);
    const flowType   = hashParams.get("type") ?? queryParams.get("type") ?? "";
    const isRecovery = flowType === "recovery";

    let session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"] = null;

    try {
      if (url.includes("code=")) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(url);
        if (error) console.warn("[auth-callback] exchangeCodeForSession error:", error.message);
        if (!error && data.session) session = data.session;
      } else {
        const accessToken  = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          if (error) console.warn("[auth-callback] setSession error:", error.message);
          if (!error && data.session) session = data.session;
        }
      }
    } catch (e) {
      console.error("[auth-callback] failed to exchange session:", e);
    }

    if (!session) {
      try {
        const { data: { session: existing } } = await supabase.auth.getSession();
        if (existing) session = existing;
      } catch (e) {
        console.warn("[auth-callback] getSession fallback failed:", e);
      }
    }

    if (!session) return;

    setIsAuthenticated(true);
    setGuestMode(false);
    setEmailPendingConfirmation(false);

    if (isRecovery) {
      router.replace("/auth/reset-password");
      return;
    }

    try {
      const pendingJob = await loadAndClearPendingJobData();
      if (pendingJob) {
        const photos = Array.isArray(pendingJob._photos) ? pendingJob._photos as import("@/lib/context").InquiryPhoto[] : [];
        const { _photos: _ignored, ...jobPayload } = pendingJob;

        const { error: insertErr } = await supabase.from("jobs").insert({
          ...jobPayload,
          user_id: session.user.id,
        });
        if (insertErr) {
          console.warn("[auth-callback] pending job insert failed:", insertErr.message);
        } else {
          if (photos.length > 0) {
            uploadJobPhotos(
              pendingJob.id as string,
              photos,
              `${session.user.id}/${pendingJob.id}`
            ).catch((e) => console.error("[auth-callback] photo upload error:", e));
          }
          supabase.from("messages")
            .insert({
              job_id: pendingJob.id,
              body:   "Thanks for your enquiry - we've received it and we're on it. Your job is now being assigned to one of our verified contractors. You can track every step by tapping My Jobs at the bottom of your screen. We'll message you here as soon as there's an update.",
              sender: "contractor",
            })
            .catch(() => {});
        }
      }
    } catch (e) {
      console.warn("[auth-callback] pending job insert failed:", e);
    }

    await fetchUserJobs(session.user.id);

    try {
      const raw = await AsyncStorage.getItem("pending_marketing_consent");
      await AsyncStorage.removeItem("pending_marketing_consent").catch(() => {});
      if (raw !== null) {
        const consent = JSON.parse(raw) as boolean;
        supabase.from("user_profiles").upsert(
          {
            user_id:              session.user.id,
            marketing_consent:    consent,
            marketing_consent_at: consent ? new Date().toISOString() : null,
          },
          { onConflict: "user_id" }
        ).then(({ error: e }) => { if (e) console.warn("[auth-callback] marketing consent write error:", e.message); })
         .catch(() => {});
      }
    } catch (e) {
      console.warn("[auth-callback] marketing consent restore failed:", e);
    }

    router.replace("/(tabs)/profile");
  }, []);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      await SplashScreen.hideAsync().catch(() => {});
    }, 8_000);

    const boot = async () => {
      try {
        if (__DEV__) await AsyncStorage.removeItem("onboarding_done");

        const done = await AsyncStorage.getItem("onboarding_done");
        if (!done) {
          router.replace("/onboarding");
        }

        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) await handleAuthCallback(initialUrl);

        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
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
            await fetchUserJobs(session.user.id);
            registerPushToken().then((t) => { if (t) setPushToken(t); });
          } else {
            let guestIds: string[] = [];
            try {
              const recent = await loadRecentGuestJobs();
              if (recent.length > 0) {
                setJobs(recent as Job[]);
                guestIds = recent.map((j) => j.id as string).filter(Boolean);
                if (guestIds.length > 0) {
                  supabase
                    .from("jobs")
                    .select("id, status")
                    .in("id", guestIds)
                    .then(({ data }) => {
                      if (!data) return;
                      const statusMap: Record<string, string> = {};
                      for (const row of data) statusMap[row.id] = row.status;
                      setJobs((prev) =>
                        prev.map((j) =>
                          statusMap[j.id] ? { ...j, status: statusMap[j.id] } : j
                        )
                      );
                      for (const job of recent) {
                        const live = statusMap[job.id as string];
                        if (live && live !== job.status) {
                          persistGuestJob({ ...job, status: live });
                        }
                      }
                    })
                    .catch(() => { /* non-fatal */ });
                }
              }
            } catch { /* non-fatal */ }
            registerPushToken()
              .then((t) => {
                if (!t) return;
                setPushToken(t);
                if (guestIds.length > 0) {
                  const rows = guestIds.map((job_id) => ({ token: t, job_id }));
                  supabase.from("push_tokens")
                    .upsert(rows, { onConflict: "token,job_id" })
                    .catch(() => {});
                }
              })
              .catch(() => {});
          }
        } catch { /* session restore is non-fatal */ }
      } catch (e) {
        console.error("[boot] unexpected error:", e);
      } finally {
        clearTimeout(timeout);
        await SplashScreen.hideAsync().catch(() => {});
      }
    };

    boot();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user?.id) {
        setGuestMode(false);
        fetchUserJobs(session.user.id).then(() => {
          registerPushToken().catch(() => {});
        });
      } else if (event === "SIGNED_OUT") {
        loadRecentGuestJobs()
          .then((recent) => setJobs(recent.length > 0 ? (recent as Job[]) : []))
          .catch(() => setJobs([]));
      }
    });

    const linkingSub = Linking.addEventListener("url", ({ url }) => {
      handleAuthCallback(url);
    });

    const notifSub = addNotificationResponseListener((jobId) => {
      if (jobId) router.push(`/job/${jobId}`);
      else        router.push("/(tabs)/messages");
    });

    return () => {
      clearTimeout(timeout);
      authSub.unsubscribe();
      linkingSub.remove();
      notifSub.remove();
    };
  }, []);

  return <>{children}</>;
}

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