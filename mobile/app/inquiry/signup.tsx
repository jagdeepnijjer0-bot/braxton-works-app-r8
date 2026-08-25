import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Keyboard, Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Check, Mail } from "lucide-react-native";
import { Logo } from "@/components/ui/Logo";
import { colors } from "@/lib/colors";
import { useApp } from "@/lib/context";
import { supabase, withTimeout, isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { useState, useRef, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persistGuestJob, addPendingClaimId } from "@/lib/guest-jobs";

const REMEMBER_KEY  = "remembered_contact";
const TIMEOUT_MS    = 15_000;
const SLOW_AFTER_MS = 4_000;
const REMEMBER_FLAG = "remember_me";
const TERMS_VERSION = "1.0";

const WELCOME_MSG =
  "Thanks for your enquiry — we've received it and we're on it. Your job is now being assigned to one of our verified contractors. You can track every step by tapping My Jobs at the bottom of your screen. We'll message you here as soon as there's an update.";

// Deep link Supabase embeds in the confirmation email.
// Must match the scheme in app.json ("tradenest") and the Allow List in
// Supabase Dashboard → Authentication → URL Configuration.
const EMAIL_REDIRECT = "tradenest://auth/callback";

export default function SignUpScreen() {
  const router = useRouter();
  const { inquiry, addJob, setJobs, setIsAuthenticated, isAuthenticated } = useApp();

  const [name,             setName]             = useState(inquiry.name);
  const [email,            setEmail]            = useState("");
  const [password,         setPassword]         = useState("");
  const [termsAccepted,    setTermsAccepted]    = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [rememberMe,       setRememberMe]       = useState(false);
  const [loading,          setLoading]          = useState(false);
  const [slowConnection,   setSlowConnection]   = useState(false);
  const [error,            setError]            = useState<string | null>(null);
  // true once signUp() succeeds and Supabase sent a confirmation email
  const [emailSent,        setEmailSent]        = useState(false);

  // Show a "taking longer than usual" hint after SLOW_AFTER_MS while loading
  useEffect(() => {
    if (!loading) { setSlowConnection(false); return; }
    const t = setTimeout(() => setSlowConnection(true), SLOW_AFTER_MS);
    return () => clearTimeout(t);
  }, [loading]);

  const emailRef    = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const canSubmit = name.trim() && email.trim() && password.length >= 6 && termsAccepted;

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    Keyboard.dismiss();
    if (!isSupabaseConfigured) {
      setError("App is not configured correctly. Please contact support.");
      return;
    }

    setLoading(true);
    setError(null);

    // Snapshot auth state before the async sign-up so we know whether to clear
    // stale authenticated jobs from context once the new account is created.
    const wasAuthenticated = isAuthenticated;

    let needsConfirmation = true;
    let jobId: string | null = null;
    let submittedJob: Record<string, unknown> | null = null;

    try {
      // ── Sign up ─────────────────────────────────────────────────────────
      const result = await supabase.auth.signUp({
        email:   email.trim(),
        password,
        options: {
          data: {
            full_name:         name,
            terms_accepted_at: new Date().toISOString(),
            terms_version:     TERMS_VERSION,
            marketing_consent: marketingConsent,
          },
          emailRedirectTo: EMAIL_REDIRECT,
        },
      });
      if (result.error) {
        setError(result.error.message);
        return;
      }

      const authData = result.data;
      needsConfirmation = !authData.session;
      const userId = authData.session?.user?.id ?? null;

      // ── Job insert ───────────────────────────────────────────────────────
      jobId = crypto.randomUUID();
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
        if (jobError) console.error("Job insert error (signup):", JSON.stringify(jobError));
      } catch (e: any) {
        console.error("Job insert timed out (signup):", e);
      }

      const newJob = {
        id:          jobId,
        type:        inquiry.type ?? "enquiry",
        category:    inquiry.category,
        description: inquiry.description,
        address:     inquiry.address,
        status:      "Enquiry Received",
        date:        new Date().toISOString(),
        photos:      inquiry.photos,
        updates:     [],
      };
      submittedJob = newJob;
      persistGuestJob(newJob); // fire-and-forget
      addJob(newJob);

      // Track this job for claim on email confirmation — scoped to THIS sign-up flow only.
      // Only needed when user_id is null (email not yet confirmed / auto-confirm off).
      if (userId === null) addPendingClaimId(jobId).catch(() => {});

      // ── Fire-and-forget: welcome message + marketing consent ─────────────
      supabase.from("messages")
        .insert({ job_id: jobId, body: WELCOME_MSG, sender: "contractor" })
        .then(({ error: e }) => { if (e) console.warn("Welcome msg error:", e.message); })
        .catch(() => {});

      if (userId) {
        supabase.from("user_profiles").upsert(
          {
            user_id:              userId,
            marketing_consent:    marketingConsent,
            marketing_consent_at: marketingConsent ? new Date().toISOString() : null,
          },
          { onConflict: "user_id" }
        ).then(({ error: e }) => { if (e) console.warn("Marketing consent write error:", e.message); })
         .catch(() => {});
      }

      // Save remembered contact details if opted in
      if (rememberMe) {
        Promise.all([
          AsyncStorage.setItem(REMEMBER_KEY, JSON.stringify({ name, address: inquiry.address, phone: inquiry.phone })),
          AsyncStorage.setItem(REMEMBER_FLAG, "true"),
        ]).catch(() => {});
      } else {
        Promise.all([
          AsyncStorage.removeItem(REMEMBER_KEY),
          AsyncStorage.removeItem(REMEMBER_FLAG),
        ]).catch(() => {});
      }

    } catch (e: any) {
      // Surface the real error — do NOT replace with a generic string.
      // status and name identify Supabase AuthErrors vs. network errors vs. JS exceptions.
      const msg = e?.message ?? String(e);
      const detail = [
        e?.name   ? `[${e.name}]`      : null,
        e?.status ? `HTTP ${e.status}` : null,
        msg,
      ].filter(Boolean).join(" ");
      setError(
        msg.toLowerCase().includes("timed out")
          ? "Sign-up timed out — your connection may be slow. Please try again."
          : `Sign-up error: ${detail}`
      );
      console.error("[signup] unexpected error:", e);
    } finally {
      setLoading(false);
    }

    // Only navigate / show confirmation if sign-up succeeded (jobId was set)
    if (!jobId) return;

    if (needsConfirmation) {
      // If the user was previously authenticated (switching accounts), clear their
      // stale jobs and show only the new enquiry. If they were already a guest,
      // addJob() already appended — don't overwrite the list.
      if (wasAuthenticated && submittedJob) setJobs([submittedJob as any]);
      setEmailSent(true);
    } else {
      setIsAuthenticated(true);
      router.replace("/inquiry/confirmation");
    }
  };

  // ── "Check your email" screen ─────────────────────────────────────────────
  if (emailSent) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.confirmCenter}>
          <View style={styles.confirmIconWrap}>
            <Mail color={colors.amber} size={36} strokeWidth={1.5} />
          </View>

          <Text style={styles.confirmTitle}>Check your{"\n"}email</Text>
          <Text style={styles.confirmBody}>
            We sent a confirmation link to{"\n"}
            <Text style={styles.confirmEmail}>{email.trim()}</Text>
            {"\n\n"}Tap the link in that email to verify your account and you're all set. Your enquiry has already been submitted.
          </Text>

          <Text style={styles.confirmHint}>
            Didn't get it? Check your spam folder, or{" "}
            <Text
              style={styles.confirmResend}
              onPress={async () => {
                setError(null);
                try {
                  await withTimeout(
                    supabase.auth.resend({ type: "signup", email: email.trim(), options: { emailRedirectTo: EMAIL_REDIRECT } }),
                    TIMEOUT_MS
                  );
                } catch { /* non-fatal */ }
              }}
            >
              resend
            </Text>
            .
          </Text>

          {error && <Text style={styles.error}>{error}</Text>}

          <Button
            label="Go to My Jobs"
            onPress={() => router.replace("/(tabs)/jobs")}
            style={{ marginTop: 32, width: "100%" }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ── Sign-up form ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <ArrowLeft color="rgba(255,255,255,0.5)" size={18} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Logo size={52} style={{ alignSelf: "center", marginBottom: 28 }} />
        <Text style={styles.title}>Create your{"\n"}account</Text>
        <Text style={styles.sub}>Your enquiry will be submitted right after</Text>

        <View style={{ marginBottom: 20 }}>
          <Text style={styles.fieldLabel}>FULL NAME</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your full name"
            placeholderTextColor="rgba(15,23,42,0.35)"
            keyboardType="default"
            textContentType="name"
            autoComplete="name"
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            style={styles.input}
          />
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={styles.fieldLabel}>EMAIL</Text>
          <TextInput
            ref={emailRef}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="rgba(15,23,42,0.35)"
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            style={styles.input}
          />
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={styles.fieldLabel}>PASSWORD</Text>
          <TextInput
            ref={passwordRef}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter a password"
            placeholderTextColor="rgba(15,23,42,0.35)"
            keyboardType="default"
            textContentType="newPassword"
            autoComplete="new-password"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
            style={[styles.input, password.length > 0 && password.length < 6 && styles.inputError]}
          />
          {password.length > 0 && password.length < 6 ? (
            <Text style={styles.passwordHintError}>Must be at least 6 characters</Text>
          ) : (
            <Text style={styles.passwordHint}>Must be at least 6 characters</Text>
          )}
        </View>

        {/* Terms of Service — required to proceed */}
        <TouchableOpacity
          style={styles.consentRow}
          onPress={() => setTermsAccepted((v) => !v)}
          activeOpacity={0.75}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: termsAccepted }}
          accessibilityLabel="I agree to the Terms of Service"
        >
          <View style={[styles.checkbox, termsAccepted && styles.checkboxTicked]}>
            {termsAccepted && <Check color={colors.navy} size={13} strokeWidth={3} />}
          </View>
          <Text style={styles.consentText}>
            I agree to the{" "}
            <Text style={styles.link} onPress={() => Linking.openURL("https://tradenestapp.co.uk/terms")}>
              Terms of Service
            </Text>
          </Text>
        </TouchableOpacity>

        {/* Marketing consent — separate, optional, never pre-ticked (PECR / UK GDPR) */}
        <TouchableOpacity
          style={styles.consentRow}
          onPress={() => setMarketingConsent((v) => !v)}
          activeOpacity={0.75}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: marketingConsent }}
          accessibilityLabel="Email me occasional tips, offers and updates from TradeNest. You can unsubscribe any time."
        >
          <View style={[styles.checkbox, marketingConsent && styles.checkboxTicked]}>
            {marketingConsent && <Check color={colors.navy} size={13} strokeWidth={3} />}
          </View>
          <Text style={styles.consentText}>
            Email me occasional tips, offers and updates from TradeNest. You can unsubscribe any time.
          </Text>
        </TouchableOpacity>

        {/* Remember me — saves contact details to pre-fill future enquiries */}
        <TouchableOpacity
          style={styles.rememberRow}
          onPress={() => setRememberMe((v) => !v)}
          activeOpacity={0.75}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: rememberMe }}
          accessibilityLabel="Remember my contact details for future enquiries"
        >
          <View style={[styles.checkbox, rememberMe && styles.checkboxTicked]}>
            {rememberMe && <Check color={colors.navy} size={13} strokeWidth={3} />}
          </View>
          <Text style={styles.consentText}>
            Remember my details for future enquiries
          </Text>
        </TouchableOpacity>

        <Text style={styles.privacyNote}>
          By creating an account you acknowledge our{" "}
          <Text style={styles.link} onPress={() => Linking.openURL("https://tradenestapp.co.uk/privacy")}>
            Privacy Policy
          </Text>
          .
        </Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <Button
          label={loading ? "Creating account…" : "Create Account & Submit"}
          onPress={handleSubmit}
          disabled={!canSubmit || loading}
          style={{ marginTop: 8 }}
        />

        {loading && <ActivityIndicator color={colors.amber} style={{ marginTop: 16 }} />}
        {slowConnection && (
          <Text style={styles.slowHint}>Taking longer than usual — please wait…</Text>
        )}
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
  consentRow: {
    flexDirection:   "row",
    alignItems:      "flex-start",
    gap:             12,
    marginBottom:    24,
    marginTop:       4,
    paddingVertical: 4,
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
  link:        { color: colors.amber, fontWeight: "700", textDecorationLine: "underline" },
  privacyNote: { color: "rgba(255,255,255,0.3)", fontSize: 12, fontWeight: "400", lineHeight: 18, marginBottom: 16 },
  rememberRow: {
    flexDirection:   "row",
    alignItems:      "center",
    gap:             12,
    marginBottom:    20,
    marginTop:       4,
    paddingVertical: 4,
  },
  inputError:       { borderWidth: 2, borderColor: "#EF4444" },
  passwordHint:     { color: "rgba(255,255,255,0.3)", fontSize: 12, fontWeight: "400", marginTop: 6 },
  passwordHintError:{ color: "#EF4444",               fontSize: 12, fontWeight: "600", marginTop: 6 },
  error:    { color: "#EF4444", fontSize: 13, fontWeight: "600", marginBottom: 12 },
  slowHint: { color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: "400", marginTop: 8, textAlign: "center" },

  // "Check your email" screen
  confirmCenter: {
    flex:             1,
    alignItems:       "center",
    justifyContent:   "center",
    paddingHorizontal: 32,
  },
  confirmIconWrap: {
    width:           80,
    height:          80,
    borderRadius:    24,
    backgroundColor: "rgba(245,158,11,0.12)",
    alignItems:      "center",
    justifyContent:  "center",
    marginBottom:    28,
  },
  confirmTitle: {
    color:         colors.white,
    fontSize:      36,
    fontWeight:    "800",
    letterSpacing: -0.9,
    lineHeight:    42,
    textAlign:     "center",
    marginBottom:  16,
  },
  confirmBody: {
    color:      "rgba(255,255,255,0.55)",
    fontSize:   15,
    fontWeight: "400",
    lineHeight: 23,
    textAlign:  "center",
    marginBottom: 20,
  },
  confirmEmail: {
    color:      colors.amber,
    fontWeight: "700",
  },
  confirmHint: {
    color:      "rgba(255,255,255,0.3)",
    fontSize:   13,
    fontWeight: "400",
    lineHeight: 20,
    textAlign:  "center",
  },
  confirmResend: {
    color:      colors.amber,
    fontWeight: "600",
  },
});
