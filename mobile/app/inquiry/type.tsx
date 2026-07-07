import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, AlertCircle, HelpCircle } from "lucide-react-native";
import { colors } from "@/lib/colors";
import { useApp, type InquiryType } from "@/lib/context";
import { StepProgress } from "@/components/ui/StepProgress";

const options: { type: InquiryType; label: string; desc: string; icon: typeof AlertCircle }[] = [
  { type: "issue",   label: "Issue",   desc: "Something needs fixing or repairing", icon: AlertCircle },
  { type: "inquiry", label: "Inquiry", desc: "Looking for a quote or project work",  icon: HelpCircle  },
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
        <ArrowLeft color="rgba(255,255,255,0.6)" size={20} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>What do you need help with?</Text>
        <Text style={styles.sub}>Select the type of inquiry</Text>

        <View style={styles.options}>
          {options.map(({ type, label, desc, icon: Icon }) => (
            <TouchableOpacity
              key={type}
              style={styles.optionCard}
              onPress={() => handleSelect(type)}
              activeOpacity={0.85}
            >
              <View style={styles.optionIcon}>
                <Icon color={colors.amber} size={24} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionLabel}>{label}</Text>
                <Text style={styles.optionDesc}>{desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.navy },
  back:        { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 4 },
  backText:    { color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: "500" },
  content:     { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  title:       { color: colors.white, fontSize: 24, fontWeight: "700", marginBottom: 6 },
  sub:         { color: "rgba(255,255,255,0.55)", fontSize: 15, marginBottom: 28 },
  options:     { gap: 14 },
  optionCard:  {
    backgroundColor: colors.white,
    borderRadius:    18,
    padding:         20,
    flexDirection:   "row",
    alignItems:      "center",
    gap:             16,
    shadowColor:     "#000",
    shadowOpacity:   0.07,
    shadowRadius:    8,
    shadowOffset:    { width: 0, height: 3 },
    elevation:       3,
  },
  optionIcon:  {
    width:           52, height: 52, borderRadius: 14,
    backgroundColor: "rgba(245,158,11,0.12)",
    alignItems:      "center", justifyContent: "center",
  },
  optionLabel: { color: colors.navy, fontWeight: "700", fontSize: 17, marginBottom: 3 },
  optionDesc:  { color: colors.slate, fontSize: 13 },
});
