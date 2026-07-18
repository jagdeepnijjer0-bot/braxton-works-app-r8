import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppProvider, useApp, type Job } from "@/lib/context";
import { colors } from "@/lib/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { registerPushToken, addNotificationResponseListener } from "@/lib/notifications";
import { supabase } from "@/lib/supabase";
import { loadGuestJobIds } from "@/lib/guest-jobs";

// Force class-based dark mode so the app always uses its navy theme
// regardless of the user's system dark mode setting.
StyleSheet.setFlag?.("darkMode", "class");

function AppBootstrap({ children }: { children: React.ReactNode }) {
  const router                          = useRouter();
  const { setPushToken, setJobs, setIsAuthenticated } = useApp();
  const [checked, setChecked]           = useState(false);

  useEffect(() => {
    const boot = async () => {
      // Always show onboarding in dev
      if (__DEV__) await AsyncStorage.removeItem("onboarding_done");

      const done = await AsyncStorage.getItem("onboarding_done");
      if (!done) router.replace("/onboarding");

      // Restore auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setIsAuthenticated(true);

      // Restore guest jobs from AsyncStorage → fetch fresh data from Supabase
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
      } catch { /* non-fatal */ }

      setChecked(true);

      // Register push token (non-blocking)
      registerPushToken().then((t) => { if (t) setPushToken(t); });
    };

    boot();

    // Listen for auth changes (sign in / sign out)
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    // Open relevant screen when user taps a notification
    const sub = addNotificationResponseListener((jobId) => {
      if (jobId) router.push("/(tabs)/jobs");
      else        router.push("/(tabs)/messages");
    });

    return () => {
      authSub.unsubscribe();
      sub.remove();
    };
  }, []);

  if (!checked) return null;
  return <>{children}</>;
}

export default function RootLayout() {
  return (
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
  );
}
