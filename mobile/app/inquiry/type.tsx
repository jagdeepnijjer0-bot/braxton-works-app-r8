import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, AlertCircle, HelpCircle } from "lucide-react-native";
import { colors } from "@/lib/colors";
import { useApp, type InquiryType } from "@/lib/context";
import { StepProgress } from "@/components/ui/StepProgress";

const options: { type: InquiryType; label: string; desc: string; icon: typeof AlertCircle }[] = [
  { type: "issue",   label: "Report an Issue",  desc: "Something needs fixing or repairing", icon: AlertCircle },
  { type: "inquiry", label: "Request a Quote",  desc: "Looking for a quote or project work",  icon: HelpCircle  },
];

export default function TypeScreen() {
  const router = useRouter();
  const { inquiry, setInquiry } = useApp();

  const handleSelect = (type: InquiryType) => {
    setInquiry({ ...inquiry, type });
    router.push("/inquiry/category");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StepProgress step={1} />

      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <ArrowLeft color="rgba(255,255,255,0.5)" size={18} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>What do you{"\n"}need help with?</Text>
        <Text style={styles.sub}>Select the type of request</Text>

        <View style={styles.options}>
          {options.map(({ type, label, desc, icon: Icon }) => (
            <TouchableOpacity
              key={type}
              style={styles.card}
              onPress={() => handleSelect(type)}
              activeOpacity={0.82}
            >
              <View style={styles.cardIconBox}>
                <Icon color={colors.amber} size={26} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardLabel}>{label}</Text>
                <Text style={styles.cardDesc}>{desc}</Text>
              </View>
              <View style={styles.cardArrow}>
                <Text style={styles.cardArrowText}>→</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.navy },
  back:         { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 2 },
  backText:     { color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: "600" },
  content:      { flex: 1, paddingHorizontal: 22, paddingTop: 20 },
  title:        { color: colors.white, fontSize: 34, fontWeight: "800", letterSpacing: -0.8, lineHeight: 40, marginBottom: 8 },
  sub:          { color: "rgba(255,255,255,0.4)", fontSize: 14, fontWeight: "500", marginBottom: 32 },
  options:      { gap: 14 },
  card: {
    backgroundColor: colors.white,
    borderRadius:    22,
    padding:         22,
    flexDirection:   "row",
    alignItems:      "center",
    gap:             16,
    shadowColor:     "#000",
    shadowOpacity:   0.1,
    shadowRadius:    16,
    shadowOffset:    { width: 0, height: 6 },
    elevation:       4,
  },
  cardIconBox:  {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: "rgba(245,158,11,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  cardLabel:    { color: colors.navy, fontWeight: "800", fontSize: 17, marginBottom: 4, letterSpacing: -0.3 },
  cardDesc:     { color: colors.slate, fontSize: 13, lineHeight: 18 },
  cardArrow:    { width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(15,23,42,0.06)", alignItems: "center", justifyContent: "center" },
  cardArrowText:{ color: colors.navy, fontSize: 16, fontWeight: "700" },
});
