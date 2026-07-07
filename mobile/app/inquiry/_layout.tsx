import { Stack } from "expo-router";
import { colors } from "@/lib/colors";

export default function InquiryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown:    false,
        contentStyle:   { backgroundColor: colors.navy },
        animation:      "slide_from_right",
      }}
    />
  );
}
