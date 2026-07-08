import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { User, Shield, Bell, ChevronRight } from "lucide-react-native";
import { colors } from "@/lib/colors";
import { Button } from "@/components/ui/Button";
import { useApp } from "@/lib/context";

const menuItems = [
  { icon: Bell,   label: "Notifications",    desc: "Manage alerts" },
  { icon: Shield, label: "Privacy & Security", desc: "Account security" },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.signInCard}>
          <View style={styles.avatar}>
            <User color="rgba(255,255,255,0.5)" size={36} strokeWidth={1.8} />
          </View>
          <Text style={styles.signInHeading}>Sign in to your{"\n"}account</Text>
          <Text style={styles.signInSub}>
            View your jobs, messages and manage your profile
          </Text>

          <Button
            label="Sign In"
            onPress={() => router.push("/inquiry/auth-gate")}
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <User color="rgba(255,255,255,0.6)" size={40} strokeWidth={1.8} />
        </View>
        <Text style={styles.name}>My Account</Text>
        <Text style={styles.nameDesc}>Manage your Build.me profile</Text>
      </View>

      <View style={styles.menu}>
        {menuItems.map(({ icon: Icon, label, desc }, i) => (
          <TouchableOpacity key={i} style={styles.menuItem} activeOpacity={0.85}>
            <View style={styles.menuIcon}>
              <Icon color={colors.amber} size={18} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>{label}</Text>
              <Text style={styles.menuDesc}>{desc}</Text>
            </View>
            <ChevronRight color="rgba(255,255,255,0.25)" size={16} />
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: colors.navy },
  header:         { paddingHorizontal: 22, paddingTop: 26, paddingBottom: 8 },
  title:          { color: colors.white, fontSize: 32, fontWeight: "800", letterSpacing: -0.6, lineHeight: 38 },
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
  avatar: {
    width:           88,
    height:          88,
    borderRadius:    44,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems:      "center",
    justifyContent:  "center",
    marginBottom:    20,
    borderWidth:     1,
    borderColor:     "rgba(255,255,255,0.1)",
  },
  signInHeading:  { color: colors.white, fontWeight: "800", fontSize: 26, letterSpacing: -0.5, lineHeight: 34, textAlign: "center", marginBottom: 10 },
  signInSub:      { color: colors.muted, fontSize: 15, fontWeight: "400", textAlign: "center", lineHeight: 22, marginBottom: 28 },
  browseLink:     { color: "rgba(255,255,255,0.35)", fontSize: 14, fontWeight: "600" },
  avatarSection:  { alignItems: "center", paddingVertical: 28 },
  name:           { color: colors.white, fontWeight: "800", fontSize: 22, letterSpacing: -0.4, marginBottom: 4, lineHeight: 28 },
  nameDesc:       { color: colors.muted, fontSize: 14, fontWeight: "400" },
  menu: {
    marginHorizontal: 22,
    backgroundColor:  "rgba(255,255,255,0.05)",
    borderRadius:     20,
    borderWidth:      1,
    borderColor:      "rgba(255,255,255,0.08)",
    overflow:         "hidden",
  },
  menuItem: {
    flexDirection:    "row",
    alignItems:       "center",
    paddingHorizontal: 18,
    paddingVertical:  16,
    gap:              14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  menuIcon:  { width: 38, height: 38, borderRadius: 11, backgroundColor: "rgba(245,158,11,0.1)", alignItems: "center", justifyContent: "center" },
  menuLabel: { color: colors.white, fontWeight: "600", fontSize: 15, lineHeight: 21 },
  menuDesc:  { color: colors.muted, fontSize: 13, fontWeight: "400", marginTop: 2 },
});
