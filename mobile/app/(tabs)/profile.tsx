import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert, Switch, Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { User, LogOut, ChevronRight, Bell, Trash2 } from "lucide-react-native";
import { colors } from "@/lib/colors";
import { Button } from "@/components/ui/Button";
import { useApp } from "@/lib/context";
import { supabase, withTimeout } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { STATUS_PILL_COLORS, statusTone } from "@/lib/status";

interface UserProfile {
  name:             string;
  email:            string;
  marketingConsent: boolean;
}

const TIMEOUT_MS = 10_000;

export default function ProfileScreen() {
  const router = useRouter();
  const { isAuthenticated, setIsAuthenticated, jobs } = useApp();
  const [profile,        setProfile]        = useState<UserProfile | null>(null);
  const [consentLoading, setConsentLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;

      const name  = authData.user.user_metadata?.full_name ?? authData.user.email?.split("@")[0] ?? "My Account";
      const email = authData.user.email ?? "";

      // Load marketing consent from user_profiles (non-fatal if missing)
      let marketingConsent = false;
      try {
        const { data } = await withTimeout(
          supabase
            .from("user_profiles")
            .select("marketing_consent")
            .eq("user_id", authData.user.id)
            .maybeSingle(),
          TIMEOUT_MS
        );
        if (data) marketingConsent = !!data.marketing_consent;
      } catch { /* non-fatal — show toggle as off */ }

      setProfile({ name, email, marketingConsent });
    };
    load();
  }, [isAuthenticated]);

  const handleMarketingToggle = async (value: boolean) => {
    if (!profile) return;
    // Optimistic update
    setProfile((p) => p ? { ...p, marketingConsent: value } : p);
    setConsentLoading(true);

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) { setConsentLoading(false); return; }

    try {
      const { error } = await withTimeout(
        supabase.from("user_profiles").upsert(
          {
            user_id:              userId,
            marketing_consent:    value,
            // Set consent_at to now when newly enabling; clear it when disabling.
            marketing_consent_at: value ? new Date().toISOString() : null,
          },
          { onConflict: "user_id" }
        ),
        TIMEOUT_MS
      );
      if (error) {
        console.warn("Marketing consent update error:", error.message);
        // Revert optimistic update on failure
        setProfile((p) => p ? { ...p, marketingConsent: !value } : p);
      }
    } catch (e) {
      console.warn("Marketing consent update timed out:", e);
      setProfile((p) => p ? { ...p, marketingConsent: !value } : p);
    } finally {
      setConsentLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete account",
      "This will permanently delete your account and remove your personal data. Your job records will be kept for legal purposes but all identifying information will be removed.\n\nThis cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete account",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.rpc("delete_my_account");
              if (error) {
                Alert.alert("Error", "Couldn't delete your account. Please try again or contact support.");
                console.error("[delete_account]", error);
                return;
              }
              setIsAuthenticated(false);
              setProfile(null);
              router.replace("/(tabs)/");
            } catch (e) {
              Alert.alert("Error", "Couldn't delete your account. Please check your connection and try again.");
              console.error("[delete_account]", e);
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          setIsAuthenticated(false);
          setProfile(null);
        },
      },
    ]);
  };

  // ── Signed-out state ─────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.signInCard}>
          <View style={styles.avatarCircle}>
            <User color="rgba(255,255,255,0.5)" size={36} strokeWidth={1.8} />
          </View>
          <Text style={styles.signInHeading}>Sign in to your{"\n"}account</Text>
          <Text style={styles.signInSub}>
            View your jobs, messages and manage your profile
          </Text>

          <Button
            label="Sign In"
            onPress={() => router.push("/inquiry/signin")}
            style={{ marginBottom: 12 }}
          />
          <Button
            label="Create Account"
            onPress={() => router.push("/inquiry/signup")}
            variant="secondary"
            style={{ marginBottom: 20 }}
          />
          <TouchableOpacity onPress={() => router.replace("/(tabs)/")} activeOpacity={0.75}>
            <Text style={styles.browseLink}>Continue browsing</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={() => Linking.openURL("https://sassy-cent-19c.notion.site/TradeNest-Privacy-Policy-2bf67b051eac403198b3beab2c1d9683")} activeOpacity={0.75}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.legalSep}>·</Text>
          <TouchableOpacity onPress={() => Linking.openURL("https://sassy-cent-19c.notion.site/Terms-of-Service-3cbd7cc4117a80868347e39faab800bb")} activeOpacity={0.75}>
            <Text style={styles.legalLink}>Terms of Service</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Signed-in state ──────────────────────────────────────────────────────
  const initials = profile?.name
    ? profile.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar + name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarFilled}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <Text style={styles.name}>{profile?.name ?? "My Account"}</Text>
          {profile?.email ? <Text style={styles.email}>{profile.email}</Text> : null}
        </View>

        {/* My Jobs summary */}
        {jobs.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>MY JOBS</Text>
            <View style={styles.jobsCard}>
              {jobs.slice(0, 5).map((job, i) => {
                const pill = STATUS_PILL_COLORS[statusTone(job.status)];
                return (
                  <TouchableOpacity
                    key={job.id}
                    style={[styles.jobRow, i < Math.min(jobs.length, 5) - 1 && styles.jobRowBorder]}
                    activeOpacity={0.8}
                    onPress={() => router.push(`/job/${job.id}`)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.jobCategory}>{job.category}</Text>
                      <Text style={styles.jobDesc} numberOfLines={1}>{job.description}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 6 }}>
                      <View style={[styles.pill, { backgroundColor: pill.bg }]}>
                        <Text style={[styles.pillText, { color: pill.text }]}>{job.status}</Text>
                      </View>
                      <ChevronRight color="rgba(255,255,255,0.2)" size={14} />
                    </View>
                  </TouchableOpacity>
                );
              })}
              {jobs.length > 5 && (
                <TouchableOpacity
                  style={styles.viewAllRow}
                  onPress={() => router.push("/(tabs)/jobs")}
                  activeOpacity={0.75}
                >
                  <Text style={styles.viewAllText}>View all {jobs.length} jobs</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* Preferences */}
        <Text style={styles.sectionLabel}>PREFERENCES</Text>
        <View style={styles.prefsCard}>
          <View style={styles.prefRow}>
            <View style={styles.prefIconWrap}>
              <Bell color={colors.amber} size={16} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.prefTitle}>Marketing emails</Text>
              <Text style={styles.prefSub}>Tips, offers and updates from TradeNest</Text>
            </View>
            <Switch
              value={profile?.marketingConsent ?? false}
              onValueChange={handleMarketingToggle}
              disabled={consentLoading}
              trackColor={{ false: "rgba(255,255,255,0.12)", true: colors.amber }}
              thumbColor={colors.white}
              ios_backgroundColor="rgba(255,255,255,0.12)"
            />
          </View>
        </View>
        <Text style={styles.prefsNote}>
          Turning this off only affects marketing emails. You'll still receive important updates about your jobs and messages.
        </Text>

        {/* Support */}
        <Text style={styles.sectionLabel}>SUPPORT</Text>
        <View style={styles.supportWrap}>
          <Button
            label="Submit an Enquiry"
            onPress={() => router.push("/inquiry/type")}
          />
        </View>

        {/* Legal links */}
        <View style={[styles.legalLinks, { marginBottom: 14 }]}>
          <TouchableOpacity onPress={() => Linking.openURL("https://sassy-cent-19c.notion.site/TradeNest-Privacy-Policy-2bf67b051eac403198b3beab2c1d9683")} activeOpacity={0.75}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.legalSep}>·</Text>
          <TouchableOpacity onPress={() => Linking.openURL("https://sassy-cent-19c.notion.site/Terms-of-Service-3cbd7cc4117a80868347e39faab800bb")} activeOpacity={0.75}>
            <Text style={styles.legalLink}>Terms of Service</Text>
          </TouchableOpacity>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutRow} onPress={handleSignOut} activeOpacity={0.8}>
          <View style={styles.signOutIcon}>
            <LogOut color="#EF4444" size={18} strokeWidth={2} />
          </View>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Delete account */}
        <TouchableOpacity style={styles.deleteRow} onPress={handleDeleteAccount} activeOpacity={0.75}>
          <Trash2 color="rgba(239,68,68,0.6)" size={14} strokeWidth={2} />
          <Text style={styles.deleteText}>Delete account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.navy },
  scroll: { paddingBottom: 120 },
  header: { paddingHorizontal: 22, paddingTop: 26, paddingBottom: 8 },
  title:  { color: colors.white, fontSize: 32, fontWeight: "800", letterSpacing: -0.6, lineHeight: 38 },

  // Signed-out
  signInCard: {
    flex:             1,
    marginHorizontal: 22,
    marginTop:        8,
    marginBottom:     24,
    backgroundColor:  "rgba(255,255,255,0.05)",
    borderRadius:     24,
    padding:          32,
    alignItems:       "center",
    justifyContent:   "center",
    borderWidth:      1,
    borderColor:      "rgba(255,255,255,0.08)",
  },
  avatarCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  signInHeading: { color: colors.white, fontWeight: "800", fontSize: 26, letterSpacing: -0.5, lineHeight: 34, textAlign: "center", marginBottom: 10 },
  signInSub:     { color: colors.muted, fontSize: 15, fontWeight: "400", textAlign: "center", lineHeight: 22, marginBottom: 28 },
  browseLink:    { color: "rgba(255,255,255,0.35)", fontSize: 14, fontWeight: "600" },

  // Signed-in
  avatarSection: { alignItems: "center", paddingTop: 32, paddingBottom: 28, paddingHorizontal: 22 },
  avatarFilled: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: colors.amber,
    alignItems: "center", justifyContent: "center",
    marginBottom: 16,
    shadowColor: colors.amber, shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  avatarInitials: { color: colors.navy, fontWeight: "900", fontSize: 28, letterSpacing: -0.5 },
  name:           { color: colors.white, fontWeight: "800", fontSize: 22, letterSpacing: -0.4, lineHeight: 28 },
  email:          { color: colors.muted, fontSize: 14, fontWeight: "400", marginTop: 4 },

  sectionLabel: { color: colors.amber, fontSize: 11, fontWeight: "800", letterSpacing: 1.5, paddingHorizontal: 22, marginBottom: 10 },
  jobsCard: {
    marginHorizontal: 22,
    backgroundColor:  "rgba(255,255,255,0.05)",
    borderRadius:     20,
    borderWidth:      1,
    borderColor:      "rgba(255,255,255,0.08)",
    overflow:         "hidden",
    marginBottom:     22,
  },
  jobRow: {
    flexDirection:     "row",
    alignItems:        "center",
    paddingHorizontal: 18,
    paddingVertical:   14,
    gap:               12,
  },
  jobRowBorder:   { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  jobCategory:    { color: colors.white, fontWeight: "700", fontSize: 14, lineHeight: 20 },
  jobDesc:        { color: colors.muted, fontSize: 12, fontWeight: "400", marginTop: 2 },
  pill:           { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  pillText:       { fontSize: 10, fontWeight: "600" },
  viewAllRow:     { paddingHorizontal: 18, paddingVertical: 14, alignItems: "center", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" },
  viewAllText:    { color: colors.amber, fontWeight: "700", fontSize: 13 },

  // Preferences section
  prefsCard: {
    marginHorizontal: 22,
    backgroundColor:  "rgba(255,255,255,0.05)",
    borderRadius:     20,
    borderWidth:      1,
    borderColor:      "rgba(255,255,255,0.08)",
    overflow:         "hidden",
    marginBottom:     10,
  },
  prefRow: {
    flexDirection:     "row",
    alignItems:        "center",
    paddingHorizontal: 18,
    paddingVertical:   16,
    gap:               14,
  },
  prefIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "rgba(245,158,11,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  prefTitle: { color: colors.white,  fontWeight: "600", fontSize: 14, lineHeight: 20 },
  prefSub:   { color: colors.muted,  fontWeight: "400", fontSize: 12, marginTop: 2 },
  prefsNote: {
    marginHorizontal: 22,
    marginBottom:     22,
    color:            "rgba(255,255,255,0.3)",
    fontSize:         12,
    fontWeight:       "400",
    lineHeight:       17,
  },

  supportWrap: { marginHorizontal: 22, marginBottom: 14 },

  legalLinks: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, marginHorizontal: 22 },
  legalLink:  { color: "rgba(255,255,255,0.3)", fontSize: 12, fontWeight: "500", textDecorationLine: "underline" },
  legalSep:   { color: "rgba(255,255,255,0.15)", fontSize: 12 },
  deleteRow:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, marginHorizontal: 22 },
  deleteText: { color: "rgba(239,68,68,0.6)", fontSize: 13, fontWeight: "600" },
  signOutRow: {
    flexDirection:    "row",
    alignItems:       "center",
    marginHorizontal: 22,
    backgroundColor:  "rgba(239,68,68,0.08)",
    borderRadius:     18,
    padding:          18,
    gap:              14,
    borderWidth:      1,
    borderColor:      "rgba(239,68,68,0.15)",
  },
  signOutIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: "rgba(239,68,68,0.1)", alignItems: "center", justifyContent: "center" },
  signOutText: { color: "#EF4444", fontWeight: "700", fontSize: 15 },
});
