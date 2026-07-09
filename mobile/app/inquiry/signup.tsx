import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { colors } from "@/lib/colors";
import { useApp } from "@/lib/context";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

export default function SignUpScreen() {
  const router = useRouter();
  const { inquiry, addJob, setIsAuthenticated } = useApp();

  const [name,     setName]     = useState(inquiry.name);
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const canSubmit = name.trim() && email.trim() && password.length >= 6;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setIsAuthenticated(true);

    // Insert into Supabase — let the DB generate the UUID
    const { data: jobData, error: jobError } = await supabase
      .from("jobs")
      .insert({
        user_id:     authData.user?.id ?? null,
        type:        inquiry.type ?? "enquiry",
        category:    inquiry.category,
        description: inquiry.description,
        address:     inquiry.address,
        status:      "Enquiry Received",
        timing:      inquiry.timing,
        chosen_date: inquiry.chosenDate,
        guest_name:  name || null,
        guest_phone: inquiry.phone || null,
        guest_contact_preference: inquiry.contactPreference || null,
        source:      "app",
      })
      .select("id")
      .single();

    if (jobError || !jobData) {
      console.error("Job insert error (signup):", JSON.stringify(jobError));
      setError("Account created, but we couldn't submit your enquiry. Please try again from the home screen.");
      setLoading(false);
      return;
    }

    const jobId = jobData.id as string;

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

    // Welcome message (non-fatal)
    await supabase.from("messages").insert({
      job_id: jobId,
      body:   "Thanks for your enquiry — we've received it and we're on it. Your job is now being assigned to one of our verified contractors. You can track every step by tapping My Jobs at the bottom of your screen. We'll message you here as soon as there's an update.",
      sender: "contractor",
    }).then(({ error: e }) => { if (e) console.warn("Welcome msg error:", e.message); });

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
          { label: "FULL NAME",  value: name,     set: setName,     placeholder: "Your full name",    kb: "default"       },
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
  error: { color: "#EF4444", fontSize: 13, fontWeight: "600", marginBottom: 12 },
});
