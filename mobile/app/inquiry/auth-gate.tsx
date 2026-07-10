import { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/lib/colors";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { useApp } from "@/lib/context";
import { supabase } from "@/lib/supabase";
import { registerPushToken } from "@/lib/notifications";
import { persistGuestJobId } from "@/app/_layout";

const WELCOME_MSG =
  "Thanks for your enquiry — we've received it and we're on it. Your job is now being assigned to one of our verified contractors. You can track every step by tapping My Jobs at the bottom of your screen. We'll message you here as soon as there's an update.";

export default function AuthGateScreen() {
  const router = useRouter();
  const { inquiry, addJob, pushToken, setPushToken } = useApp();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const submitEnquiry = async (): Promise<string | null> => {
    // Generate UUID client-side so we never need to .select() the row back
    // (selecting back requires RLS read permission which guests don't have)
    const jobId: string = crypto.randomUUID();

    const { error: insertError } = await supabase
      .from("jobs")
      .insert({
        id:          jobId,
        type:        inquiry.type ?? "enquiry",
        category:    inquiry.category,
        description: inquiry.description,
        address:     inquiry.address,
        status:      "Enquiry Received",
        timing:      inquiry.timing,
        chosen_date: inquiry.chosenDate,
        guest_name:  inquiry.name || null,
        guest_phone: inquiry.phone || null,
        guest_contact_preference: inquiry.contactPreference || null,
        source:      "app",
        // No user_id — guest path never has an active session
      });

    if (insertError) {
      console.error("Job insert error:", JSON.stringify(insertError));
      return null;
    }

    // Persist the ID so it survives web page refresh
    await persistGuestJobId(jobId);

    // Update local state with the real DB id
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

    // Fire-and-forget: welcome message + push token (non-fatal)
    const token = pushToken ?? await registerPushToken(jobId).then((t) => {
      if (t) setPushToken(t);
      return t;
    });

    await Promise.allSettled([
      supabase.from("messages").insert({
        job_id: jobId,
        body:   WELCOME_MSG,
        sender: "contractor",
      }),
      token
        ? supabase.from("push_tokens").upsert({ job_id: jobId, token }, { onConflict: "token" })
        : Promise.resolve(),
    ]);

    return jobId;
  };

  const handleGuest = async () => {
    setLoading(true);
    setError(null);
    const jobId = await submitEnquiry();
    setLoading(false);
    if (!jobId) {
      setError("Something went wrong submitting your enquiry. Please try again.");
      return;
    }
    router.replace("/inquiry/confirmation");
  };

  const handleSignIn = () => {
    router.push("/inquiry/signin?from=enquiry");
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

        {error && (
          <Text style={styles.error}>{error}</Text>
        )}

        <View style={styles.buttons}>
          <Button
            label="Create Account"
            onPress={handleCreateAccount}
            disabled={loading}
            style={{ marginBottom: 12 }}
          />
          <Button
            label="Sign In"
            onPress={handleSignIn}
            variant="secondary"
            disabled={loading}
            style={{ marginBottom: 12 }}
          />
          <Button
            label={loading ? "Submitting…" : "Continue as Guest"}
            onPress={handleGuest}
            variant="secondary"
            disabled={loading}
          />
        </View>

        {loading && <ActivityIndicator color={colors.amber} style={{ marginTop: 20 }} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.navy },
  center:  { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  heading: { color: colors.white, fontSize: 44, fontWeight: "800", textAlign: "center", letterSpacing: -1.2, lineHeight: 50, marginTop: 32, marginBottom: 16 },
  sub:     { color: colors.muted, fontSize: 15, fontWeight: "400", textAlign: "center", lineHeight: 24, marginBottom: 24 },
  error:   { color: "#EF4444", fontSize: 14, fontWeight: "600", textAlign: "center", marginBottom: 20, lineHeight: 20 },
  buttons: { width: "100%" },
});
