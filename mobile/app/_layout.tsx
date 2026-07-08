import "../global.css";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppProvider, useApp } from "@/lib/context";
import { colors } from "@/lib/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { registerPushToken, addNotificationResponseListener } from "@/lib/notifications";

// Force class-based dark mode so the app always uses its navy theme
// regardless of the user's system dark mode setting.
StyleSheet.setFlag?.("darkMode", "class");

function AppBootstrap({ children }: { children: React.ReactNode }) {
  const router               = useRouter();
  const { setPushToken }     = useApp();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const boot = async () => {
      // Always show onboarding in dev
      if (__DEV__) await AsyncStorage.removeItem("onboarding_done");

      const done = await AsyncStorage.getItem("onboarding_done");
      if (!done) router.replace("/onboarding");
      setChecked(true);

      // Register push token (non-blocking)
      registerPushToken().then((t) => { if (t) setPushToken(t); });
    };
    boot();

    // Open relevant screen when user taps a notification
    const sub = addNotificationResponseListener((jobId) => {
      if (jobId) router.push("/(tabs)/jobs");
      else        router.push("/(tabs)/messages");
    });
    return () => sub.remove();
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
