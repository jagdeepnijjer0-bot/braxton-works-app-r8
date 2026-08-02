import {
  View, Text, TextInput, StyleSheet, SafeAreaView, Keyboard, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { KeyRound } from "lucide-react-native";
import { colors } from "@/lib/colors";
import { supabase, withTimeout } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { useState, useRef } from "react";

const TIMEOUT_MS = 10_000;

export default function ResetPasswordScreen() {
  const router = useRouter();

  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [done,      setDone]      = useState(false);

  const confirmRef = useRef<TextInput>(null);

  const passwordTooShort = password.length > 0 && password.length < 6;
  const mismatch         = confirm.length > 0 && confirm !== password;
  const canSubmit        = password.length >= 6 && confirm === password;

  const handleReset = async () => {
    if (!canSubmit) return;
    Keyboard.dismiss();
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await withTimeout(
        supabase.auth.updateUser({ password }),
        TIMEOUT_MS
      );
      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }
    } catch (e: any) {
      setError(e?.message ?? "Request timed out. Check your connection and try again.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setDone(true);
  };

  if (done) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <View style={styles.iconWrap}>
            <KeyRound color={colors.amber} size={36} strokeWidth={1.5} />
          </View>
          <Text style={styles.title}>Password{"\n"}updated</Text>
          <Text style={styles.sub}>You're signed in and ready to go.</Text>
          <Button
            label="Go to My Account"
            onPress={() => router.replace("/(tabs)/profile")}
            style={{ marginTop: 32, width: "100%" }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Logo size={52} style={{ marginBottom: 32 }} />

        <Text style={styles.title}>Set a new{"\n"}password</Text>
        <Text style={styles.sub}>Choose something you haven't used before.</Text>

        <View style={styles.fields}>
          <View style={{ marginBottom: 18 }}>
            <Text style={styles.fieldLabel}>NEW PASSWORD</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 6 characters"
              placeholderTextColor="rgba(15,23,42,0.35)"
              textContentType="newPassword"
              autoComplete="new-password"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
              style={[styles.input, passwordTooShort && styles.inputError]}
            />
            {passwordTooShort && (
              <Text style={styles.hint}>Must be at least 6 characters</Text>
            )}
          </View>

          <View style={{ marginBottom: 8 }}>
            <Text style={styles.fieldLabel}>CONFIRM PASSWORD</Text>
            <TextInput
              ref={confirmRef}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Re-enter your password"
              placeholderTextColor="rgba(15,23,42,0.35)"
              textContentType="newPassword"
              autoComplete="new-password"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleReset}
              style={[styles.input, mismatch && styles.inputError]}
            />
            {mismatch && (
              <Text style={styles.hint}>Passwords don't match</Text>
            )}
          </View>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Button
          label={loading ? "Updating…" : "Set Password"}
          onPress={handleReset}
          disabled={!canSubmit || loading}
          style={{ marginTop: 16, width: "100%" }}
        />

        {loading && <ActivityIndicator color={colors.amber} style={{ marginTop: 16 }} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.navy },
  center:    { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  iconWrap: {
    width:           80,
    height:          80,
    borderRadius:    24,
    backgroundColor: "rgba(245,158,11,0.12)",
    alignItems:      "center",
    justifyContent:  "center",
    marginBottom:    28,
  },
  title:      { color: colors.white, fontSize: 36, fontWeight: "800", letterSpacing: -0.9, lineHeight: 42, textAlign: "center", marginBottom: 12 },
  sub:        { color: "rgba(255,255,255,0.45)", fontSize: 15, fontWeight: "400", textAlign: "center", lineHeight: 22, marginBottom: 8 },
  fields:     { width: "100%", marginTop: 24 },
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
  inputError: { borderWidth: 2, borderColor: "#EF4444" },
  hint:       { color: "#EF4444", fontSize: 12, fontWeight: "600", marginTop: 6 },
  error:      { color: "#EF4444", fontSize: 13, fontWeight: "600", marginTop: 4, textAlign: "center" },
});
