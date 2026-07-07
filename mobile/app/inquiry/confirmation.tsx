import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { CheckCircle } from "lucide-react-native";
import { colors } from "@/lib/colors";
import { useApp } from "@/lib/context";
import { Button } from "@/components/ui/Button";

export default function ConfirmationScreen() {
  const router = useRouter();
  const { resetInquiry } = useApp();

  const handleHome = () => {
    resetInquiry();
    router.replace("/(tabs)/");
  };

  const handleJobs = () => {
    resetInquiry();
    router.replace("/(tabs)/jobs");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <View style={styles.iconWrap}>
          <CheckCircle color={colors.amber} size={72} strokeWidth={1.5} />
        </View>

        <Text style={styles.heading}>Inquiry Submitted</Text>
        <Text style={styles.sub}>We'll be in touch shortly — usually within 2 hours.</Text>

        <View style={styles.buttons}>
          <Button label="Return Home"    onPress={handleHome} variant="secondary" style={{ marginBottom: 12 }} />
          <Button label="View My Jobs"   onPress={handleJobs} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: colors.navy },
  center:   { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  iconWrap: {
    width:           120,
    height:          120,
    borderRadius:    60,
    backgroundColor: "rgba(245,158,11,0.12)",
    alignItems:      "center",
    justifyContent:  "center",
    marginBottom:    28,
  },
  heading:  { color: colors.white, fontSize: 28, fontWeight: "800", textAlign: "center", marginBottom: 12 },
  sub:      { color: "rgba(255,255,255,0.6)", fontSize: 16, textAlign: "center", lineHeight: 24, marginBottom: 40 },
  buttons:  { width: "100%" },
});
