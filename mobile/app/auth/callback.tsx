import { View, ActivityIndicator } from "react-native";
import { colors } from "@/lib/colors";

// Blank loading screen rendered while handleAuthCallback (in _layout.tsx)
// processes the tradenest://auth/callback deep link and redirects away.
// Without this screen Expo Router shows a 404 flash before the redirect fires.
export default function AuthCallbackScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={colors.amber} size="large" />
    </View>
  );
}
