import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppProvider } from "@/lib/context";
import { colors } from "@/lib/colors";

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.navy } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="inquiry" options={{ animation: "slide_from_right" }} />
      </Stack>
    </AppProvider>
  );
}
