import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { User } from "lucide-react-native";
import { colors } from "@/lib/colors";
import { Button } from "@/components/ui/Button";

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.center}>
        <View style={styles.avatar}>
          <User color="rgba(255,255,255,0.5)" size={44} />
        </View>
        <Text style={styles.heading}>Not signed in</Text>
        <Text style={styles.body}>
          Sign in to view your profile and track your jobs
        </Text>
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
  safe:    { flex: 1, backgroundColor: colors.navy },
  header:  { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 },
  title:   { color: colors.white, fontSize: 24, fontWeight: "700" },
  center:  { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  avatar:  {
    width:           96,
    height:          96,
    borderRadius:    48,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems:      "center",
    justifyContent:  "center",
    marginBottom:    24,
  },
  heading: { color: colors.white, fontWeight: "700", fontSize: 20, marginBottom: 10 },
  body:    { color: "rgba(255,255,255,0.55)", textAlign: "center", fontSize: 15, lineHeight: 22 },
  footer:  { paddingHorizontal: 20, paddingBottom: 20 },
});
