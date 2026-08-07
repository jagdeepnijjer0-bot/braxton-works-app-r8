import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Wrench, FileText } from "lucide-react-native";
import { colors } from "@/lib/colors";
import { useApp, type InquiryType } from "@/lib/context";
import { StepProgress } from "@/components/ui/StepProgress";

const options: { type: InquiryType; label: string; desc: string; icon: typeof Wrench; accent: string }[] = [
  {
    type:  "issue",
    label: "Report an Issue",
    desc:  "Something needs fixing or repairing",
    icon:  Wrench,
    accent: "rgba(239,68,68,0.1)",
  },
  {
    type:  "enquiry",
    label: "Request a Quote",
    desc:  "Looking for a quote or project work",
    icon:  FileText,
    accent: "rgba(245,158,11,0.1)",
  },
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
        <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
          What do you need help with?
        </Text>
        <Text style={styles.sub}>Select the type of enquiry</Text>

        <View style={styles.options}>
          {options.map(({ type, label, desc, icon: Icon, accent }) => (
            <TouchableOpacity
              key={type}
              style={styles.card}
              onPress={() => handleSelect(type)}
              activeOpacity={0.82}
            >
              {/* Icon box with coloured tint per card */}
              <View style={[styles.cardIconBox, { backgroundColor: accent }]}>
                <Icon color={colors.amber} size={28} strokeWidth={2} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.cardLabel}>{label}</Text>
                <Text style={styles.cardDesc}>{desc}</Text>
              </View>

              {/* Amber chevron arrow */}
              <View style={styles.cardArrow}>
                <Text style={styles.cardArrowText}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.navy },
  back:    { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 2 },
  backText:{ color: colors.muted, fontSize: 14, fontWeight: "600" },
  content: { flex: 1, paddingHorizontal: 22, paddingTop: 20 },

  title: {
    color:         colors.white,
    fontSize:      32,
    fontWeight:    "800",
    letterSpacing: -0.7,
    marginBottom:  8,
  },
  sub: {
    color:         colors.muted,
    fontSize:      15,
    fontWeight:    "400",
    lineHeight:    22,
    marginBottom:  28,  // larger gap between subtitle and first card (#6)
  },

  options: { gap: 14 },

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
  cardIconBox: {
    width:          60,
    height:         60,
    borderRadius:   18,
    alignItems:     "center",
    justifyContent: "center",
  },
  cardLabel:     { color: colors.navy, fontWeight: "800", fontSize: 17, marginBottom: 4, letterSpacing: -0.3 },
  cardDesc:      { color: colors.slate, fontSize: 13, lineHeight: 18 },
  cardArrow:     { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.amber, alignItems: "center", justifyContent: "center" },
  cardArrowText: { color: colors.navy, fontSize: 20, fontWeight: "800", lineHeight: 22 },
});
