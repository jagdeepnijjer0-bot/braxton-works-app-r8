import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { colors } from "@/lib/colors";
import { useApp } from "@/lib/context";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { useState } from "react";
import { persistGuestJobId } from "@/lib/guest-jobs";
import { registerPushToken } from "@/lib/notifications";

const WELCOME_MSG =
  "Thanks for your enquiry — we've received it and we're on it. Your job is now being assigned to one of our verified contractors. You can track every step by tapping My Jobs at the bottom of your screen. We'll message you here as soon as there's an update.";

export default function SignInScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { inquiry, addJob, setIsAuthenticated, pushToken, setPushToken } = useApp();

  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [loading,      setLoading]      = useState(false);
  const [resetSent,    setResetSent]    = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const canSubmit = email.trim() && password.length >= 1;

  const handleSignIn = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      if (authError.message.toLowerCase().includes("email not confirmed")) {
        setError("Please confirm your email address before signing in. Check your inbox for a confirmation link.");
      } else if (authError.message.toLowerCase().includes("invalid login")) {
        setError("Incorrect email or password. Please try again.");
      } else {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }

    setIsAuthenticated(true);

    // Came from the enquiry auth-gate — submit the pending enquiry then confirm
    if (from === "enquiry" && inquiry.category) {
      const jobId: string = crypto.randomUUID();
      const userId = data.session?.user?.id ?? null;

      const { error: jobError } = await supabase.from("jobs").insert({
        id:          jobId,
        user_id:     userId,
        type:        inquiry.type ?? "enquiry",
        category:    inquiry.category,
        description: inquiry.description,
        address:     inquiry.address,
        status:      "Enquiry Received",
        timing:      inquiry.timing,
        chosen_date: inquiry.chosenDate,
        source:      "app",
      });

      if (jobError) {
        console.error("Job insert error (sign-in path):", JSON.stringify(jobError));
        setError("Signed in, but couldn't submit your enquiry. Please try again from the home screen.");
        setLoading(false);
        return;
      }

      await persistGuestJobId(jobId);
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

      // Welcome message + push token (non-fatal)
      const token = pushToken ?? await registerPushToken(jobId).then((t) => {
        if (t) setPushToken(t);
        return t;
      });
      await Promise.allSettled([
        supabase.from("messages").insert({ job_id: jobId, body: WELCOME_MSG, sender: "contractor" }),
        token
          ? supabase.from("push_tokens").upsert({ job_id: jobId, token }, { onConflict: "token" })
          : Promise.resolve(),
      ]);

      setLoading(false);
      router.replace("/inquiry/confirmation");
      return;
    }

    // Came from Profile tab — return there
    setLoading(false);
    router.replace("/(tabs)/profile");
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Enter your email address above, then tap Forgot password.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
    } else {
      setResetSent(true);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <ArrowLeft color="rgba(255,255,255,0.5)" size={18} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Logo size={52} style={{ alignSelf: "center", marginBottom: 28 }} />

        <Text style={styles.title}>Welcome{"\n"}back</Text>
        <Text style={styles.sub}>Sign in to track your jobs and messages</Text>

        {[
          { label: "EMAIL",    value: email,    set: setEmail,    placeholder: "you@example.com",  kb: "email-address", secure: false },
          { label: "PASSWORD", value: password, set: setPassword, placeholder: "Your password",     kb: "default",       secure: true  },
        ].map(({ label, value, set, placeholder, kb, secure }) => (
          <View key={label} style={{ marginBottom: 18 }}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <TextInput
              value={value}
              onChangeText={set}
              placeholder={placeholder}
              placeholderTextColor="rgba(15,23,42,0.35)"
              keyboardType={kb as any}
              secureTextEntry={secure}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>
        ))}

        <TouchableOpacity onPress={handleForgotPassword} activeOpacity={0.75} style={styles.forgotWrap}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        {resetSent && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>Password reset email sent — check your inbox.</Text>
          </View>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        <Button
          label={loading ? "Signing in…" : "Sign In"}
          onPress={handleSignIn}
          disabled={!canSubmit || loading}
          style={{ marginTop: 8 }}
        />

        {loading && <ActivityIndicator color={colors.amber} style={{ marginTop: 16 }} />}

        <TouchableOpacity
          onPress={() => router.push("/inquiry/signup")}
          activeOpacity={0.75}
          style={styles.createWrap}
        >
          <Text style={styles.createText}>
            New here?{" "}
            <Text style={styles.createLink}>Create an account</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.navy },
  back:        { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 2 },
  backText:    { color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: "600" },
  content:     { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 48 },
  title:       { color: colors.white, fontSize: 38, fontWeight: "800", letterSpacing: -0.9, lineHeight: 44, marginBottom: 8 },
  sub:         { color: "rgba(255,255,255,0.4)", fontSize: 14, fontWeight: "500", marginBottom: 32 },
  fieldLabel:  { color: colors.amber, fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 10 },
  input: {
    backgroundColor:   colors.white,
    borderRadius:      18,
    paddingHorizontal: 18,
    paddingVertical:   16,
    fontSize:          15,
    color:             colors.navy,
    fontWeight:        "500",
    shadowColor:       "#000",
    shadowOpacity:     0.08,
    shadowRadius:      10,
    shadowOffset:      { width: 0, height: 4 },
    elevation:         3,
  },
  forgotWrap:    { alignSelf: "flex-end", marginBottom: 8 },
  forgotText:    { color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: "600" },
  successBanner: { backgroundColor: "rgba(16,185,129,0.12)", borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "rgba(16,185,129,0.25)" },
  successText:   { color: "#10B981", fontSize: 13, fontWeight: "600", lineHeight: 19 },
  error:         { color: "#EF4444", fontSize: 13, fontWeight: "600", marginBottom: 12, lineHeight: 19 },
  createWrap:    { marginTop: 28, alignItems: "center" },
  createText:    { color: "rgba(255,255,255,0.35)", fontSize: 14, fontWeight: "500" },
  createLink:    { color: colors.amber, fontWeight: "700" },
});
