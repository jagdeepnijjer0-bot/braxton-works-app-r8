import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, CheckSquare, Square } from "lucide-react-native";
import { colors } from "@/lib/colors";
import { useApp } from "@/lib/context";
import { supabase, withTimeout } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { useState, useEffect } from "react";

const TERMS_VERSION = "1.0";
const TIMEOUT_MS    = 15_000;
const SLOW_AFTER_MS = 4_000;

export default function SignUpScreen() {
  const router = useRouter();
  const { inquiry, addJob, setIsAuthenticated } = useApp();

  const [name,            setName]            = useState(inquiry.name);
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [termsAccepted,   setTermsAccepted]   = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [slowConnection,  setSlowConnection]  = useState(false);
  const [error,           setError]           = useState<string | null>(null);

  useEffect(() => {
    if (!loading) { setSlowConnection(false); return; }
    const t = setTimeout(() => setSlowConnection(true), SLOW_AFTER_MS);
    return () => clearTimeout(t);
  }, [loading]);

  const canSubmit = name.trim() && email.trim() && password.length >= 6 && termsAccepted;

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    setError(null);
    setLoading(true);

    try {
      const { data: authData, error: authError } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name:         name.trim(),
              terms_accepted_at: new Date().toISOString(),
              terms_version:     TERMS_VERSION,
              marketing_consent: marketingConsent,
            },
          },
        }),
        TIMEOUT_MS
      );

      if (authError) { setError(authError.message); return; }

      setIsAuthenticated(true);
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

      router.replace("/inquiry/confirmation");
    } catch (e: any) {
      setError("Couldn't create your account. Check your connection and try again.");
      console.error("[signup]", e);
    } finally {
      setLoading(false);
    }
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
          { label: "FULL NAME",  value: name,     set: setName,     placeholder: "Your full name",    kb: "default" },
          { label: "EMAIL",      value: email,    set: setEmail,    placeholder: "you@example.com",   kb: "email-address" },
          { label: "PASSWORD",   value: password, set: setPassword, placeholder: "Min. 6 characters", kb: "default", secure: true },
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
              style={styles.input}
            />
          </View>
        ))}

        {/* Terms of Service — required */}
        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => setTermsAccepted(v => !v)}
          activeOpacity={0.75}
        >
          {termsAccepted
            ? <CheckSquare color={colors.amber} size={20} strokeWidth={2} />
            : <Square color="rgba(255,255,255,0.35)" size={20} strokeWidth={2} />
          }
          <Text style={styles.checkLabel}>
            I agree to the{" "}
            <Text
              style={styles.link}
              onPress={() => Linking.openURL("https://tradenestapp.co.uk/terms")}
            >
              Terms of Service
            </Text>
          </Text>
        </TouchableOpacity>

        {/* Marketing consent — optional, unticked by default */}
        <TouchableOpacity
          style={[styles.checkRow, { marginTop: 14 }]}
          onPress={() => setMarketingConsent(v => !v)}
          activeOpacity={0.75}
        >
          {marketingConsent
            ? <CheckSquare color={colors.amber} size={20} strokeWidth={2} />
            : <Square color="rgba(255,255,255,0.35)" size={20} strokeWidth={2} />
          }
          <Text style={styles.checkLabel}>
            I'd like to receive news and offers by email (optional)
          </Text>
        </TouchableOpacity>

        <Text style={styles.privacyNote}>
          By creating an account you acknowledge our{" "}
          <Text
            style={styles.link}
            onPress={() => Linking.openURL("https://tradenestapp.co.uk/privacy")}
          >
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

        {loading && (
          <View style={{ alignItems: "center", marginTop: 16 }}>
            <ActivityIndicator color={colors.amber} />
            {slowConnection && (
              <Text style={styles.slowHint}>Taking longer than usual — please wait…</Text>
            )}
          </View>
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
  checkRow:   { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  checkLabel: { flex: 1, color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: "500", lineHeight: 22 },
  link:       { color: colors.amber, fontWeight: "700", textDecorationLine: "underline" },
  privacyNote: { color: "rgba(255,255,255,0.35)", fontSize: 13, fontWeight: "400", lineHeight: 20, marginTop: 20, marginBottom: 12 },
  error:      { color: "#EF4444", fontSize: 13, fontWeight: "600", marginBottom: 12 },
  slowHint:   { color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: "500", marginTop: 10, textAlign: "center" },
});
