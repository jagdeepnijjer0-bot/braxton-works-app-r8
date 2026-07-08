import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/lib/colors";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { useApp } from "@/lib/context";
import { supabase } from "@/lib/supabase";
import { registerPushToken } from "@/lib/notifications";

const WELCOME_MSG =
  "Thanks for your enquiry — we've received it and we're on it. Your job is now being assigned to one of our verified contractors. You can track every step by tapping My Jobs at the bottom of your screen. We'll message you here as soon as there's an update.";

export default function AuthGateScreen() {
  const router = useRouter();
  const { inquiry, addJob, pushToken, setPushToken } = useApp();

  const submitEnquiry = async () => {
    const jobId = Date.now().toString();

    addJob({
      id:          jobId,
      type:        inquiry.type ?? "enquiry",
      category:    inquiry.category,
      description: inquiry.description,
      address:     inquiry.address,
      status:      "Enquiry Received",
      date:        new Date().toISOString(),
      photos:      inquiry.photos,
      updates:     [],
    });

    // Fire-and-forget: welcome message + push token storage
    const token = pushToken ?? await registerPushToken(jobId).then((t) => {
      if (t) setPushToken(t);
      return t;
    });

    await Promise.allSettled([
      supabase.from("messages").insert({
        job_id:  jobId,
        body:    WELCOME_MSG,
        sender:  "contractor",
      }),
      token
        ? supabase.from("push_tokens").upsert({ job_id: jobId, token }, { onConflict: "token" })
        : Promise.resolve(),
    ]);

    return jobId;
  };

  const handleGuest = async () => {
    await submitEnquiry();
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
  sub:     { color: colors.muted, fontSize: 15, fontWeight: "400", textAlign: "center", lineHeight: 24, marginBottom: 48 },
  buttons: { width: "100%" },
});
