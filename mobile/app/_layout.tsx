import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppProvider } from "@/lib/context";
import { colors } from "@/lib/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { useRouter, useSegments } from "expo-router";

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const segments = useSegments();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("onboarding_done").then((val) => {
      if (!val) {
        // Not yet done — navigate to onboarding
        router.replace("/onboarding");
      }
      setChecked(true);
    });
  }, []);

  if (!checked) return null;
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="light" />
      <OnboardingGate>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.navy } }}>
          <Stack.Screen name="onboarding"           options={{ animation: "fade" }} />
          <Stack.Screen name="(tabs)"               />
          <Stack.Screen name="inquiry"              options={{ animation: "slide_from_right" }} />
        </Stack>
      </OnboardingGate>
    </AppProvider>
  );
}
