import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/lib/colors";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { useApp } from "@/lib/context";

export default function AuthGateScreen() {
  const router = useRouter();
  const { inquiry, addJob } = useApp();

  const submitInquiry = () => {
    addJob({
      id:          Date.now().toString(),
      type:        inquiry.type ?? "inquiry",
      category:    inquiry.category,
      description: inquiry.description,
      address:     inquiry.address,
      status:      "New",
      date:        new Date().toISOString(),
      photos:      inquiry.photos,
      updates:     [],
    });
  };

  const handleGuest = () => {
    submitInquiry();
    router.replace("/inquiry/confirmation");
  };

  const handleCreateAccount = () => {
    router.push("/inquiry/signup");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Logo size={72} />

        <Text style={styles.heading}>Almost{"\n"}there</Text>
        <Text style={styles.sub}>
          Create an account to track your job and get updates, or continue as a guest
        </Text>

        <View style={styles.buttons}>
          <Button
            label="Create Account"
            onPress={handleCreateAccount}
            style={{ marginBottom: 12 }}
          />
          <Button
            label="Continue as Guest"
            onPress={handleGuest}
            variant="secondary"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.navy },
  center:  { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  heading: { color: colors.white, fontSize: 44, fontWeight: "800", textAlign: "center", letterSpacing: -1.2, lineHeight: 50, marginTop: 32, marginBottom: 16 },
  sub:     { color: "rgba(255,255,255,0.5)", fontSize: 15, textAlign: "center", lineHeight: 24, marginBottom: 48 },
  buttons: { width: "100%" },
});
