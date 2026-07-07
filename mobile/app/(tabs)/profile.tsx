import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { User, Shield, Bell, ChevronRight } from "lucide-react-native";
import { colors } from "@/lib/colors";
import { Button } from "@/components/ui/Button";

const menuItems = [
  { icon: Bell,   label: "Notifications",   desc: "Manage alerts" },
  { icon: Shield, label: "Privacy & Security", desc: "Account security" },
];

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <User color="rgba(255,255,255,0.6)" size={40} strokeWidth={1.8} />
        </View>
        <Text style={styles.name}>Not signed in</Text>
        <Text style={styles.nameDesc}>Sign in to manage your account</Text>
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

      <View style={styles.footer}>
        <Button
          label="Sign In"
          onPress={() => router.push("/inquiry/type")}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: colors.navy },
  header:        { paddingHorizontal: 22, paddingTop: 26, paddingBottom: 8 },
  title:         { color: colors.white, fontSize: 32, fontWeight: "800", letterSpacing: -0.6 },
  avatarSection: { alignItems: "center", paddingVertical: 32 },
  avatar: {
    width:           100,
    height:          100,
    borderRadius:    50,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems:      "center",
    justifyContent:  "center",
    marginBottom:    16,
    borderWidth:     1,
    borderColor:     "rgba(255,255,255,0.1)",
  },
  name:     { color: colors.white, fontWeight: "800", fontSize: 22, letterSpacing: -0.4, marginBottom: 4 },
  nameDesc: { color: "rgba(255,255,255,0.4)", fontSize: 14, fontWeight: "500" },
  menu: {
    marginHorizontal: 22,
    backgroundColor:  "rgba(255,255,255,0.05)",
    borderRadius:     20,
    borderWidth:      1,
    borderColor:      "rgba(255,255,255,0.08)",
    overflow:         "hidden",
  },
  menuItem: {
    flexDirection:   "row",
    alignItems:      "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap:             14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  menuIcon:  { width: 38, height: 38, borderRadius: 11, backgroundColor: "rgba(245,158,11,0.1)", alignItems: "center", justifyContent: "center" },
  menuLabel: { color: colors.white, fontWeight: "700", fontSize: 15 },
  menuDesc:  { color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: "500", marginTop: 2 },
  footer:    { paddingHorizontal: 22, paddingBottom: 20, marginTop: "auto" },
});
