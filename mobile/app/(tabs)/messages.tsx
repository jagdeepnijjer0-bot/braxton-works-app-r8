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
        <Text style={styles.sub}>Chat with Build.me</Text>
      </View>

      <View style={styles.center}>
        <View style={styles.iconWrap}>
          <MessageSquare color={colors.amber} size={30} />
        </View>
        <Text style={styles.emptyTitle}>No messages yet</Text>
        <Text style={styles.emptyBody}>Submit a job to get started.</Text>
        <Button
          label="Start an Inquiry"
          onPress={() => router.push("/inquiry/type")}
          style={{ marginTop: 20, width: "100%" }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.navy },
  header:    { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 },
  title:     { color: colors.white, fontSize: 24, fontWeight: "700" },
  sub:       { color: "rgba(255,255,255,0.5)", fontSize: 14, marginTop: 4 },
  center:    {
    flex:            1,
    marginHorizontal: 20,
    backgroundColor: colors.white,
    borderRadius:    24,
    padding:         28,
    alignItems:      "center",
    justifyContent:  "center",
  },
  iconWrap:  { width: 64, height: 64, borderRadius: 18, backgroundColor: "rgba(245,158,11,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 18 },
  emptyTitle:{ color: colors.navy, fontWeight: "700", fontSize: 18, marginBottom: 8 },
  emptyBody: { color: colors.slate, fontSize: 14, textAlign: "center", lineHeight: 20 },
});
