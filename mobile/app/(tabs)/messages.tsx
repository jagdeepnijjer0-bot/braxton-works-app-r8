import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { MessageSquare } from "lucide-react-native";
import { colors } from "@/lib/colors";
import { Button } from "@/components/ui/Button";

export default function MessagesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.sub}>Stay in touch with your contractor</Text>
      </View>

      <View style={styles.center}>
        <View style={styles.iconWrap}>
          <MessageSquare color={colors.amber} size={32} strokeWidth={2} />
        </View>
        <Text style={styles.emptyTitle}>No messages yet</Text>
        <Text style={styles.emptyBody}>
          Once a contractor is assigned to your job, your conversation will appear here.
        </Text>
        <Button
          label="Start an Inquiry"
          onPress={() => router.push("/inquiry/type")}
          style={{ marginTop: 24, width: "100%" }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: colors.navy },
  header:     { paddingHorizontal: 22, paddingTop: 26, paddingBottom: 20 },
  title:      { color: colors.white, fontSize: 32, fontWeight: "800", letterSpacing: -0.6 },
  sub:        { color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: "600", marginTop: 4 },
  center: {
    flex:              1,
    marginHorizontal:  22,
    marginBottom:      22,
    backgroundColor:   "rgba(255,255,255,0.05)",
    borderRadius:      24,
    padding:           32,
    alignItems:        "center",
    justifyContent:    "center",
    borderWidth:       1,
    borderColor:       "rgba(255,255,255,0.08)",
  },
  iconWrap:   { width: 72, height: 72, borderRadius: 20, backgroundColor: "rgba(245,158,11,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  emptyTitle: { color: colors.white, fontWeight: "800", fontSize: 20, marginBottom: 10 },
  emptyBody:  { color: "rgba(255,255,255,0.45)", fontSize: 14, textAlign: "center", lineHeight: 22 },
});
