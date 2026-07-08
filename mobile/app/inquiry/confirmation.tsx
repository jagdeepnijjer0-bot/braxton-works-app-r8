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
          <View style={styles.iconInner}>
            <CheckCircle color={colors.amber} size={56} strokeWidth={1.8} />
          </View>
        </View>

        <Text style={styles.heading}>Inquiry{"\n"}Submitted</Text>
        <Text style={styles.sub}>
          We'll be in touch shortly —{"\n"}usually within 2 hours.
        </Text>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>Response guaranteed or we follow up</Text>
        </View>

        <View style={styles.buttons}>
          <Button label="View My Jobs"  onPress={handleJobs} style={{ marginBottom: 12 }} />
          <Button label="Return Home"   onPress={handleHome} variant="secondary" />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.navy },
  center:    { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  iconWrap: {
    width:           140,
    height:          140,
    borderRadius:    70,
    backgroundColor: "rgba(245,158,11,0.08)",
    alignItems:      "center",
    justifyContent:  "center",
    marginBottom:    32,
    shadowColor:     colors.amber,
    shadowOpacity:   0.2,
    shadowRadius:    30,
    shadowOffset:    { width: 0, height: 0 },
  },
  iconInner: {
    width:           96,
    height:          96,
    borderRadius:    48,
    backgroundColor: "rgba(245,158,11,0.14)",
    alignItems:      "center",
    justifyContent:  "center",
  },
  heading:   { color: colors.white, fontSize: 42, fontWeight: "800", textAlign: "center", letterSpacing: -1, lineHeight: 48, marginBottom: 16 },
  sub:       { color: colors.muted, fontSize: 16, fontWeight: "400", textAlign: "center", lineHeight: 24, marginBottom: 24 },
  badge: {
    backgroundColor:  "rgba(245,158,11,0.12)",
    borderRadius:     20,
    paddingHorizontal: 16,
    paddingVertical:  8,
    borderWidth:      1,
    borderColor:      "rgba(245,158,11,0.2)",
    marginBottom:     40,
  },
  badgeText: { color: colors.amber, fontSize: 12, fontWeight: "700", letterSpacing: 0.3 },
  buttons:   { width: "100%" },
});
