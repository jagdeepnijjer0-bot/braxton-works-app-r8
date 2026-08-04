import { Stack } from "expo-router";
import { colors } from "@/lib/colors";

export default function JobLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.navy } }} />
  );
}
