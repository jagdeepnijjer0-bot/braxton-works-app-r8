import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Check } from "lucide-react-native";
import { colors } from "@/lib/colors";
import { useApp } from "@/lib/context";
import { supabase, withTimeout, isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

const WELCOME_MSG =
  "Thanks for your enquiry — we've received it and we're on it. Your job is now being assigned to one of our verified contractors. You can track every step by tapping My Jobs at the bottom of your screen. We'll message you here as soon as there's an update.";

const TIMEOUT_MS = 10_000;

export default function SignUpScreen() {
  const router = useRouter();
  const { inquiry, addJob, setIsAuthenticated } = useApp();

  const [name,            setName]            = useState(inquiry.name);
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState<string | null>(null);

  const canSubmit = name.trim() && email.trim() && password.length >= 6;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (!isSupabaseConfigured) {
      setError("App is not configured correctly. Please contact support.");
      return;
    }

    setLoading(true);
    setError(null);

    // ── Sign up ───────────────────────────────────────────────────────────
    let authData: Awaited<ReturnType<typeof supabase.auth.signUp>>["data"];
    try {
      const result = await withTimeout(
        supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: name } } }),
        TIMEOUT_MS
      );
      if (result.error) {
        setError(result.error.message);
        setLoading(false);
        return;
      }
      authData = result.data;
    } catch (e: any) {
      setError(e?.message ?? "Sign-up request timed out. Check your connection and try again.");
      setLoading(false);
      return;
    }

    setIsAuthenticated(true);

    // ── Job insert ────────────────────────────────────────────────────────
    const jobId: string = crypto.randomUUID();
    const userId = authData.session?.user?.id ?? null;

    try {
      const { error: jobError } = await withTimeout(
        supabase.from("jobs").insert({
          id:          jobId,
          user_id:     userId,
          type:        inquiry.type ?? "enquiry",
          category:    inquiry.category,
          description: inquiry.description,
          address:     inquiry.address,
          status:      "Enquiry Received",
          timing:      inquiry.timing,
          chosen_date: inquiry.chosenDate,
          guest_name:  name            || null,
          guest_phone: inquiry.phone   || null,
          guest_contact_preference: inquiry.contactPreference || null,
          source:      "app",
        }),
        TIMEOUT_MS
      );
      if (jobError) {
        console.error("Job insert error (signup):", JSON.stringify(jobError));
        setError("Account created, but we couldn't submit your enquiry. Please try again from the home screen.");
        setLoading(false);
        return;
      }
    } catch (e: any) {
      console.error("Job insert timed out (signup):", e);
      setError("Account created, but the enquiry timed out. Check your connection and try again.");
      setLoading(false);
      return;
    }

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

    // ── Fire-and-forget: welcome message + marketing consent ───────────────
    // Neither must block navigation — they run in the background after routing.
    supabase.from("messages")
      .insert({ job_id: jobId, body: WELCOME_MSG, sender: "contractor" })
      .then(({ error: e }) => { if (e) console.warn("Welcome msg error:", e.message); })
      .catch(() => {});

    if (userId) {
      // Record marketing consent state with an auditable timestamp.
      // Only set consent_at when the user actively ticked the box.
      supabase.from("user_profiles").upsert(
        {
          user_id:               userId,
          marketing_consent:     marketingConsent,
          marketing_consent_at:  marketingConsent ? new Date().toISOString() : null,
        },
        { onConflict: "user_id" }
      ).then(({ error: e }) => { if (e) console.warn("Marketing consent write error:", e.message); })
       .catch(() => {});
    }

    setLoading(false);
    router.replace("/inquiry/confirmation");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <ArrowLeft color="rgba(255,255,255,0.5)" size={18} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create your{"\n"}account</Text>
        <Text style={styles.sub}>Your enquiry will be submitted right after</Text>

        {[
          { label: "FULL NAME",  value: name,     set: setName,     placeholder: "Your full name",    kb: "default",       secure: false },
          { label: "EMAIL",      value: email,    set: setEmail,    placeholder: "you@example.com",   kb: "email-address", secure: false },
          { label: "PASSWORD",   value: password, set: setPassword, placeholder: "Min. 6 characters", kb: "default",       secure: true  },
        ].map(({ label, value, set, placeholder, kb, secure }) => (
          <View key={label} style={{ marginBottom: 20 }}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <TextInput
              value={value}
              onChangeText={set}
              placeholder={placeholder}
              placeholderTextColor="rgba(15,23,42,0.35)"
              keyboardType={kb as any}
              secureTextEntry={secure}
              autoCapitalize={kb === "email-address" ? "none" : "words"}
              autoCorrect={false}
              style={styles.input}
            />
          </View>
        ))}

        {/* Marketing consent — separate, optional, never pre-ticked (PECR / UK GDPR) */}
        <TouchableOpacity
          style={styles.consentRow}
          onPress={() => setMarketingConsent((v) => !v)}
          activeOpacity={0.75}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: marketingConsent }}
          accessibilityLabel="Email me occasional tips, offers and updates from Build.me. You can unsubscribe any time."
        >
          <View style={[styles.checkbox, marketingConsent && styles.checkboxTicked]}>
            {marketingConsent && <Check color={colors.navy} size={13} strokeWidth={3} />}
          </View>
          <Text style={styles.consentText}>
            Email me occasional tips, offers and updates from Build.me. You can unsubscribe any time.
          </Text>
        </TouchableOpacity>

        {error && <Text style={styles.error}>{error}</Text>}

        <Button
          label={loading ? "Creating account…" : "Create Account & Submit"}
          onPress={handleSubmit}
          disabled={!canSubmit || loading}
          style={{ marginTop: 8 }}
        />

        {loading && <ActivityIndicator color={colors.amber} style={{ marginTop: 16 }} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: colors.navy },
  back:       { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 2 },
  backText:   { color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: "600" },
  content:    { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 40 },
  title:      { color: colors.white, fontSize: 34, fontWeight: "800", letterSpacing: -0.8, lineHeight: 40, marginBottom: 8 },
  sub:        { color: "rgba(255,255,255,0.4)", fontSize: 14, fontWeight: "500", marginBottom: 32 },
  fieldLabel: { color: colors.amber, fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 10 },
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

  // Marketing consent checkbox
  consentRow: {
    flexDirection:  "row",
    alignItems:     "flex-start",
    gap:            12,
    marginBottom:   24,
    marginTop:      4,
    paddingVertical: 4, // extra tap target height
  },
  checkbox: {
    width:           22,
    height:          22,
    borderRadius:    6,
    borderWidth:     2,
    borderColor:     "rgba(255,255,255,0.25)",
    backgroundColor: "transparent",
    alignItems:      "center",
    justifyContent:  "center",
    marginTop:       1,
    flexShrink:      0,
  },
  checkboxTicked: {
    backgroundColor: colors.amber,
    borderColor:     colors.amber,
  },
  consentText: {
    flex:       1,
    color:      "rgba(255,255,255,0.45)",
    fontSize:   13,
    fontWeight: "400",
    lineHeight: 19,
  },

  error: { color: "#EF4444", fontSize: 13, fontWeight: "600", marginBottom: 12 },
});
